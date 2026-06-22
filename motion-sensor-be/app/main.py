from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from . import models, schemas
from .database import engine, get_db
from .mqtt_client import MQTTClient

mqtt_client = MQTTClient(client_id="motion-sensor-backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    mqtt_client.connect()
    yield
    mqtt_client.disconnect()


app = FastAPI(title="Motion Sensor Backend", lifespan=lifespan)


def is_db_connected() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "motion-sensor-backend",
        "database": "connected" if is_db_connected() else "disconnected",
        "mqtt": "connected" if mqtt_client.is_connected() else "disconnected",
    }


@app.get("/api/devices", response_model=list[schemas.DeviceOut])
def get_devices(db: Session = Depends(get_db)):
    return db.query(models.Device).all()


@app.post("/api/devices/register")
def register_device(device: schemas.DeviceRegister, db: Session = Depends(get_db)):
    if db.query(models.Device).filter_by(device_id=device.device_id).first():
        raise HTTPException(status_code=400, detail="Device already registered")

    db.add(models.Device(device_id=device.device_id, name=device.name))
    db.commit()

    mqtt_client.publish_device_status(device.device_id, "registered")
    return {"status": "registered", "device_id": device.device_id}


@app.get("/api/motion/{device_id}", response_model=schemas.MotionOut)
def get_latest_motion(device_id: str, db: Session = Depends(get_db)):
    event = (
        db.query(models.MotionEvent)
        .filter_by(device_id=device_id)
        .order_by(models.MotionEvent.timestamp.desc())
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="No motion events for this device")
    return event


@app.get("/api/motion/{device_id}/history", response_model=list[schemas.MotionOut])
def get_motion_history(device_id: str, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(models.MotionEvent)
        .filter_by(device_id=device_id)
        .order_by(models.MotionEvent.timestamp.desc())
        .limit(limit)
        .all()
    )


@app.post("/api/motion/report")
def report_motion(event: schemas.MotionReport, db: Session = Depends(get_db)):
    db.add(models.MotionEvent(device_id=event.device_id, motion_detected=event.motion_detected))
    db.commit()

    mqtt_client.publish_motion_data(event.device_id, event.motion_detected)
    return {
        "status": "recorded",
        "device_id": event.device_id,
        "motion_detected": event.motion_detected,
    }
