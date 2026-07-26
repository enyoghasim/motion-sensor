from fastapi import HTTPException

from app.models.space import Space
from app.models.user import User
from app.repositories.space_repository import SpaceRepository
from app.schemas.space import DEFAULT_SPACE_ICON

DEFAULT_SPACE_NAME = "Home"


class SpaceService:
    def __init__(self, repository: SpaceRepository):
        self.repository = repository

    async def create_default_space(self, user: User) -> Space:
        return await self.repository.create(DEFAULT_SPACE_NAME, user.id, DEFAULT_SPACE_ICON)

    async def create_space(self, user: User, name: str, icon: str) -> Space:
        return await self.repository.create(name, user.id, icon)

    async def get_user_spaces(self, user: User) -> list[Space]:
        return await self.repository.get_user_spaces(user.id)

    async def update_space(self, user: User, space_id: int, name: str | None, icon: str | None) -> Space:
        space = await self.repository.get_by_id(space_id)
        if not space:
            raise HTTPException(status_code=404, detail="Space not found.")

        if space.owner_id != user.id:
            raise HTTPException(status_code=403, detail="You do not own this space.")

        if name is not None:
            space.name = name
        if icon is not None:
            space.icon = icon

        return await self.repository.update(space)

    async def delete_space(self, user: User, space_id: int) -> None:
        space = await self.repository.get_by_id(space_id)
        if not space:
            raise HTTPException(status_code=404, detail="Space not found.")

        if space.owner_id != user.id:
            raise HTTPException(status_code=403, detail="You do not own this space.")

        await self.repository.unassign_devices(space_id)
        await self.repository.delete(space)
