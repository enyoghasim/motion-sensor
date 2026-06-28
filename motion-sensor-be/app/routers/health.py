from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import engine
from app.core.mqtt_client import mqtt_client

router = APIRouter()


def is_db_connected() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "motion-sensor-backend",
        "database": "connected" if is_db_connected() else "disconnected",
        "mqtt": "connected" if mqtt_client.is_connected() else "disconnected",
    }
