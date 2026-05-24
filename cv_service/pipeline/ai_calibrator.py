"""
AI calibration layer — XGBoost regression model that corrects raw
MediaPipe + depth estimates to ergonomically accurate millimetre values.

Input features (per measurement):
  - raw estimated value
  - confidence score from fusion
  - number of valid views used
  - palm_width / palm_length ratio (shape normalisation)
  - overall quality weight

Output: calibrated measurement in mm

One model is trained per measurement dimension (7 models total).
Models are stored as a single joblib bundle.

If no trained model bundle exists, falls through to a bias-corrected
identity function (raw value × per-dimension scale factor).
"""

from __future__ import annotations

import os
import logging
import numpy as np
import joblib

from pathlib import Path
from dataclasses import dataclass

from .fusion_engine import FusedMeasurements

logger = logging.getLogger(__name__)

# Path to bundled models directory
_MODEL_DIR = Path(__file__).parent.parent / "models"
_BUNDLE_PATH = _MODEL_DIR / "xgboost_calibrator.joblib"

# Known bias correction factors derived from empirical testing.
# MediaPipe + monocular depth tends to over-estimate by ~3-8%.
_BIAS_CORRECTION = {
    "palm_width_mm":    0.97,
    "palm_length_mm":   0.96,
    "thumb_length_mm":  0.95,
    "index_length_mm":  0.95,
    "middle_length_mm": 0.95,
    "ring_length_mm":   0.95,
    "pinky_length_mm":  0.96,
}

MEASUREMENT_KEYS = list(_BIAS_CORRECTION.keys())


@dataclass
class CalibrationBundle:
    models: dict    # key → XGBRegressor
    feature_names: list[str]


def _build_feature_vector(
    key: str,
    raw_value: float,
    confidence: float,
    n_views: int,
    palm_width: float,
    palm_length: float,
    overall_confidence: float,
) -> np.ndarray:
    """Construct the feature vector for a single measurement prediction."""
    # Normalised shape ratio
    shape_ratio = palm_width / max(palm_length, 1.0)
    # Relative value (normalise by palm width)
    rel_value = raw_value / max(palm_width, 1.0)

    return np.array([
        raw_value,
        confidence,
        float(n_views),
        palm_width,
        palm_length,
        shape_ratio,
        rel_value,
        overall_confidence,
    ], dtype=np.float32)


class AICalibrator:
    """
    Wraps XGBoost models for inference.
    Falls back to bias-corrected identity if no model bundle exists.
    """

    def __init__(self):
        self._bundle: CalibrationBundle | None = None
        self._load_models()

    def _load_models(self):
        if _BUNDLE_PATH.exists():
            try:
                self._bundle = joblib.load(_BUNDLE_PATH)
                logger.info("Loaded XGBoost calibration bundle from %s", _BUNDLE_PATH)
            except Exception as exc:
                logger.warning("Failed to load calibration models: %s. Using bias correction.", exc)
        else:
            logger.info(
                "No calibration model bundle found at %s. Using bias-corrected identity.",
                _BUNDLE_PATH,
            )

    def calibrate(self, fused: FusedMeasurements) -> FusedMeasurements:
        """
        Apply calibration to all measurement keys in a FusedMeasurements object.
        Returns a new FusedMeasurements with corrected values.
        """
        import copy
        result = copy.deepcopy(fused)

        palm_width = fused.palm_width_mm
        palm_length = fused.palm_length_mm
        overall_conf = fused.overall_confidence
        n_views = sum(1 for k in MEASUREMENT_KEYS if getattr(fused, k, 0) > 0)

        for key in MEASUREMENT_KEYS:
            raw_val = getattr(fused, key, 0.0)
            if raw_val <= 0.0:
                continue

            key_conf = fused.confidence_per_key.get(key, 0.0)

            if self._bundle and key in self._bundle.models:
                feat = _build_feature_vector(
                    key, raw_val, key_conf, n_views,
                    palm_width, palm_length, overall_conf,
                )
                try:
                    predicted = float(
                        self._bundle.models[key].predict(feat.reshape(1, -1))[0]
                    )
                    # Sanity check: reject wildly different predictions
                    if abs(predicted - raw_val) / max(raw_val, 1.0) < 0.30:
                        setattr(result, key, round(predicted, 1))
                        continue
                except Exception as exc:
                    logger.warning("XGBoost prediction failed for %s: %s", key, exc)

            # Fallback: bias correction
            factor = _BIAS_CORRECTION.get(key, 1.0)
            setattr(result, key, round(raw_val * factor, 1))

        return result

    def ingest_ground_truth(
        self,
        ground_truth_mm: dict[str, float],
        estimated_mm: dict[str, float],
        capture_metadata: dict,
    ) -> None:
        """
        Save a ground-truth training sample to disk for future retraining.
        Does NOT retrain inline — use the /calibrate endpoint to batch-retrain.
        """
        import json, time
        _MODEL_DIR.mkdir(parents=True, exist_ok=True)
        sample_path = _MODEL_DIR / f"gt_sample_{int(time.time())}.json"
        sample = {
            "ground_truth_mm": ground_truth_mm,
            "estimated_mm": estimated_mm,
            "capture_metadata": capture_metadata,
        }
        sample_path.write_text(json.dumps(sample, indent=2))
        logger.info("Ground truth sample saved to %s", sample_path)

    def retrain(self) -> dict:
        """
        Load all saved ground-truth samples and retrain XGBoost models.
        Returns a dict of per-key training metrics.
        """
        import json
        from xgboost import XGBRegressor
        from sklearn.model_selection import cross_val_score

        sample_files = list(_MODEL_DIR.glob("gt_sample_*.json"))
        if len(sample_files) < 10:
            return {"error": f"Need at least 10 ground-truth samples, have {len(sample_files)}"}

        # Load samples
        samples = []
        for f in sample_files:
            try:
                samples.append(json.loads(f.read_text()))
            except Exception:
                pass

        metrics = {}
        models = {}

        for key in MEASUREMENT_KEYS:
            X, y = [], []
            for s in samples:
                gt = s["ground_truth_mm"].get(key)
                est = s["estimated_mm"].get(key)
                if gt is None or est is None or gt <= 0 or est <= 0:
                    continue

                palm_w = s["estimated_mm"].get("palm_width_mm", 80.0)
                palm_l = s["estimated_mm"].get("palm_length_mm", 100.0)
                conf = s.get("capture_metadata", {}).get("confidence", 0.5)
                n_v = s.get("capture_metadata", {}).get("n_views", 4)

                feat = _build_feature_vector(
                    key, est, conf, n_v, palm_w, palm_l, conf
                )
                X.append(feat)
                y.append(gt)

            if len(X) < 5:
                metrics[key] = {"status": "skipped", "n_samples": len(X)}
                continue

            X_arr = np.array(X)
            y_arr = np.array(y)

            model = XGBRegressor(
                n_estimators=200,
                max_depth=4,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1,
            )
            model.fit(X_arr, y_arr)
            scores = cross_val_score(model, X_arr, y_arr, cv=min(5, len(X)), scoring="neg_mean_absolute_error")
            mae = float(-scores.mean())

            models[key] = model
            metrics[key] = {
                "status": "trained",
                "n_samples": len(X),
                "cv_mae_mm": round(mae, 2),
            }

        if models:
            _MODEL_DIR.mkdir(parents=True, exist_ok=True)
            bundle = CalibrationBundle(models=models, feature_names=[
                "raw_value", "confidence", "n_views",
                "palm_width", "palm_length", "shape_ratio",
                "rel_value", "overall_confidence",
            ])
            joblib.dump(bundle, _BUNDLE_PATH)
            self._bundle = bundle
            logger.info("Retrained and saved calibration bundle to %s", _BUNDLE_PATH)

        return metrics
