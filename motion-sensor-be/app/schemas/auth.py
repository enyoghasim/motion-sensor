import re
from pydantic import EmailStr, BaseModel, Field
from pydantic.functional_validators import AfterValidator
from typing import Annotated

def validate_password(v: str) -> str:
    if not re.search(r"[A-Z]", v):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", v):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", v):
        raise ValueError("Password must contain at least one number")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_+=\[\]\\/;'~`]", v):
        raise ValueError("Password must contain at least one special character")
    return v

Password = Annotated[str, Field(min_length=8, max_length=128), AfterValidator(validate_password)]

class RegisterUser(BaseModel):
    email: EmailStr
    password: Password
    name: str = Field(min_length=2, max_length=100)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: Password

class ChangeEmailRequest(BaseModel):
    email: EmailStr

class LoginUser(BaseModel):
    email: EmailStr
    password: Password

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    email_verified: bool

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class OTPRequest(BaseModel):
    scope: str

class OTPVerify(BaseModel):
    otp: str
    scope: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordVerify(BaseModel):
    request_id: str
    otp: str
    new_password: Password

class ResetPasswordResponse(BaseModel):
    request_id: str