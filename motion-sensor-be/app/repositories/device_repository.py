from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Device

from datetime import datetime
import uuid

class DeviceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_devices_cursor(self, user_id: int, cursor: datetime | None, limit: int) -> list[Device]:
        stmt = select(Device).filter(Device.owner_id == user_id)
        if cursor:
            stmt = stmt.filter(Device.created_at < cursor)
        stmt = stmt.order_by(Device.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, device_id: uuid.UUID) -> Device | None:
        result = await self.db.execute(select(Device).filter(Device.id == device_id))
        return result.scalars().first()

    async def get_by_factory_mac(self, factory_mac: str) -> Device | None:
        result = await self.db.execute(select(Device).filter_by(factory_mac=factory_mac))
        return result.scalars().first()

    async def delete(self, device: Device) -> None:
        await self.db.delete(device)
        await self.db.commit()

    async def create(self, factory_mac: str, owner_id: int, public_key: str, status: str = "Paired", name: str | None = None) -> Device:
        device = Device(
            factory_mac=factory_mac, 
            owner_id=owner_id, 
            public_key=public_key,
            status=status,
            name=name
        )
        self.db.add(device)
        await self.db.commit()
        await self.db.refresh(device)
        return device
        
    async def update(self, device: Device) -> Device:
        self.db.add(device)
        await self.db.commit()
        await self.db.refresh(device)
        return device
