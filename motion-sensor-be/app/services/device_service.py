import secrets
from fastapi import HTTPException
from app.core.mqtt_client import MQTTClient
from app.models.device import Device
from app.models.user import User
from app.repositories.device_repository import DeviceRepository
from app.services.email_service import EmailService
from app.services.crypto_service import CryptoService
from app.core.redis_client import redis_client

import uuid
from datetime import datetime
from app.core.security import verify_password

class DeviceService:
    def __init__(self, repository: DeviceRepository, mqtt_client: MQTTClient, email_service: EmailService):
        self.repository = repository
        self.mqtt_client = mqtt_client
        self.email_service = email_service

    async def get_user_devices(self, user: User, space_id: int | None = None, cursor: datetime | None = None, limit: int = 10) -> dict:
        # Fetch limit + 1 to know if there's a next page
        devices = await self.repository.get_user_devices_cursor(user.id, space_id, cursor, limit + 1)
        
        next_cursor = None
        if len(devices) > limit:
            next_cursor = devices[-2].created_at # The last item of the current page
            devices = devices[:limit]
            
        return {
            "items": devices,
            "next_cursor": next_cursor
        }

    async def delete_device(self, user: User, device_id: uuid.UUID, password: str) -> None:
        if not verify_password(password, user.password):
            raise HTTPException(status_code=403, detail="Invalid password.")
            
        device = await self.repository.get_by_id(device_id)
        if not device:
            raise HTTPException(status_code=404, detail="Device not found.")
            
        if device.owner_id != user.id:
            raise HTTPException(status_code=403, detail="You do not own this device.")
            
        await self.repository.delete(device)
        self.email_service.enqueue_device_deleted_email(user.email, device.name or device.factory_mac)

    async def start_claim(self, user: User, factory_mac: str) -> dict:
        device = await self.repository.get_by_factory_mac(factory_mac)
        if device and device.owner_id != user.id:
            raise HTTPException(status_code=403, detail="Device is already owned by someone else.")
        
        # Generate challenge and nonce
        challenge = secrets.token_hex(32)
        nonce = secrets.token_hex(16)
        
        # Store in Redis for 5 minutes (300 seconds)
        redis_key = f"claim:challenge:{factory_mac}"
        await redis_client.setex(redis_key, 300, challenge)
        
        return {
            "challenge": challenge,
            "nonce": nonce,
            "expires_in": 300
        }

    async def finish_claim(self, user: User, factory_mac: str, challenge: str, signature: str, public_key: str) -> dict:
        redis_key = f"claim:challenge:{factory_mac}"
        saved_challenge = await redis_client.get(redis_key)
        
        if not saved_challenge or saved_challenge != challenge:
            raise HTTPException(status_code=400, detail="Invalid or expired challenge.")

        # Message to verify: mac + challenge
        message = (factory_mac + challenge).encode('utf-8')
        
        is_valid = CryptoService.verify_ed25519_signature(public_key, message, signature)
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid signature.")
            
        device = await self.repository.get_by_factory_mac(factory_mac)
        if device:
            device.owner_id = user.id
            device.public_key = public_key
            device.status = "Paired"
            await self.repository.update(device)
        else:
            device = await self.repository.create(
                factory_mac=factory_mac, 
                owner_id=user.id, 
                public_key=public_key,
                status="Paired",
                name=f"Sensor {factory_mac[-8:]}"
            )

        # Cleanup redis
        await redis_client.delete(redis_key)
        
        self.email_service.enqueue_device_added_email(user.email, str(device.id), device.name or device.factory_mac)

        return {"status": "Claim Successful"}

    async def get_auth_challenge(self, factory_mac: str) -> dict:
        device = await self.repository.get_by_factory_mac(factory_mac)
        if not device or not device.public_key:
            raise HTTPException(status_code=404, detail="Device not found or not paired.")
            
        challenge = secrets.token_hex(32)
        redis_key = f"auth:challenge:{factory_mac}"
        await redis_client.setex(redis_key, 60, challenge) # Challenge valid for 60s
        
        return {"challenge": challenge}

    async def verify_auth_challenge(self, factory_mac: str, signature: str) -> dict:
        redis_key = f"auth:challenge:{factory_mac}"
        challenge = await redis_client.get(redis_key)
        
        if not challenge:
            raise HTTPException(status_code=400, detail="Challenge expired or not requested.")

        device = await self.repository.get_by_factory_mac(factory_mac)
        if not device or not device.public_key:
            raise HTTPException(status_code=404, detail="Device not found.")

        message = (factory_mac + challenge).encode('utf-8')
        
        is_valid = CryptoService.verify_ed25519_signature(device.public_key, message, signature)
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid signature.")

        # Signature is valid, generate an opaque token
        opaque_token = secrets.token_urlsafe(32)
        token_key = f"device_token:{opaque_token}"
        
        # Token valid for 1 hour (3600 seconds)
        await redis_client.setex(token_key, 3600, factory_mac)
        await redis_client.delete(redis_key)

        return {
            "token": opaque_token,
            "expires_in": 3600
        }
