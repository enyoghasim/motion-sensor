from sqlalchemy.orm import Session

from app.models import MotionEvent


class MotionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, device_id: str, motion_detected: bool) -> MotionEvent:
        event = MotionEvent(device_id=device_id, motion_detected=motion_detected)
        self.db.add(event)
        self.db.commit()
        return event

    def get_latest(self, device_id: str) -> MotionEvent | None:
        return (
            self.db.query(MotionEvent)
            .filter_by(device_id=device_id)
            .order_by(MotionEvent.timestamp.desc())
            .first()
        )

    def get_history(self, device_id: str, limit: int) -> list[MotionEvent]:
        return (
            self.db.query(MotionEvent)
            .filter_by(device_id=device_id)
            .order_by(MotionEvent.timestamp.desc())
            .limit(limit)
            .all()
        )
