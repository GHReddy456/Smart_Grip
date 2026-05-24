"""
Pydantic schemas for measurement output and glove calibration.
"""

from pydantic import BaseModel, Field
from typing import Optional


class FingerGirths(BaseModel):
    thumb:  Optional[float] = None
    index:  Optional[float] = None
    middle: Optional[float] = None
    ring:   Optional[float] = None
    pinky:  Optional[float] = None


class GloveCalibration(BaseModel):
    actuator_positions: list[dict] = Field(default_factory=list)
    sensor_positions:   list[dict] = Field(default_factory=list)
    glove_size: str = ""


class MeasurementResult(BaseModel):
    patient_id: str
    job_id: str

    palm_width_mm:    float = 0.0
    palm_length_mm:   float = 0.0
    thumb_length_mm:  float = 0.0
    index_length_mm:  float = 0.0
    middle_length_mm: float = 0.0
    ring_length_mm:   float = 0.0
    pinky_length_mm:  float = 0.0

    finger_girths_mm: FingerGirths = Field(default_factory=FingerGirths)
    confidence_score: float = 0.0
    confidence_per_key: dict[str, float] = Field(default_factory=dict)

    glove_calibration: GloveCalibration = Field(default_factory=GloveCalibration)

    # Frame-level quality diagnostics
    frame_quality: list[dict] = Field(default_factory=list)
    views_used: int = 0
    views_rejected: int = 0
    error_message: Optional[str] = None


class StatusResponse(BaseModel):
    job_id: str
    status: str   # "pending" | "processing" | "done" | "failed"
    error_message: Optional[str] = None
