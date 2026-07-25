from app.models.space import Space
from app.models.user import User
from app.repositories.space_repository import SpaceRepository

DEFAULT_SPACE_NAME = "Home"


class SpaceService:
    def __init__(self, repository: SpaceRepository):
        self.repository = repository

    async def create_default_space(self, user: User) -> Space:
        return await self.repository.create(DEFAULT_SPACE_NAME, user.id)

    async def create_space(self, user: User, name: str) -> Space:
        return await self.repository.create(name, user.id)

    async def get_user_spaces(self, user: User) -> list[Space]:
        return await self.repository.get_user_spaces(user.id)
