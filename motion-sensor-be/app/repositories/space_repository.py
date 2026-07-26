from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Space
from app.models.device import Device


class SpaceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_spaces(self, owner_id: int) -> list[Space]:
        stmt = select(Space).filter(Space.owner_id == owner_id).order_by(Space.created_at.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, space_id: int) -> Space | None:
        result = await self.db.execute(select(Space).filter(Space.id == space_id))
        return result.scalars().first()

    async def create(self, name: str, owner_id: int, icon: str = "Home01Icon") -> Space:
        space = Space(name=name, owner_id=owner_id, icon=icon)
        self.db.add(space)
        await self.db.commit()
        await self.db.refresh(space)
        return space

    async def update(self, space: Space) -> Space:
        self.db.add(space)
        await self.db.commit()
        await self.db.refresh(space)
        return space

    async def unassign_devices(self, space_id: int) -> None:
        await self.db.execute(
            update(Device).where(Device.space_id == space_id).values(space_id=None)
        )

    async def delete(self, space: Space) -> None:
        await self.db.delete(space)
        await self.db.commit()
