from datetime import datetime
from fastapi import HTTPException

from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository


class NotificationService:
    def __init__(self, repository: NotificationRepository):
        self.repository = repository

    async def create_notification(
        self, user_id: int, title: str, message: str, type: str = "motion"
    ) -> Notification:
        return await self.repository.create(user_id, title, message, type)

    async def get_user_notifications(
        self, user_id: int, cursor: datetime | None, limit: int
    ) -> dict:
        notifications = await self.repository.get_user_notifications_cursor(
            user_id, cursor, limit + 1
        )
        next_cursor = None
        if len(notifications) > limit:
            next_cursor = notifications[-2].created_at
            notifications = notifications[:limit]

        return {"items": notifications, "next_cursor": next_cursor}

    async def get_unread_summary(self, user_id: int) -> dict:
        unread_count = await self.repository.count_unread(user_id)
        return {"unread_count": unread_count, "has_unread": unread_count > 0}

    async def mark_as_read(
        self, notification_id: int, user_id: int
    ) -> Notification:
        notification = await self.repository.get_by_id(notification_id)
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        if notification.user_id != user_id:
            raise HTTPException(
                status_code=403, detail="Not authorized to access this notification"
            )
        return await self.repository.mark_as_read(notification)

    async def mark_all_as_read(self, user_id: int) -> int:
        return await self.repository.mark_all_as_read(user_id)
