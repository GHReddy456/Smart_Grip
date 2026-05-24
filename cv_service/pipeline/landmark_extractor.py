"""
MediaPipe Hands landmark extractor.
Returns 21 landmarks per hand with pixel coords, normalised coords,
visibility scores, and handedness classification.
"""

import cv2
import numpy as np
import mediapipe as mp
from dataclasses import dataclass, field
from typing import Optional

mp_hands = mp.solutions.hands

# MediaPipe landmark indices
LANDMARK_NAMES = [
    "wrist",
    "thumb_cmc", "thumb_mcp", "thumb_ip", "thumb_tip",
    "index_mcp", "index_pip", "index_dip", "index_tip",
    "middle_mcp", "middle_pip", "middle_dip", "middle_tip",
    "ring_mcp", "ring_pip", "ring_dip", "ring_tip",
    "pinky_mcp", "pinky_pip", "pinky_dip", "pinky_tip",
]

# Segment definitions for length measurement
FINGER_SEGMENTS = {
    "thumb":  [("thumb_mcp",  "thumb_ip"),  ("thumb_ip",  "thumb_tip")],
    "index":  [("index_mcp",  "index_pip"), ("index_pip", "index_dip"), ("index_dip", "index_tip")],
    "middle": [("middle_mcp", "middle_pip"),("middle_pip","middle_dip"),("middle_dip","middle_tip")],
    "ring":   [("ring_mcp",   "ring_pip"),  ("ring_pip",  "ring_dip"),  ("ring_dip",  "ring_tip")],
    "pinky":  [("pinky_mcp",  "pinky_pip"), ("pinky_pip", "pinky_dip"), ("pinky_dip", "pinky_tip")],
}

PALM_WIDTH_LANDMARKS  = ("index_mcp", "pinky_mcp")
PALM_LENGTH_LANDMARKS = ("wrist",     "middle_mcp")


@dataclass
class Landmark3D:
    name: str
    norm_x: float        # 0-1 normalised to image width
    norm_y: float        # 0-1 normalised to image height
    norm_z: float        # relative depth from MediaPipe (arbitrary scale)
    px: float            # pixel x
    py: float            # pixel y
    visibility: float    # MediaPipe visibility score (0-1)


@dataclass
class HandLandmarks:
    view_type: str
    handedness: str                          # "Left" | "Right"
    handedness_confidence: float
    landmarks: dict[str, Landmark3D] = field(default_factory=dict)
    detection_confidence: float = 0.0
    image_width: int = 0
    image_height: int = 0

    def get(self, name: str) -> Optional[Landmark3D]:
        return self.landmarks.get(name)

    def pixel_distance(self, a: str, b: str) -> float:
        la, lb = self.landmarks.get(a), self.landmarks.get(b)
        if la is None or lb is None:
            return 0.0
        return float(np.sqrt((la.px - lb.px) ** 2 + (la.py - lb.py) ** 2))

    def to_dict(self) -> dict:
        return {
            "view_type": self.view_type,
            "handedness": self.handedness,
            "handedness_confidence": self.handedness_confidence,
            "detection_confidence": self.detection_confidence,
            "image_width": self.image_width,
            "image_height": self.image_height,
            "landmarks": {
                name: {
                    "norm_x": lm.norm_x,
                    "norm_y": lm.norm_y,
                    "norm_z": lm.norm_z,
                    "px": lm.px,
                    "py": lm.py,
                    "visibility": lm.visibility,
                }
                for name, lm in self.landmarks.items()
            },
        }


class LandmarkExtractor:
    """
    Wraps MediaPipe Hands for single-image inference.
    Reuses one mediapipe Hands session across calls for efficiency.
    """

    def __init__(
        self,
        static_image_mode: bool = True,
        max_num_hands: int = 1,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ):
        self._hands = mp_hands.Hands(
            static_image_mode=static_image_mode,
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

    def extract(self, image_path: str, view_type: str) -> Optional[HandLandmarks]:
        """
        Run MediaPipe on the given image file.
        Returns HandLandmarks or None if no hand detected.
        """
        bgr = cv2.imread(image_path)
        if bgr is None:
            return None
        return self.extract_from_array(bgr, view_type)

    def extract_from_array(self, bgr: np.ndarray, view_type: str) -> Optional[HandLandmarks]:
        h, w = bgr.shape[:2]
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        results = self._hands.process(rgb)

        if not results.multi_hand_landmarks:
            return None

        # Take the highest-confidence detection
        hand_lms = results.multi_hand_landmarks[0]
        hand_info = results.multi_handedness[0].classification[0]

        landmarks: dict[str, Landmark3D] = {}
        for idx, lm in enumerate(hand_lms.landmark):
            name = LANDMARK_NAMES[idx]
            landmarks[name] = Landmark3D(
                name=name,
                norm_x=float(lm.x),
                norm_y=float(lm.y),
                norm_z=float(lm.z),
                px=float(lm.x * w),
                py=float(lm.y * h),
                visibility=float(getattr(lm, "visibility", 1.0)),
            )

        return HandLandmarks(
            view_type=view_type,
            handedness=hand_info.label,
            handedness_confidence=float(hand_info.score),
            landmarks=landmarks,
            detection_confidence=float(hand_info.score),
            image_width=w,
            image_height=h,
        )

    def close(self):
        self._hands.close()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()
