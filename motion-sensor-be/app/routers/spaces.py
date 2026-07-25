from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas
from app.core.database import get_db
from app.core.security import get_current_verified_user
from app.models.user import User
from app.repositories.space_repository import SpaceRepository
from app.services.space_service import SpaceService
from app.utils.response import success_response, SuccessResponseModel

router = APIRouter(prefix="/api/spaces", tags=["Spaces"])


def get_space_service(db: AsyncSession = Depends(get_db)) -> SpaceService:
    return SpaceService(SpaceRepository(db))


@router.get("", response_model=SuccessResponseModel[list[schemas.SpaceOut]])
async def get_spaces(
    current_user: User = Depends(get_current_verified_user),
    service: SpaceService = Depends(get_space_service),
):
    spaces = await service.get_user_spaces(current_user)
    return success_response(message="Spaces retrieved successfully", data=spaces)
