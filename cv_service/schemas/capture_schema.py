"""
Pydantic schemas for capture metadata and API requests.
"""

from pydantic import BaseModel, Field
from typing import Optional


class CameraIntrinsics(BaseModel):
    fx: float = Field(default=0.0, description="Focal length x in pixels")
    fy: float = Field(default=0.0, description="Focal length y in pixels")
    cx: float = Field(default=0.0, description="Principal point x")
    cy: float = Field(default=0.0, description="Principal point y")


class CaptureQuality(BaseModel):
    blur_score: float = 0.0
    lighting_score: float = 0.0
    hand_visibility: float = 0.0


class CaptureMetadata(BaseModel):
    capture_id: str
    view_type: str
    rgb_image_path: str
    depth_map_path: Optional[str] = None
    camera_intrinsics: CameraIntrinsics = Field(default_factory=CameraIntrinsics)
    device_rotation: Optional[dict] = None
    capture_quality: CaptureQuality = Field(default_factory=CaptureQuality)


class AnalyzeRequest(BaseModel):
    job_id: str
    patient_id: str
    storage_base: str = "storage"   # Base path where frames are stored


class GroundTruthSample(BaseModel):
    patient_id: str
    job_id: str
    ground_truth_mm: dict[str, float]
    estimated_mm: dict[str, float]
    capture_metadata: Optional[dict] = None
