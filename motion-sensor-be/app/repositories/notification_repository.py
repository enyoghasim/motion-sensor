from datetime import datetime
from sqlalchemy import func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.notification import Notification


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: int,
        title: str,
        message: str,
        type: str = "motion",
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            read=False,
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def get_by_id(self, notification_id: int) -> Notification | None:
        result = await self.db.execute(
            select(Notification).filter_by(id=notification_id)
        )
        return result.scalars().first()

    async def get_user_notifications_cursor(
        self,
        user_id: int,
        cursor: datetime | None,
        limit: int,
    ) -> list[Notification]:
        query = select(Notification).filter_by(user_id=user_id)
        if cursor:
            query = query.filter(Notification.created_at < cursor)

        result = await self.db.execute(
            query.order_by(Notification.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def count_unread(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.count(Notification.id)).filter_by(user_id=user_id, read=False)
        )
        return result.scalar() or 0

    async def mark_as_read(self, notification: Notification) -> Notification:
        notification.read = True
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def mark_all_as_read(self, user_id: int) -> int:
        result = await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.read == False)
            .values(read=True)
        )
        await self.db.commit()
        return result.rowcount
