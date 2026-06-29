from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import MotionEvent


class MotionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, device_id: str, motion_detected: bool) -> MotionEvent:
        event = MotionEvent(device_id=device_id, motion_detected=motion_detected)
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def get_latest(self, device_id: str) -> MotionEvent | None:
        result = await self.db.execute(
            select(MotionEvent)
            .filter_by(device_id=device_id)
            .order_by(MotionEvent.timestamp.desc())
        )
        return result.scalars().first()

    async def get_history(self, device_id: str, limit: int) -> list[MotionEvent]:
        result = await self.db.execute(
            select(MotionEvent)
            .filter_by(device_id=device_id)
            .order_by(MotionEvent.timestamp.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
