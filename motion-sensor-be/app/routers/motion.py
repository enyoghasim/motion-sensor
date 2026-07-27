from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException

from app import schemas
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.mqtt_client import MQTTClient, get_mqtt_client
from app.repositories.motion_repository import MotionRepository
from app.repositories.device_repository import DeviceRepository
from app.repositories.notification_repository import NotificationRepository
from app.services.motion_service import MotionService
from app.models.user import User
from app.core.security import get_current_verified_user

router = APIRouter(prefix="/api/motion", tags=["Motion"])

def get_motion_service(
    db: AsyncSession = Depends(get_db),
    mqtt_client: MQTTClient = Depends(get_mqtt_client),
) -> MotionService:
    return MotionService(
        MotionRepository(db),
        mqtt_client,
        device_repository=DeviceRepository(db),
        notification_repository=NotificationRepository(db),
    )


def get_device_repository(db: AsyncSession = Depends(get_db)) -> DeviceRepository:
    return DeviceRepository(db)

@router.get("/{device_id}", response_model=schemas.MotionOut)
async def get_latest_motion(
    device_id: uuid.UUID, 
    service: MotionService = Depends(get_motion_service),
    device_repo: DeviceRepository = Depends(get_device_repository),
    current_user: User = Depends(get_current_verified_user)
):
    device = await device_repo.get_by_id(device_id)
    if not device or device.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this device")
        
    return await service.get_latest_motion(device_id)

@router.get("/{device_id}/history", response_model=schemas.MotionPaginatedResponse)
async def get_motion_history(
    device_id: uuid.UUID,
    cursor: datetime | None = None,
    limit: int = Query(100, le=1000),
    service: MotionService = Depends(get_motion_service),
    device_repo: DeviceRepository = Depends(get_device_repository),
    current_user: User = Depends(get_current_verified_user)
):
    device = await device_repo.get_by_id(device_id)
    if not device or device.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this device")
        
    return await service.get_motion_history(device_id, cursor, limit)

@router.post("/report")
async def report_motion(event: schemas.MotionReport, service: MotionService = Depends(get_motion_service)):
    # The ESP32 will use the MQTT endpoint, but we leave this here as an HTTP alternative
    # We should probably secure this, but for now it's internal/device-facing.
    device_uuid = uuid.UUID(event.device_id)
    await service.report_motion(device_uuid, event.motion_detected)
    return {
        "status": "recorded",
        "device_id": event.device_id,
        "motion_detected": event.motion_detected,
    }
