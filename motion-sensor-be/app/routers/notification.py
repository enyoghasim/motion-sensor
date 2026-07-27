from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas
from app.core.database import get_db
from app.core.security import get_current_verified_user
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository
from app.services.notification_service import NotificationService
from app.utils.response import success_response, SuccessResponseModel

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


def get_notification_service(
    db: AsyncSession = Depends(get_db),
) -> NotificationService:
    return NotificationService(NotificationRepository(db))


@router.get("", response_model=SuccessResponseModel[schemas.NotificationPaginatedResponse])
async def get_notifications(
    cursor: datetime | None = None,
    limit: int = Query(20, le=100),
    current_user: User = Depends(get_current_verified_user),
    service: NotificationService = Depends(get_notification_service),
):
    result = await service.get_user_notifications(current_user.id, cursor, limit)
    return success_response(message="Notifications retrieved successfully", data=result)


@router.get(
    "/unread-summary",
    response_model=SuccessResponseModel[schemas.NotificationUnreadSummary],
)
async def get_unread_summary(
    current_user: User = Depends(get_current_verified_user),
    service: NotificationService = Depends(get_notification_service),
):
    summary = await service.get_unread_summary(current_user.id)
    return success_response(
        message="Unread summary retrieved successfully", data=summary
    )


@router.patch(
    "/{notification_id}/read",
    response_model=SuccessResponseModel[schemas.NotificationOut],
)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_verified_user),
    service: NotificationService = Depends(get_notification_service),
):
    notification = await service.mark_as_read(notification_id, current_user.id)
    return success_response(
        message="Notification marked as read", data=notification
    )


@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_verified_user),
    service: NotificationService = Depends(get_notification_service),
):
    count = await service.mark_all_as_read(current_user.id)
    return success_response(
        message="All notifications marked as read", data={"updated_count": count}
    )
