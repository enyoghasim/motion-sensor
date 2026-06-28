from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True)
    device_id = Column(String(255), unique=True, nullable=False)
    name = Column(String(255))
    owner_email = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
