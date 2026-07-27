from sqladmin import ModelView
from app.models.user import User
from app.models.device import Device
from app.models.motion_event import MotionEvent

from app.models.notification import Notification

class UserAdmin(ModelView, model=User):
    column_list = ["id", "name", "email", "email_verified", "created_at"]
    column_searchable_list = ["name", "email"]
    column_sortable_list = ["id", "created_at"]
    icon = "fa-solid fa-user"

class DeviceAdmin(ModelView, model=Device):
    column_list = ["id", "factory_mac", "name", "status", "created_at"]
    column_searchable_list = ["factory_mac", "name"]
    column_sortable_list = ["id", "created_at"]
    icon = "fa-solid fa-microchip"

class MotionEventAdmin(ModelView, model=MotionEvent):
    column_list = ["id", "device_id", "motion_detected", "timestamp"]
    column_searchable_list = ["id"]
    column_sortable_list = ["id", "timestamp"]
    icon = "fa-solid fa-person-running"

class NotificationAdmin(ModelView, model=Notification):
    column_list = ["id", "user_id", "title", "read", "created_at"]
    column_searchable_list = ["title", "message"]
    column_sortable_list = ["id", "created_at"]
    icon = "fa-solid fa-bell"

