"""
Quality scorer — evaluates each captured frame before running MediaPipe.
Returns blur score, lighting score, and hand visibility estimate.
"""

import cv2
import numpy as np
from dataclasses import dataclass


@dataclass
class FrameQuality:
    blur_score: float          # 0-1, higher = sharper
    lighting_score: float      # 0-1, higher = better exposure
    hand_visibility: float     # 0-1, estimated skin coverage in centre zone
    is_acceptable: bool
    rejection_reason: str | None


# Minimum thresholds to pass quality gate
_MIN_BLUR = 0.30
_MIN_LIGHTING = 0.25
_MIN_VISIBILITY = 0.04          # ≥4% of frame pixels must be skin-like


def _laplacian_blur_score(gray: np.ndarray) -> float:
    """
    Laplacian variance normalised to 0-1.
    Empirically: variance < 50 → blurry, > 300 → sharp.
    """
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    score = float(np.clip(variance / 300.0, 0.0, 1.0))
    return score


def _lighting_score(bgr: np.ndarray) -> float:
    """
    Histogram-based exposure assessment.
    Penalises heavily over/under-exposed images.
    Returns 0-1.
    """
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    v_channel = hsv[:, :, 2].astype(np.float32)
    mean_v = float(v_channel.mean())
    std_v = float(v_channel.std())

    # Ideal: mean brightness 90-180, std > 20 (not flat)
    brightness_ok = np.clip((mean_v - 30) / 150.0, 0.0, 1.0)
    contrast_ok = np.clip(std_v / 60.0, 0.0, 1.0)
    return float((brightness_ok + contrast_ok) / 2.0)


def _skin_coverage(bgr: np.ndarray) -> float:
    """
    Estimates fraction of centre-zone pixels that are skin-like.
    Uses YCrCb colour space — robust across skin tones.
    """
    h, w = bgr.shape[:2]
    # Central 60% of the frame
    y0, y1 = int(h * 0.15), int(h * 0.85)
    x0, x1 = int(w * 0.10), int(w * 0.90)
    roi = bgr[y0:y1, x0:x1]

    ycrcb = cv2.cvtColor(roi, cv2.COLOR_BGR2YCrCb)
    # Broad skin range across diverse skin tones
    lower = np.array([0, 133, 77], dtype=np.uint8)
    upper = np.array([255, 173, 127], dtype=np.uint8)
    mask = cv2.inRange(ycrcb, lower, upper)

    skin_pixels = int(mask.sum() / 255)
    total_pixels = roi.shape[0] * roi.shape[1]
    return float(skin_pixels / max(total_pixels, 1))


def score_frame(image_path: str) -> FrameQuality:
    """
    Load an image from disk and return its quality assessment.
    """
    bgr = cv2.imread(image_path)
    if bgr is None:
        return FrameQuality(
            blur_score=0.0,
            lighting_score=0.0,
            hand_visibility=0.0,
            is_acceptable=False,
            rejection_reason="Could not decode image file",
        )

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    blur = _laplacian_blur_score(gray)
    lighting = _lighting_score(bgr)
    visibility = _skin_coverage(bgr)

    rejection_reason: str | None = None
    if blur < _MIN_BLUR:
        rejection_reason = f"Image too blurry (score={blur:.2f}, min={_MIN_BLUR})"
    elif lighting < _MIN_LIGHTING:
        rejection_reason = f"Poor lighting (score={lighting:.2f}, min={_MIN_LIGHTING})"
    elif visibility < _MIN_VISIBILITY:
        rejection_reason = f"Hand not visible in centre zone (score={visibility:.3f}, min={_MIN_VISIBILITY})"

    return FrameQuality(
        blur_score=round(blur, 3),
        lighting_score=round(lighting, 3),
        hand_visibility=round(visibility, 3),
        is_acceptable=rejection_reason is None,
        rejection_reason=rejection_reason,
    )


def score_frame_array(bgr: np.ndarray) -> FrameQuality:
    """Score from an already-loaded BGR numpy array."""
    if bgr is None or bgr.size == 0:
        return FrameQuality(0.0, 0.0, 0.0, False, "Empty array")
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    blur = _laplacian_blur_score(gray)
    lighting = _lighting_score(bgr)
    visibility = _skin_coverage(bgr)
    rejection_reason = None
    if blur < _MIN_BLUR:
        rejection_reason = f"Image too blurry (score={blur:.2f})"
    elif lighting < _MIN_LIGHTING:
        rejection_reason = f"Poor lighting (score={lighting:.2f})"
    elif visibility < _MIN_VISIBILITY:
        rejection_reason = f"Hand not visible (score={visibility:.3f})"
    return FrameQuality(
        blur_score=round(blur, 3),
        lighting_score=round(lighting, 3),
        hand_visibility=round(visibility, 3),
        is_acceptable=rejection_reason is None,
        rejection_reason=rejection_reason,
    )
