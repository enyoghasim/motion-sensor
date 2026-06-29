from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Device


class DeviceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Device]:
        result = await self.db.execute(select(Device))
        return list(result.scalars().all())

    async def get_by_device_id(self, device_id: str) -> Device | None:
        result = await self.db.execute(select(Device).filter_by(device_id=device_id))
        return result.scalars().first()

    async def create(self, device_id: str, name: str, owner_email: str) -> Device:
        device = Device(device_id=device_id, name=name, owner_email=owner_email)
        self.db.add(device)
        await self.db.commit()
        await self.db.refresh(device)
        return device
