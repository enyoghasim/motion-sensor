from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Space


class SpaceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_spaces(self, owner_id: int) -> list[Space]:
        stmt = select(Space).filter(Space.owner_id == owner_id).order_by(Space.created_at.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, name: str, owner_id: int) -> Space:
        space = Space(name=name, owner_id=owner_id)
        self.db.add(space)
        await self.db.commit()
        await self.db.refresh(space)
        return space
