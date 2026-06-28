from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.mqtt_client import mqtt_client
from app.routers import devices, health, motion


@asynccontextmanager
async def lifespan(app: FastAPI):
    mqtt_client.connect()
    yield
    mqtt_client.disconnect()


app = FastAPI(title="Motion Sensor Backend", lifespan=lifespan)

app.include_router(health.router)
app.include_router(devices.router)
app.include_router(motion.router)
