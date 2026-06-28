from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas
from app.core.database import get_db
from app.core.mqtt_client import MQTTClient, get_mqtt_client
from app.repositories.device_repository import DeviceRepository
from app.services.device_service import DeviceService
from app.services.email_service import EmailService

router = APIRouter(prefix="/api/devices")


def get_device_service(
    db: Session = Depends(get_db),
    mqtt_client: MQTTClient = Depends(get_mqtt_client),
) -> DeviceService:
    return DeviceService(DeviceRepository(db), mqtt_client, EmailService())


@router.get("", response_model=list[schemas.DeviceOut])
def get_devices(service: DeviceService = Depends(get_device_service)):
    return service.list_devices()


@router.post("/register")
def register_device(
    device: schemas.DeviceRegister,
    service: DeviceService = Depends(get_device_service),
):
    service.register_device(device.device_id, device.name, device.owner_email)
    return {"status": "registered", "device_id": device.device_id}
