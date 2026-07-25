from fastapi import APIRouter, Depends

from app import schemas
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.mqtt_client import MQTTClient, get_mqtt_client
from app.repositories.device_repository import DeviceRepository
from app.services.device_service import DeviceService
from app.services.email_service import EmailService
from app.models.user import User
from app.core.security import get_current_verified_user

router = APIRouter(prefix="/api/devices", tags=["Devices"])

def get_device_service(
    db: AsyncSession = Depends(get_db),
    mqtt_client: MQTTClient = Depends(get_mqtt_client),
) -> DeviceService:
    return DeviceService(DeviceRepository(db), mqtt_client, EmailService())

from datetime import datetime
import uuid
from fastapi import Query

@router.get("", response_model=schemas.DevicePaginatedResponse)
async def get_devices(
    space_id: int | None = None,
    cursor: datetime | None = None,
    limit: int = Query(10, le=100),
    current_user: User = Depends(get_current_verified_user),
    service: DeviceService = Depends(get_device_service)
):
    return await service.get_user_devices(current_user, space_id, cursor, limit)

@router.delete("/{device_id}")
async def delete_device(
    device_id: uuid.UUID,
    request: schemas.DeviceDeleteRequest,
    current_user: User = Depends(get_current_verified_user),
    service: DeviceService = Depends(get_device_service)
):
    await service.delete_device(current_user, device_id, request.password)
    return {"status": "Device deleted"}
@router.post("/claim/start", response_model=schemas.DeviceClaimStartResponse)
async def claim_start(
    request: schemas.DeviceClaimStartRequest,
    current_user: User = Depends(get_current_verified_user),
    service: DeviceService = Depends(get_device_service),
):
    """Initiates the device pairing process."""
    return await service.start_claim(current_user, request.factory_mac)

@router.post("/claim/finish")
async def claim_finish(
    request: schemas.DeviceClaimFinishRequest,
    current_user: User = Depends(get_current_verified_user),
    service: DeviceService = Depends(get_device_service),
):
    """Finalizes the device pairing by verifying the ESP32's signature."""
    return await service.finish_claim(
        user=current_user,
        factory_mac=request.factory_mac,
        challenge=request.challenge,
        signature=request.signature,
        public_key=request.public_key
    )
