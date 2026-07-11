from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MotionReport(BaseModel):
    device_id: str
    motion_detected: bool


class MotionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: str
    motion_detected: bool
    timestamp: datetime

class MotionPaginatedResponse(BaseModel):
    items: list[MotionOut]
    next_cursor: datetime | None
