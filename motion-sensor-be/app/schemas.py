from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DeviceRegister(BaseModel):
    device_id: str
    name: str


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: str
    name: str | None
    created_at: datetime


class MotionReport(BaseModel):
    device_id: str
    motion_detected: bool


class MotionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: str
    motion_detected: bool
    timestamp: datetime
