from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    message: str
    type: str
    read: bool
    created_at: datetime


class NotificationUnreadSummary(BaseModel):
    unread_count: int
    has_unread: bool


class NotificationPaginatedResponse(BaseModel):
    items: list[NotificationOut]
    next_cursor: datetime | None = None
