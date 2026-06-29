from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas
from app.core.database import get_db
from app.core.mqtt_client import MQTTClient, get_mqtt_client
from app.repositories.motion_repository import MotionRepository
from app.services.motion_service import MotionService

router = APIRouter(prefix="/api/motion")


def get_motion_service(
    db: AsyncSession = Depends(get_db),
    mqtt_client: MQTTClient = Depends(get_mqtt_client),
) -> MotionService:
    return MotionService(MotionRepository(db), mqtt_client)


@router.get("/{device_id}", response_model=schemas.MotionOut)
async def get_latest_motion(device_id: str, service: MotionService = Depends(get_motion_service)):
    return await service.get_latest_motion(device_id)


@router.get("/{device_id}/history", response_model=list[schemas.MotionOut])
async def get_motion_history(
    device_id: str,
    limit: int = 100,
    service: MotionService = Depends(get_motion_service),
):
    return await service.get_motion_history(device_id, limit)


@router.post("/report")
async def report_motion(event: schemas.MotionReport, service: MotionService = Depends(get_motion_service)):
    await service.report_motion(event.device_id, event.motion_detected)
    return {
        "status": "recorded",
        "device_id": event.device_id,
        "motion_detected": event.motion_detected,
    }
