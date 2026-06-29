from fastapi import HTTPException

from app.core.mqtt_client import MQTTClient
from app.models import Device
from app.repositories.device_repository import DeviceRepository
from app.services.email_service import EmailService


class DeviceService:
    def __init__(self, repository: DeviceRepository, mqtt_client: MQTTClient, email_service: EmailService):
        self.repository = repository
        self.mqtt_client = mqtt_client
        self.email_service = email_service

    async def list_devices(self) -> list[Device]:
        return await self.repository.get_all()

    async def register_device(self, device_id: str, name: str, owner_email: str) -> Device:
        if await self.repository.get_by_device_id(device_id):
            raise HTTPException(status_code=400, detail="Device already registered")

        device = await self.repository.create(device_id, name, owner_email)
        self.mqtt_client.publish_device_status(device_id, "registered")
        self.email_service.enqueue_welcome_email(owner_email, device_id, name)
        return device
