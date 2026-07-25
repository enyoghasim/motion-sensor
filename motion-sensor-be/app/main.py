from app.core.exception_handler import validation_exception_handler
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqladmin import Admin

from app.core.mqtt_client import mqtt_client
from app.core.database import engine
from app.routers import devices, health, motion, auth, user, mqtt, spaces
from app.admin import UserAdmin, DeviceAdmin, MotionEventAdmin


@asynccontextmanager
async def lifespan(app: FastAPI):
    mqtt_client.connect()
    yield
    mqtt_client.disconnect()


app = FastAPI(title="Motion Sensor Backend", lifespan=lifespan)

# Attach SQLAdmin
admin = Admin(app, engine)
admin.add_view(UserAdmin)
admin.add_view(DeviceAdmin)
admin.add_view(MotionEventAdmin)

app.add_exception_handler(
    RequestValidationError,
    validation_exception_handler
)

app.include_router(health.router)
app.include_router(devices.router)
app.include_router(motion.router)
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(spaces.router)
app.include_router(mqtt.router)

