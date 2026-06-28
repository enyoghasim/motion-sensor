from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class DeviceRegister(BaseModel):
    device_id: str
    name: str
    owner_email: EmailStr


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: str
    name: str | None
    owner_email: str
    created_at: datetime
