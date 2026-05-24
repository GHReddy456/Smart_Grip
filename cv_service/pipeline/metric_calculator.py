"""
Metric calculator — converts pixel-space landmark distances to millimetres
using the pinhole camera model + metric depth maps.

Core formula:
    real_size_mm = (pixel_distance × depth_at_midpoint_m × 1000) / focal_length_px

Additionally computes finger girth using contour ellipse fitting on the
side-profile view.
"""

import cv2
import numpy as np
from dataclasses import dataclass, field
from typing import Optional

from .landmark_extractor import HandLandmarks, FINGER_SEGMENTS, PALM_WIDTH_LANDMARKS, PALM_LENGTH_LANDMARKS
from .depth_estimator import DepthEstimator


@dataclass
class RawMeasurements:
    """All measurements from a single view, in millimetres. None = not computable from this view."""
    view_type: str
    focal_length_px: float
    depth_anchor_m: float

    # Palm
    palm_width_mm: Optional[float] = None
    palm_length_mm: Optional[float] = None

    # Finger total lengths (MCP→TIP)
    thumb_length_mm:  Optional[float] = None
    index_length_mm:  Optional[float] = None
    middle_length_mm: Optional[float] = None
    ring_length_mm:   Optional[float] = None
    pinky_length_mm:  Optional[float] = None

    # Finger segment lengths
    thumb_segments:  list[float] = field(default_factory=list)   # [MCP→IP, IP→TIP]
    index_segments:  list[float] = field(default_factory=list)   # [MCP→PIP, PIP→DIP, DIP→TIP]
    middle_segments: list[float] = field(default_factory=list)
    ring_segments:   list[float] = field(default_factory=list)
    pinky_segments:  list[float] = field(default_factory=list)

    # Girths (only from side-profile view)
    finger_girths_mm: dict[str, float] = field(default_factory=dict)

    # Quality weight (used during fusion)
    quality_weight: float = 1.0


def _px_to_mm(
    px_distance: float,
    depth_m: float,
    focal_px: float,
) -> float:
    """
    Pinhole projection inverse:
        real_mm = (px_distance / focal_px) * depth_m * 1000
    """
    if focal_px < 1.0 or depth_m < 0.01:
        return 0.0
    return (px_distance / focal_px) * depth_m * 1000.0


def _midpoint_depth(
    depth_map: np.ndarray,
    estimator: DepthEstimator,
    lm_a,
    lm_b,
) -> float:
    """Sample depth at the midpoint between two landmarks."""
    mx = (lm_a.px + lm_b.px) / 2.0
    my = (lm_a.py + lm_b.py) / 2.0
    return estimator.depth_at_landmark(depth_map, mx, my)


def _segment_length_mm(
    lm_a,
    lm_b,
    depth_map: np.ndarray,
    estimator: DepthEstimator,
    focal_px: float,
) -> float:
    px_dist = float(np.sqrt((lm_a.px - lm_b.px) ** 2 + (lm_a.py - lm_b.py) ** 2))
    depth = _midpoint_depth(depth_map, estimator, lm_a, lm_b)
    return _px_to_mm(px_dist, depth, focal_px)


class MetricCalculator:
    """
    Given a HandLandmarks result + a metric depth map, extracts all
    hand measurements in millimetres.
    """

    def __init__(self, estimator: DepthEstimator):
        self._estimator = estimator

    def compute(
        self,
        landmarks: HandLandmarks,
        depth_map: np.ndarray,
        focal_length_px: float,
        quality_weight: float = 1.0,
    ) -> RawMeasurements:
        lm = landmarks.landmarks
        est = self._estimator

        # Depth at palm centre (wrist ↔ middle_mcp midpoint) for anchor logging
        w_lm = lm.get("wrist")
        mm_lm = lm.get("middle_mcp")
        anchor_depth = 0.0
        if w_lm and mm_lm:
            anchor_depth = _midpoint_depth(depth_map, est, w_lm, mm_lm)

        result = RawMeasurements(
            view_type=landmarks.view_type,
            focal_length_px=focal_length_px,
            depth_anchor_m=anchor_depth,
            quality_weight=quality_weight,
        )

        # ── Palm width ───────────────────────────────────────────────────
        a_name, b_name = PALM_WIDTH_LANDMARKS
        if a_name in lm and b_name in lm:
            result.palm_width_mm = _segment_length_mm(
                lm[a_name], lm[b_name], depth_map, est, focal_length_px
            )

        # ── Palm length ──────────────────────────────────────────────────
        a_name, b_name = PALM_LENGTH_LANDMARKS
        if a_name in lm and b_name in lm:
            result.palm_length_mm = _segment_length_mm(
                lm[a_name], lm[b_name], depth_map, est, focal_length_px
            )

        # ── Finger lengths ───────────────────────────────────────────────
        finger_total_map = {
            "thumb":  ("thumb_mcp",  "thumb_tip",  "thumb_segments",  "thumb_length_mm"),
            "index":  ("index_mcp",  "index_tip",  "index_segments",  "index_length_mm"),
            "middle": ("middle_mcp", "middle_tip", "middle_segments", "middle_length_mm"),
            "ring":   ("ring_mcp",   "ring_tip",   "ring_segments",   "ring_length_mm"),
            "pinky":  ("pinky_mcp",  "pinky_tip",  "pinky_segments",  "pinky_length_mm"),
        }
        for finger, (mcp, tip, seg_attr, total_attr) in finger_total_map.items():
            if mcp not in lm or tip not in lm:
                continue

            # Sum segments for better accuracy (follows the curve of the finger)
            segments = FINGER_SEGMENTS[finger]
            seg_lengths = []
            all_visible = True
            for a_name, b_name in segments:
                if a_name not in lm or b_name not in lm:
                    all_visible = False
                    break
                seg_lengths.append(
                    _segment_length_mm(lm[a_name], lm[b_name], depth_map, est, focal_length_px)
                )

            if all_visible and seg_lengths:
                setattr(result, seg_attr, seg_lengths)
                setattr(result, total_attr, float(sum(seg_lengths)))
            else:
                # Fallback: straight-line MCP→TIP
                straight = _segment_length_mm(lm[mcp], lm[tip], depth_map, est, focal_length_px)
                setattr(result, total_attr, straight)

        return result

    def compute_girths_from_side(
        self,
        bgr: np.ndarray,
        landmarks: HandLandmarks,
        depth_map: np.ndarray,
        focal_length_px: float,
    ) -> dict[str, float]:
        """
        Estimate finger circumferences from the side-profile view using
        contour-based ellipse fitting at each PIP joint.

        The side view gives us the thickness (height) of the finger.
        We combine:
          - width  = lateral pixel span at PIP joint (from front-view average, approximated here)
          - height = contour span perpendicular to finger axis (from side view)
        Then circumference ≈ π * sqrt(2*(a² + b²)) (Ramanujan approximation for ellipse)
        """
        lm = landmarks.landmarks
        girths: dict[str, float] = {}

        finger_pips = {
            "thumb":  "thumb_ip",
            "index":  "index_pip",
            "middle": "middle_pip",
            "ring":   "ring_pip",
            "pinky":  "pinky_pip",
        }

        # Convert to grayscale + threshold hand mask for contour detection
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        _, hand_mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(hand_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return girths

        # Use the largest contour (the hand)
        hand_contour = max(contours, key=cv2.contourArea)

        for finger, pip_name in finger_pips.items():
            if pip_name not in lm:
                continue
            pip = lm[pip_name]

            # Find the nearest contour point to the PIP landmark
            # Then measure the perpendicular span ≈ finger thickness at that point
            pip_point = np.array([[pip.px, pip.py]])
            dists = np.linalg.norm(hand_contour[:, 0, :].astype(float) - pip_point, axis=1)
            nearest_idx = int(np.argmin(dists))

            # Sample ±10 pixels along contour to get local segment direction
            n = len(hand_contour)
            p1 = hand_contour[(nearest_idx - 8) % n, 0].astype(float)
            p2 = hand_contour[(nearest_idx + 8) % n, 0].astype(float)
            tangent = p2 - p1
            if np.linalg.norm(tangent) < 1e-3:
                continue
            tangent /= np.linalg.norm(tangent)
            normal = np.array([-tangent[1], tangent[0]])

            # Cast ray along normal from PIP landmark, measure span
            depth_at_pip = self._estimator.depth_at_landmark(depth_map, pip.px, pip.py)

            # Sample along normal direction to find hand boundary span (thickness)
            thickness_px = self._measure_thickness_along_normal(
                hand_mask, pip.px, pip.py, normal, max_dist=60
            )
            thickness_mm = _px_to_mm(thickness_px, depth_at_pip, focal_length_px)

            # Width approximation: assume roughly circular cross-section as fallback
            # (will be refined by fusion with front-view palm_width ratio)
            width_mm = thickness_mm * 0.85   # fingers slightly oval

            if thickness_mm > 5.0 and width_mm > 3.0:
                # Ramanujan ellipse circumference approximation
                a, b = max(thickness_mm, width_mm) / 2.0, min(thickness_mm, width_mm) / 2.0
                h = ((a - b) / (a + b)) ** 2
                circumference = np.pi * (a + b) * (1 + (3 * h) / (10 + np.sqrt(4 - 3 * h)))
                girths[finger] = round(float(circumference), 1)

        return girths

    @staticmethod
    def _measure_thickness_along_normal(
        mask: np.ndarray,
        cx: float,
        cy: float,
        normal: np.ndarray,
        max_dist: int = 60,
    ) -> float:
        """
        From centre point (cx, cy), walk in +normal and -normal directions
        until leaving the hand mask. Returns total span in pixels.
        """
        h, w = mask.shape[:2]
        steps_pos, steps_neg = 0, 0

        for step in range(1, max_dist):
            px = int(round(cx + normal[0] * step))
            py = int(round(cy + normal[1] * step))
            if 0 <= px < w and 0 <= py < h and mask[py, px] > 0:
                steps_pos = step
            else:
                break

        for step in range(1, max_dist):
            px = int(round(cx - normal[0] * step))
            py = int(round(cy - normal[1] * step))
            if 0 <= px < w and 0 <= py < h and mask[py, px] > 0:
                steps_neg = step
            else:
                break

        return float(steps_pos + steps_neg)
