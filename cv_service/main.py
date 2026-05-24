"""
FastAPI CV Microservice — main application entry point.

Endpoints:
  GET  /health
  POST /analyze          — trigger full pipeline for a job_id
  GET  /results/{job_id} — fetch completed results
  GET  /status/{job_id}  — poll processing state
  POST /calibrate        — ingest ground-truth + trigger retraining
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from pipeline import (
    LandmarkExtractor,
    DepthEstimator,
    MetricCalculator,
    AICalibrator,
    score_frame,
    fuse,
    focal_length_from_exif,
)
from pipeline.glove_sizing import build_glove_calibration
from schemas import AnalyzeRequest, GroundTruthSample, MeasurementResult, StatusResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Global singletons (loaded once at startup) ────────────────────────────────
_landmark_extractor: Optional[LandmarkExtractor] = None
_depth_estimator:    Optional[DepthEstimator]    = None
_ai_calibrator:      Optional[AICalibrator]      = None

# ── In-memory job registry (replace with Redis/DB for production scale) ───────
# Structure: job_id → {"status": str, "result": dict | None, "error": str | None}
_job_registry: dict[str, dict] = {}
_registry_lock = asyncio.Lock()

# View type ordering matching the mobile app's scan postures
VIEW_TYPE_MAP = {
    "frame_1": "wrist",
    "frame_2": "palm-front",
    "frame_3": "palm-side",
    "frame_4": "fingers",
    "frame_5": "fist",
    "frame_6": "wrist-rotation",
    "frame_7": "thumb",
    "frame_8": "back-hand",
}

STORAGE_BASE = os.getenv("STORAGE_BASE", "storage")
DB_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/smartgrip")
RUST_BACKEND_URL = os.getenv("RUST_BACKEND_URL", "http://localhost:3000")


def _resolve_storage_base(storage_base: str) -> Path:
    """Resolve the scan storage directory across common repo layouts."""
    raw_path = Path(storage_base)
    if raw_path.is_absolute() and raw_path.exists():
        return raw_path

    service_dir = Path(__file__).resolve().parent
    repo_root = service_dir.parent

    candidates = [
        raw_path,
        service_dir / raw_path,
        repo_root / raw_path,
        repo_root / "backend" / raw_path,
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return candidates[0]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load heavy models at startup, release at shutdown."""
    global _landmark_extractor, _depth_estimator, _ai_calibrator
    logger.info("Loading CV pipeline models…")
    _landmark_extractor = LandmarkExtractor(static_image_mode=True, max_num_hands=1)
    _depth_estimator    = DepthEstimator()
    _ai_calibrator      = AICalibrator()
    logger.info("CV pipeline ready.")
    yield
    if _landmark_extractor:
        _landmark_extractor.close()
    logger.info("CV pipeline shutdown complete.")


app = FastAPI(
    title="Hand Measurement CV Service",
    version="1.0.0",
    description="MediaPipe + MiDaS depth + XGBoost calibration pipeline for assistive glove fitting.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "hand-measurement-cv",
        "models_loaded": _depth_estimator is not None,
    }


# ── Core Pipeline ─────────────────────────────────────────────────────────────

def _run_pipeline(job_id: str, patient_id: str, storage_base: str) -> dict:
    """
    Synchronous pipeline — runs in a thread pool via asyncio.to_thread.
    Returns the final measurement dict.
    """
    job_dir = _resolve_storage_base(storage_base) / job_id
    if not job_dir.exists():
        raise FileNotFoundError(f"Job directory not found: {job_dir}")

    from pipeline.metric_calculator import RawMeasurements

    raw_measurements_list = []
    frame_quality_log = []
    views_rejected = 0

    calculator = MetricCalculator(_depth_estimator)

    for frame_key, view_type in VIEW_TYPE_MAP.items():
        image_path = job_dir / f"{frame_key}.jpg"
        if not image_path.exists():
            logger.warning("Frame missing: %s", image_path)
            views_rejected += 1
            continue

        # ── 1. Quality gate ──────────────────────────────────────────────
        quality = score_frame(str(image_path))
        frame_quality_log.append({
            "frame": frame_key,
            "view_type": view_type,
            "blur_score": quality.blur_score,
            "lighting_score": quality.lighting_score,
            "hand_visibility": quality.hand_visibility,
            "accepted": quality.is_acceptable,
            "rejection_reason": quality.rejection_reason,
        })

        if not quality.is_acceptable:
            logger.info("Frame %s rejected: %s", frame_key, quality.rejection_reason)
            views_rejected += 1
            continue

        # ── 2. Load image ────────────────────────────────────────────────
        bgr = cv2.imread(str(image_path))
        if bgr is None:
            views_rejected += 1
            continue

        h, w = bgr.shape[:2]

        # ── 3. Focal length estimate ─────────────────────────────────────
        focal_px = focal_length_from_exif(str(image_path), w)
        if focal_px is None:
            # Heuristic: 70° HFOV typical phone camera
            import math
            focal_px = w / (2.0 * math.tan(math.radians(35.0)))

        # ── 4. Landmark extraction ───────────────────────────────────────
        landmarks = _landmark_extractor.extract_from_array(bgr, view_type)
        if landmarks is None:
            logger.info("No hand landmarks detected in %s (%s)", frame_key, view_type)
            views_rejected += 1
            continue

        # ── 5. Depth estimation (metric) ─────────────────────────────────
        palm_width_px = landmarks.pixel_distance("index_mcp", "pinky_mcp")
        depth_map = _depth_estimator.estimate_metric(
            bgr,
            palm_width_px=max(palm_width_px, 1.0),
            focal_length_px=focal_px,
        )

        # ── 6. Metric calculation ────────────────────────────────────────
        quality_weight = (
            quality.blur_score * 0.4 +
            quality.lighting_score * 0.3 +
            quality.hand_visibility * 0.3
        )
        raw = calculator.compute(landmarks, depth_map, focal_px, quality_weight)

        # Girth from side view only
        if view_type == "palm-side":
            raw.finger_girths_mm = calculator.compute_girths_from_side(
                bgr, landmarks, depth_map, focal_px
            )

        raw_measurements_list.append(raw)
        logger.info(
            "Frame %s (%s): palm_w=%.1fmm palm_l=%.1fmm idx=%.1fmm",
            frame_key, view_type,
            raw.palm_width_mm or 0,
            raw.palm_length_mm or 0,
            raw.index_length_mm or 0,
        )

    if not raw_measurements_list:
        raise ValueError("No valid frames could be processed. All views were rejected.")

    # ── 7. Multi-view fusion ─────────────────────────────────────────────────
    fused = fuse(raw_measurements_list)
    logger.info(
        "Fused: palm_w=%.1f palm_l=%.1f index=%.1f middle=%.1f confidence=%.2f",
        fused.palm_width_mm, fused.palm_length_mm,
        fused.index_length_mm, fused.middle_length_mm,
        fused.overall_confidence,
    )

    # ── 8. AI calibration ────────────────────────────────────────────────────
    calibrated = _ai_calibrator.calibrate(fused)

    # ── 9. Glove sizing + actuator/sensor positions ──────────────────────────
    glove_cal = build_glove_calibration(calibrated)

    # ── 10. Build final result ───────────────────────────────────────────────
    result = {
        "patient_id": patient_id,
        "job_id": job_id,
        "palm_width_mm":    calibrated.palm_width_mm,
        "palm_length_mm":   calibrated.palm_length_mm,
        "thumb_length_mm":  calibrated.thumb_length_mm,
        "index_length_mm":  calibrated.index_length_mm,
        "middle_length_mm": calibrated.middle_length_mm,
        "ring_length_mm":   calibrated.ring_length_mm,
        "pinky_length_mm":  calibrated.pinky_length_mm,
        "finger_girths_mm": {
            "thumb":  calibrated.thumb_girth_mm,
            "index":  calibrated.index_girth_mm,
            "middle": calibrated.middle_girth_mm,
            "ring":   calibrated.ring_girth_mm,
            "pinky":  calibrated.pinky_girth_mm,
        },
        "confidence_score":   calibrated.overall_confidence,
        "confidence_per_key": calibrated.confidence_per_key,
        "glove_calibration":  glove_cal,
        "frame_quality":      frame_quality_log,
        "views_used":         len(raw_measurements_list),
        "views_rejected":     views_rejected,
    }

    return result


async def _pipeline_task(job_id: str, patient_id: str, storage_base: str):
    """
    Async wrapper: runs the CPU-bound pipeline in a thread pool,
    then updates the job registry and notifies the Rust backend.
    """
    async with _registry_lock:
        _job_registry[job_id] = {"status": "processing", "result": None, "error": None}

    try:
        result = await asyncio.to_thread(_run_pipeline, job_id, patient_id, storage_base)

        async with _registry_lock:
            _job_registry[job_id] = {"status": "done", "result": result, "error": None}

        # Notify the Rust backend so it can persist to PostgreSQL
        await _notify_rust_backend(job_id, result)

    except Exception as exc:
        logger.exception("Pipeline failed for job %s", job_id)
        async with _registry_lock:
            _job_registry[job_id] = {
                "status": "failed",
                "result": None,
                "error": str(exc),
            }


async def _notify_rust_backend(job_id: str, result: dict):
    """
    POST the completed result to the Rust backend for PostgreSQL persistence.
    Fire-and-forget — CV service doesn't block on this.
    """
    import httpx
    url = f"{RUST_BACKEND_URL}/api/v1/tailor/cv_result"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json={"job_id": job_id, "result": result})
            if resp.status_code not in (200, 201, 204):
                logger.warning("Rust backend notification returned %d", resp.status_code)
    except Exception as exc:
        logger.warning("Could not notify Rust backend for job %s: %s", job_id, exc)


# ── API Endpoints ─────────────────────────────────────────────────────────────

@app.post("/analyze", status_code=202)
async def analyze(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Trigger the full CV pipeline for a job_id.
    Returns 202 Accepted immediately; poll /status/{job_id} for completion.
    """
    async with _registry_lock:
        existing = _job_registry.get(req.job_id)

    if existing and existing["status"] in ("processing", "done"):
        return {"job_id": req.job_id, "status": existing["status"], "message": "Already queued or done."}

    background_tasks.add_task(
        _pipeline_task,
        req.job_id,
        req.patient_id,
        req.storage_base,
    )
    return {"job_id": req.job_id, "status": "queued", "message": "Pipeline started."}


@app.get("/status/{job_id}", response_model=StatusResponse)
async def get_status(job_id: str):
    """Poll for pipeline processing state."""
    async with _registry_lock:
        entry = _job_registry.get(job_id)

    if entry is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    return StatusResponse(
        job_id=job_id,
        status=entry["status"],
        error_message=entry.get("error"),
    )


@app.get("/results/{job_id}")
async def get_results(job_id: str):
    """Fetch completed measurement results for a job."""
    async with _registry_lock:
        entry = _job_registry.get(job_id)

    if entry is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    if entry["status"] == "processing":
        raise HTTPException(status_code=202, detail="Pipeline still processing. Try again shortly.")

    if entry["status"] == "failed":
        raise HTTPException(
            status_code=422,
            detail=entry.get("error") or "Pipeline failed with no error message.",
        )

    return entry["result"]


@app.post("/calibrate")
async def ingest_calibration(sample: GroundTruthSample, background_tasks: BackgroundTasks):
    """
    Ingest a ground-truth tape-measured sample.
    Optionally triggers model retraining if enough samples exist (≥10).
    """
    if _ai_calibrator is None:
        raise HTTPException(status_code=503, detail="Calibrator not initialised.")

    _ai_calibrator.ingest_ground_truth(
        ground_truth_mm=sample.ground_truth_mm,
        estimated_mm=sample.estimated_mm,
        capture_metadata=sample.capture_metadata or {},
    )

    # Attempt retraining in background
    async def _retrain():
        metrics = await asyncio.to_thread(_ai_calibrator.retrain)
        logger.info("Retraining result: %s", metrics)

    background_tasks.add_task(_retrain)

    return {"status": "sample_ingested", "message": "Ground-truth sample saved. Retraining queued."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        workers=1,    # Single worker — models are not fork-safe
    )
