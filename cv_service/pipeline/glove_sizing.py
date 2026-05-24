"""
Glove sizing engine.

Maps fused hand measurements to:
  - A standard glove size (XS / S / M / L / XL / XXL)
  - Actuator positions (finger-tip, MCP, wrist) for haptic/assistive actuators
  - Sensor positions for EMG / flex sensors

All positions are normalised 0-1 on the glove template coordinate system.
"""

from __future__ import annotations
from .fusion_engine import FusedMeasurements


# ── Glove size thresholds (based on palm circumference ≈ palm_width × π × 0.9) ──
# Standard medical/assistive glove sizing
_SIZE_TABLE = [
    ("XS",  0.0,   160.0),
    ("S",   160.0, 175.0),
    ("M",   175.0, 190.0),
    ("L",   190.0, 205.0),
    ("XL",  205.0, 220.0),
    ("XXL", 220.0, 9999.0),
]


def _palm_circumference(palm_width_mm: float) -> float:
    """Approximate palm circumference from palm width."""
    import math
    # Palm cross-section ≈ ellipse with a=palm_width/2, b=palm_width*0.6/2
    a = palm_width_mm / 2.0
    b = palm_width_mm * 0.60 / 2.0
    h = ((a - b) / (a + b)) ** 2
    return math.pi * (a + b) * (1 + (3 * h) / (10 + (4 - 3 * h) ** 0.5))


def determine_glove_size(fused: FusedMeasurements) -> str:
    circ = _palm_circumference(fused.palm_width_mm)
    for size, lo, hi in _SIZE_TABLE:
        if lo <= circ < hi:
            return size
    return "M"


def compute_actuator_positions(fused: FusedMeasurements) -> list[dict]:
    """
    Returns 10 actuator positions (2 per finger: MCP + TIP zones).
    Each position is expressed as (u, v) normalised to glove template [0-1].

    Coordinate system:
      u = 0 (little side) → 1 (thumb side), horizontal across palm
      v = 0 (wrist) → 1 (fingertip), vertical along finger axis
    """
    palm_w = fused.palm_width_mm
    palm_l = fused.palm_length_mm

    # Finger horizontal positions (u) — normalised to palm width
    finger_u = {
        "thumb":  0.95,
        "index":  0.75,
        "middle": 0.55,
        "ring":   0.35,
        "pinky":  0.12,
    }

    finger_lengths = {
        "thumb":  fused.thumb_length_mm,
        "index":  fused.index_length_mm,
        "middle": fused.middle_length_mm,
        "ring":   fused.ring_length_mm,
        "pinky":  fused.pinky_length_mm,
    }

    total_height = palm_l + max(finger_lengths.values(), default=90.0)
    mcp_v = palm_l / total_height   # MCP is at end of palm

    positions = []
    for finger, u in finger_u.items():
        flen = finger_lengths.get(finger, 80.0)
        tip_v = min(1.0, (palm_l + flen) / total_height)

        positions.append({
            "finger": finger,
            "zone": "mcp",
            "u": round(u, 3),
            "v": round(mcp_v, 3),
            "description": f"{finger.capitalize()} MCP joint actuator",
        })
        positions.append({
            "finger": finger,
            "zone": "tip",
            "u": round(u, 3),
            "v": round(tip_v, 3),
            "description": f"{finger.capitalize()} fingertip actuator",
        })

    return positions


def compute_sensor_positions(fused: FusedMeasurements) -> list[dict]:
    """
    Returns 7 sensor positions:
      - 5 flex sensors (one per finger, at PIP joint)
      - 1 EMG sensor (dorsal forearm)
      - 1 IMU (wrist)
    """
    palm_l = fused.palm_length_mm
    finger_lengths = {
        "thumb":  fused.thumb_length_mm,
        "index":  fused.index_length_mm,
        "middle": fused.middle_length_mm,
        "ring":   fused.ring_length_mm,
        "pinky":  fused.pinky_length_mm,
    }
    total_h = palm_l + max(finger_lengths.values(), default=90.0)
    mcp_v = palm_l / total_h

    finger_u = {
        "thumb": 0.95, "index": 0.75, "middle": 0.55, "ring": 0.35, "pinky": 0.12
    }

    sensors = []
    for finger, u in finger_u.items():
        flen = finger_lengths.get(finger, 80.0)
        # PIP joint is approximately 40% of the way up the finger from MCP
        pip_v = mcp_v + (flen * 0.40) / total_h
        sensors.append({
            "sensor_type": "flex",
            "finger": finger,
            "u": round(u, 3),
            "v": round(min(pip_v, 1.0), 3),
            "description": f"{finger.capitalize()} PIP flex sensor",
        })

    sensors.append({
        "sensor_type": "emg",
        "finger": None,
        "u": 0.50,
        "v": -0.15,   # dorsal forearm (below wrist line)
        "description": "Forearm EMG electrode array",
    })
    sensors.append({
        "sensor_type": "imu",
        "finger": None,
        "u": 0.50,
        "v": 0.0,
        "description": "Wrist IMU (gyro + accel)",
    })

    return sensors


def build_glove_calibration(fused: FusedMeasurements) -> dict:
    return {
        "glove_size":        determine_glove_size(fused),
        "actuator_positions": compute_actuator_positions(fused),
        "sensor_positions":  compute_sensor_positions(fused),
    }
