from fastapi import APIRouter, HTTPException, Response, status
from app.schemas.mqtt import MQTTAuthWebhookRequest
from app.core.redis_client import redis_client

router = APIRouter(prefix="/api/mqtt", tags=["MQTT Webhook"])

@router.post("/auth")
async def verify_mqtt_auth(request: MQTTAuthWebhookRequest):
    """
    Webhook endpoint for MQTT Broker (e.g. EMQX or Mosquitto auth-plug).
    The broker sends the credentials here to verify if the device is allowed to connect.
    """
    # The device uses its factory_mac as the clientid/username and the opaque token as the password
    token = request.password
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing password/token")
        
    token_key = f"device_token:{token}"
    factory_mac = await redis_client.get(token_key)
    
    if not factory_mac:
        # Invalid or expired token
        # Returning 401 Unauthorized or 400 Bad Request usually tells the broker to deny access.
        return Response(status_code=status.HTTP_401_UNAUTHORIZED)
        
    # Check if the token's mac matches the requested username/clientid
    # Note: Depending on your MQTT client code on the ESP32, you might set the clientid to the MAC.
    if request.username and request.username != factory_mac and request.clientid != factory_mac:
        return Response(status_code=status.HTTP_401_UNAUTHORIZED)
        
    # Valid token, allow connection
    return Response(status_code=status.HTTP_200_OK)
