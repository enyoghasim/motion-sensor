from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class DeviceClaimStartRequest(BaseModel):
    factory_mac: str = Field(..., description="The factory MAC address of the ESP32 (e.g., AA:BB:CC:DD:EE:FF)")

class DeviceClaimStartResponse(BaseModel):
    challenge: str = Field(..., description="A 32-byte secure random challenge, hex encoded")
    nonce: str = Field(..., description="A 16-byte random nonce (optional usage)")
    expires_in: int = Field(default=300, description="Expiration time in seconds")

class DeviceClaimFinishRequest(BaseModel):
    factory_mac: str
    challenge: str
    signature: str = Field(..., description="Ed25519 signature in hex format (64 bytes -> 128 hex chars)")
    public_key: str = Field(..., description="Ed25519 public key in hex format (32 bytes -> 64 hex chars)")

import uuid

class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    factory_mac: str
    name: str | None
    status: str
    space_id: int | None
    created_at: datetime
    last_seen: datetime | None

class DevicePaginatedResponse(BaseModel):
    items: list[DeviceOut]
    next_cursor: datetime | None

class DeviceDeleteRequest(BaseModel):
    password: str
