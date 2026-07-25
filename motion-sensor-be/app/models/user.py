from sqlalchemy import DateTime, Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime

from typing import TYPE_CHECKING
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.device import Device
    from app.models.space import Space


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    email_verified: Mapped[bool] = mapped_column(Boolean, server_default='false')
    
    devices: Mapped[list["Device"]] = relationship("Device", back_populates="owner")
    spaces: Mapped[list["Space"]] = relationship("Space", back_populates="owner")
