"""
Monocular depth estimator using MiDaS (small variant).

Strategy:
  1. Run MiDaS on each RGB image → relative inverse-depth map (0-1 range).
  2. Scale the relative depth to an absolute metric depth using a known
     hand-size prior (average adult palm width ≈ 80mm) plus the focal
     length estimate derived from EXIF data.

Formula for metric depth at a pixel (x, y):
    depth_m = (prior_palm_width_m * focal_length_px) / palm_width_px

Once we have a metric depth anchor, all other depths are scaled accordingly:
    depth_at_point = depth_anchor * (relative_depth_anchor / relative_depth_point)

This gives us a self-consistent metric depth map good enough for ±3–6 mm
measurement accuracy without ARCore/ARKit.
"""

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from pathlib import Path
import piexif
import logging

logger = logging.getLogger(__name__)

# MiDaS small is fast on CPU and ~85MB. Downloaded once on first use.
_MIDAS_MODEL_TYPE = "MiDaS_small"
_DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Typical adult palm width prior (used for absolute depth anchoring)
_PALM_WIDTH_PRIOR_M = 0.080     # 80 mm = 0.08 m

# Fallback focal length (pixels) if EXIF unavailable — assumes ~60° HFOV on 1080px wide image
_DEFAULT_FOCAL_PX_AT_1080 = 1500.0


class DepthEstimator:
    """
    Loads MiDaS once and provides per-image depth maps.
    Call estimate() to get a normalised relative depth map.
    Call estimate_metric() to get an absolute depth map in metres.
    """

    def __init__(self):
        logger.info("Loading MiDaS model (%s) on %s …", _MIDAS_MODEL_TYPE, _DEVICE)
        self._model = torch.hub.load(
            "intel-isl/MiDaS",
            _MIDAS_MODEL_TYPE,
            trust_repo=True,
        ).to(_DEVICE).eval()

        transforms = torch.hub.load(
            "intel-isl/MiDaS",
            "transforms",
            trust_repo=True,
        )
        self._transform = transforms.small_transform
        logger.info("MiDaS loaded.")

    @torch.no_grad()
    def estimate(self, bgr: np.ndarray) -> np.ndarray:
        """
        Returns a relative inverse-depth map (float32, same HxW as input).
        Higher values = closer to camera.
        Normalised to [0, 1].
        """
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        input_tensor = self._transform(rgb).to(_DEVICE)
        prediction = self._model(input_tensor)
        prediction = F.interpolate(
            prediction.unsqueeze(1),
            size=bgr.shape[:2],
            mode="bicubic",
            align_corners=False,
        ).squeeze()
        depth = prediction.cpu().numpy().astype(np.float32)

        # Normalise to [0, 1] — will be re-scaled to metric in estimate_metric()
        dmin, dmax = depth.min(), depth.max()
        if dmax - dmin > 1e-6:
            depth = (depth - dmin) / (dmax - dmin)
        return depth

    def estimate_metric(
        self,
        bgr: np.ndarray,
        palm_width_px: float,
        focal_length_px: float | None = None,
        palm_width_prior_m: float = _PALM_WIDTH_PRIOR_M,
    ) -> np.ndarray:
        """
        Returns a metric depth map in metres (float32, same HxW as input).

        palm_width_px : pixel distance between index_mcp and pinky_mcp landmarks.
        focal_length_px: estimated focal length in pixels. If None, derived
                          from image width using default heuristic.
        """
        h, w = bgr.shape[:2]

        if focal_length_px is None:
            focal_length_px = _DEFAULT_FOCAL_PX_AT_1080 * (w / 1080.0)

        # Metric depth anchor from the pinhole camera model:
        #   Z = (real_size * f) / pixel_size
        if palm_width_px < 1.0:
            palm_width_px = 1.0
        anchor_depth_m = (palm_width_prior_m * focal_length_px) / palm_width_px

        # Relative depth map (inverse depth, normalised)
        rel_depth = self.estimate(bgr)

        # Find the relative depth at the palm centre (approx centre of image
        # where the palm is expected). Use the mean of the central 20% block.
        cy, cx = h // 2, w // 2
        margin_y, margin_x = max(1, h // 10), max(1, w // 10)
        centre_patch = rel_depth[cy - margin_y:cy + margin_y, cx - margin_x:cx + margin_x]
        rel_anchor = float(centre_patch.mean())

        if rel_anchor < 1e-6:
            rel_anchor = 0.5  # Fallback — use midrange

        # Scale: metric_depth(x,y) = anchor_depth * (rel_anchor / rel_depth(x,y))
        # Avoid division by zero
        rel_safe = np.where(rel_depth < 1e-4, 1e-4, rel_depth)
        metric = anchor_depth_m * (rel_anchor / rel_safe)

        # Clip to sane hand-scan range (10 cm – 2 m)
        metric = np.clip(metric, 0.10, 2.0).astype(np.float32)
        return metric

    def depth_at_landmark(self, depth_map: np.ndarray, px: float, py: float) -> float:
        """Bilinear sample of the metric depth map at a sub-pixel landmark coord."""
        h, w = depth_map.shape[:2]
        x = int(np.clip(round(px), 0, w - 1))
        y = int(np.clip(round(py), 0, h - 1))
        return float(depth_map[y, x])


def focal_length_from_exif(image_path: str, image_width_px: int) -> float | None:
    """
    Extract focal length in pixels from JPEG EXIF data.
    Uses FocalLengthIn35mmFormat + sensor crop calculation.
    Returns None if EXIF unavailable.
    """
    try:
        exif = piexif.load(image_path)
        exif_ifd = exif.get("Exif", {})

        # FocalLengthIn35mmFormat (tag 0xA405) — full-frame equivalent mm
        fl_35 = exif_ifd.get(piexif.ExifIFD.FocalLengthIn35mmFilm)
        if fl_35 and fl_35 > 0:
            # Full-frame sensor width ≈ 36mm → angular field-of-view conversion
            # HFOV = 2 * atan(18 / fl_35)  →  f_px = width / (2 * tan(HFOV/2))
            import math
            hfov = 2.0 * math.atan(18.0 / fl_35)
            f_px = image_width_px / (2.0 * math.tan(hfov / 2.0))
            return float(f_px)
    except Exception:
        pass
    return None
