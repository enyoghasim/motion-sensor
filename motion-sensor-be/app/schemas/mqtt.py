from pydantic import BaseModel, Field

class DeviceAuthChallengeRequest(BaseModel):
    factory_mac: str

class DeviceAuthChallengeResponse(BaseModel):
    challenge: str

class DeviceAuthVerifyRequest(BaseModel):
    factory_mac: str
    signature: str

class DeviceAuthVerifyResponse(BaseModel):
    token: str
    expires_in: int

class MQTTAuthWebhookRequest(BaseModel):
    clientid: str = Field(default="")
    username: str = Field(default="")
    password: str = Field(default="")
    topic: str = Field(default="")
    acc: int = Field(default=0)
