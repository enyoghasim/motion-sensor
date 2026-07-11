from datetime import datetime
import uuid
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class MotionEvent(Base):
    __tablename__ = "motion_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    device_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("devices.id"), nullable=False, index=True)
    motion_detected: Mapped[bool] = mapped_column(Boolean)
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
