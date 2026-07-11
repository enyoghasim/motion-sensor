import uuid
from datetime import datetime
from fastapi import HTTPException

from app.core.mqtt_client import MQTTClient
from app.models import MotionEvent
from app.repositories.motion_repository import MotionRepository


class MotionService:
    def __init__(self, repository: MotionRepository, mqtt_client: MQTTClient):
        self.repository = repository
        self.mqtt_client = mqtt_client

    async def report_motion(self, device_id: uuid.UUID, motion_detected: bool) -> MotionEvent:
        event = await self.repository.create(device_id, motion_detected)
        self.mqtt_client.publish_motion_data(str(device_id), motion_detected)
        return event

    async def get_latest_motion(self, device_id: uuid.UUID) -> MotionEvent:
        event = await self.repository.get_latest(device_id)
        if not event:
            raise HTTPException(status_code=404, detail="No motion events for this device")
        return event

    async def get_motion_history(self, device_id: uuid.UUID, cursor: datetime | None, limit: int) -> dict:
        events = await self.repository.get_history_cursor(device_id, cursor, limit + 1)
        
        next_cursor = None
        if len(events) > limit:
            next_cursor = events[-2].timestamp
            events = events[:limit]
            
        return {
            "items": events,
            "next_cursor": next_cursor
        }
