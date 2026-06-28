from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class MotionEvent(Base):
    __tablename__ = "motion_events"

    id = Column(Integer, primary_key=True)
    device_id = Column(String(255), ForeignKey("devices.device_id"), nullable=False, index=True)
    motion_detected = Column(Boolean)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
