"""
Multi-view fusion engine.

Different views contribute differently to each measurement.
View-type → measurement contribution weights:

  palm_front / back-hand → palm width, finger lengths (high weight)
  palm-side             → thickness, girth (high weight)
  wrist                 → wrist dimensions
  fingers / fist        → finger lengths, joint angles
  wrist-rotation / thumb → thumb-specific measurements

Fusion applies:
  1. Per-view quality weighting (blur × visibility)
  2. View-type semantic weighting (some views are better for some dimensions)
  3. Outlier rejection (Winsorize at 1.5× IQR)
  4. Confidence-weighted mean
"""

from __future__ import annotations

import numpy as np
from dataclasses import dataclass, field
from typing import Optional

from .metric_calculator import RawMeasurements


# ── View-type semantic weights per measurement ───────────────────────────────
# Structure: view_type → {measurement_name → weight_multiplier}
VIEW_WEIGHTS: dict[str, dict[str, float]] = {
    "palm-front": {
        "palm_width_mm":   1.0,
        "palm_length_mm":  0.9,
        "index_length_mm": 1.0,
        "middle_length_mm":1.0,
        "ring_length_mm":  0.9,
        "pinky_length_mm": 0.9,
        "thumb_length_mm": 0.7,
    },
    "back-hand": {
        "palm_width_mm":   0.9,
        "palm_length_mm":  0.8,
        "index_length_mm": 0.9,
        "middle_length_mm":0.9,
        "ring_length_mm":  0.9,
        "pinky_length_mm": 0.9,
        "thumb_length_mm": 0.5,
    },
    "palm-side": {
        "palm_width_mm":   0.2,
        "palm_length_mm":  0.7,
        "index_length_mm": 0.4,
        "middle_length_mm":0.4,
        "ring_length_mm":  0.3,
        "pinky_length_mm": 0.3,
        "thumb_length_mm": 0.3,
    },
    "fingers": {
        "palm_width_mm":   0.8,
        "palm_length_mm":  0.6,
        "index_length_mm": 1.0,
        "middle_length_mm":1.0,
        "ring_length_mm":  1.0,
        "pinky_length_mm": 1.0,
        "thumb_length_mm": 0.8,
    },
    "thumb": {
        "thumb_length_mm": 1.0,
        "palm_width_mm":   0.3,
        "palm_length_mm":  0.4,
    },
    "wrist": {
        "palm_length_mm":  0.7,
        "palm_width_mm":   0.3,
    },
    "wrist-rotation": {
        "palm_length_mm":  0.5,
        "palm_width_mm":   0.2,
    },
    "fist": {
        "palm_width_mm":   0.6,
        "palm_length_mm":  0.5,
        "index_length_mm": 0.3,
        "middle_length_mm":0.3,
        "ring_length_mm":  0.3,
        "pinky_length_mm": 0.3,
    },
}

# Fallback weight when view_type not in table
_DEFAULT_VIEW_WEIGHT = 0.5

# Plausible physiological ranges in mm (adult hands)
PLAUSIBLE_RANGES = {
    "palm_width_mm":   (55.0, 110.0),
    "palm_length_mm":  (85.0, 130.0),
    "thumb_length_mm": (40.0, 75.0),
    "index_length_mm": (55.0, 100.0),
    "middle_length_mm":(60.0, 105.0),
    "ring_length_mm":  (55.0, 100.0),
    "pinky_length_mm": (40.0, 85.0),
}

MEASUREMENT_KEYS = list(PLAUSIBLE_RANGES.keys())
GIRTH_FINGERS = ["thumb", "index", "middle", "ring", "pinky"]


@dataclass
class FusedMeasurements:
    palm_width_mm:    float = 0.0
    palm_length_mm:   float = 0.0
    thumb_length_mm:  float = 0.0
    index_length_mm:  float = 0.0
    middle_length_mm: float = 0.0
    ring_length_mm:   float = 0.0
    pinky_length_mm:  float = 0.0

    # Girths (only from side view; may be absent)
    thumb_girth_mm:   Optional[float] = None
    index_girth_mm:   Optional[float] = None
    middle_girth_mm:  Optional[float] = None
    ring_girth_mm:    Optional[float] = None
    pinky_girth_mm:   Optional[float] = None

    # Per-measurement confidence (0-1)
    confidence_per_key: dict[str, float] = field(default_factory=dict)
    overall_confidence: float = 0.0

    def to_dict(self) -> dict:
        d = {
            "palm_width_mm":    round(self.palm_width_mm, 1),
            "palm_length_mm":   round(self.palm_length_mm, 1),
            "thumb_length_mm":  round(self.thumb_length_mm, 1),
            "index_length_mm":  round(self.index_length_mm, 1),
            "middle_length_mm": round(self.middle_length_mm, 1),
            "ring_length_mm":   round(self.ring_length_mm, 1),
            "pinky_length_mm":  round(self.pinky_length_mm, 1),
        }
        girth_keys = ["thumb_girth_mm", "index_girth_mm", "middle_girth_mm",
                      "ring_girth_mm", "pinky_girth_mm"]
        for k in girth_keys:
            v = getattr(self, k)
            if v is not None:
                d[k] = round(v, 1)
        d["confidence_score"] = round(self.overall_confidence, 3)
        d["confidence_per_key"] = {k: round(v, 3) for k, v in self.confidence_per_key.items()}
        return d


def _reject_outliers(values: list[float]) -> list[float]:
    """Remove outliers using 1.5 × IQR rule. Returns cleaned list."""
    if len(values) < 3:
        return values
    arr = np.array(values)
    q1, q3 = np.percentile(arr, 25), np.percentile(arr, 75)
    iqr = q3 - q1
    lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    cleaned = [v for v in values if lo <= v <= hi]
    return cleaned if cleaned else values


def _weighted_mean(values: list[float], weights: list[float]) -> float:
    if not values:
        return 0.0
    w = np.array(weights, dtype=float)
    v = np.array(values, dtype=float)
    total = w.sum()
    if total < 1e-9:
        return float(v.mean())
    return float((v * w).sum() / total)


def _confidence_from_spread(values: list[float], n_views: int) -> float:
    """
    Confidence = 1 - (std / mean), penalised for low view count.
    Capped to [0, 1].
    """
    if not values or len(values) < 2:
        return 0.3 if values else 0.0
    arr = np.array(values)
    mean = arr.mean()
    if mean < 1e-3:
        return 0.0
    cv = arr.std() / mean             # coefficient of variation
    spread_score = max(0.0, 1.0 - cv * 5.0)   # penalise high variance
    view_score = min(1.0, n_views / 4.0)       # more views = more confidence
    return float(spread_score * 0.7 + view_score * 0.3)


def fuse(raw_list: list[RawMeasurements]) -> FusedMeasurements:
    """
    Fuse measurements from multiple views into a single best estimate.

    Steps:
      1. Filter implausible values per measurement key
      2. Reject statistical outliers
      3. Compute view-type × quality weighted mean
      4. Compute per-key and overall confidence
    """
    result = FusedMeasurements()
    confidences: dict[str, float] = {}

    for key in MEASUREMENT_KEYS:
        lo, hi = PLAUSIBLE_RANGES[key]
        values: list[float] = []
        weights: list[float] = []

        for raw in raw_list:
            val = getattr(raw, key, None)
            if val is None or val <= 0.0:
                continue
            # Plausibility gate
            if not (lo <= val <= hi):
                continue

            view_w = VIEW_WEIGHTS.get(raw.view_type, {}).get(key, _DEFAULT_VIEW_WEIGHT)
            combined_w = raw.quality_weight * view_w
            values.append(val)
            weights.append(combined_w)

        if not values:
            confidences[key] = 0.0
            continue

        # Outlier rejection
        if len(values) >= 3:
            pairs = sorted(zip(weights, values), key=lambda p: p[1])
            cleaned = _reject_outliers([v for _, v in pairs])
            clean_weights = [w for w, v in pairs if v in cleaned]
            # Preserve original weights for cleaned values
        else:
            cleaned, clean_weights = values, weights

        fused_val = _weighted_mean(cleaned, clean_weights)
        setattr(result, key, round(fused_val, 2))
        confidences[key] = _confidence_from_spread(cleaned, len(cleaned))

    # ── Girths (from side-view raw measurements) ────────────────────────────
    for raw in raw_list:
        if raw.view_type == "palm-side" and raw.finger_girths_mm:
            for finger in GIRTH_FINGERS:
                girth = raw.finger_girths_mm.get(finger)
                if girth and 20.0 <= girth <= 120.0:
                    setattr(result, f"{finger}_girth_mm", round(girth, 1))

    # ── Overall confidence ───────────────────────────────────────────────────
    conf_values = list(confidences.values())
    result.confidence_per_key = confidences
    result.overall_confidence = float(np.mean(conf_values)) if conf_values else 0.0

    return result
