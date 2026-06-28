from sqlalchemy.orm import Session

from app.models import Device


class DeviceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> list[Device]:
        return self.db.query(Device).all()

    def get_by_device_id(self, device_id: str) -> Device | None:
        return self.db.query(Device).filter_by(device_id=device_id).first()

    def create(self, device_id: str, name: str, owner_email: str) -> Device:
        device = Device(device_id=device_id, name=name, owner_email=owner_email)
        self.db.add(device)
        self.db.commit()
        return device
