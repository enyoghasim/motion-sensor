from fastapi import HTTPException

from app.core.mqtt_client import MQTTClient
from app.models import MotionEvent
from app.repositories.motion_repository import MotionRepository


class MotionService:
    def __init__(self, repository: MotionRepository, mqtt_client: MQTTClient):
        self.repository = repository
        self.mqtt_client = mqtt_client

    async def report_motion(self, device_id: str, motion_detected: bool) -> MotionEvent:
        event = await self.repository.create(device_id, motion_detected)
        self.mqtt_client.publish_motion_data(device_id, motion_detected)
        return event

    async def get_latest_motion(self, device_id: str) -> MotionEvent:
        event = await self.repository.get_latest(device_id)
        if not event:
            raise HTTPException(status_code=404, detail="No motion events for this device")
        return event

    async def get_motion_history(self, device_id: str, limit: int) -> list[MotionEvent]:
        return await self.repository.get_history(device_id, limit)
