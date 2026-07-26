from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import asyncio
import random
import string
import uuid

from app.schemas.auth import RegisterUser, LoginUser, Token, UserResponse, OTPRequest, OTPVerify, ResetPasswordRequest, ResetPasswordVerify, ResetPasswordResponse, ChangePasswordRequest, ChangeEmailRequest
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_session_token, get_current_user, oauth2_scheme
from app.core.redis_client import redis_client
from app.utils.response import success_response, SuccessResponseModel, ErrorResponseModel
from app.services.email_service import EmailService
from app.repositories.space_repository import SpaceRepository
from app.services.space_service import SpaceService

async def check_rate_limit(key: str, max_requests: int = 5, window_seconds: int = 600):
    requests_count = await redis_client.incr(key)
    if requests_count == 1:
        await redis_client.expire(key, window_seconds)
        
    if requests_count > max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )

async def generate_and_hash_otp() -> tuple[str, str]:
    otp = ''.join(random.choices(string.digits, k=6))
    hashed_otp = await asyncio.to_thread(get_password_hash, otp)
    return otp, hashed_otp

router = APIRouter(
    prefix="/auth", 
    tags=["Authentication"],
    responses={422: {"model": ErrorResponseModel, "description": "Validation Error"}}
)

@router.post("/signup", response_model=SuccessResponseModel[Token])
async def register(user_in: RegisterUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    hashed_password = await asyncio.to_thread(get_password_hash, user_in.password)
    db_user = User(
        email=user_in.email,
        password=hashed_password,
        name=user_in.name,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    await SpaceService(SpaceRepository(db)).create_default_space(db_user)

    token = await create_session_token(db_user.id)
    
    otp, hashed_otp = await generate_and_hash_otp()
    await redis_client.setex(f"otp:{db_user.id}:email_verification", 600, hashed_otp)
    EmailService().enqueue_welcome_email(db_user.email, db_user.name)
    EmailService().enqueue_otp_email(db_user.email, otp)
    
    return success_response(
        message="User registered successfully",
        data=Token(
            access_token=token,
            user=UserResponse(
                id=db_user.id,
                email=db_user.email,
                name=db_user.name,
                email_verified=db_user.email_verified,
            ),
        ).model_dump()
    )

@router.post("/signin", response_model=SuccessResponseModel[Token])
async def login(user_in: LoginUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == user_in.email))
    user = result.scalars().first()
    
    is_valid = False
    if user:
        is_valid = await asyncio.to_thread(verify_password, user_in.password, user.password)
        
    if not user or not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = await create_session_token(user.id)
    return success_response(
        message="Login successful",
        data=Token(
            access_token=token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                email_verified=user.email_verified,
            ),
        ).model_dump()
    )

@router.post("/otp/request", response_model=SuccessResponseModel[None])
async def request_otp(
    request: OTPRequest,
    current_user: User = Depends(get_current_user)
):
    await check_rate_limit(f"rate_limit:otp_request:{current_user.id}")
        
    otp, hashed_otp = await generate_and_hash_otp()
    await redis_client.setex(f"otp:{current_user.id}:{request.scope}", 600, hashed_otp)
    
    if request.scope == "email_verification":
        EmailService().enqueue_otp_email(current_user.email, otp)
    else:
        raise HTTPException(status_code=400, detail="Invalid scope")
        
    return success_response(message="OTP sent successfully")

@router.post("/otp/verify", response_model=SuccessResponseModel[None])
async def verify_otp(
    request: OTPVerify,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await check_rate_limit(f"rate_limit:otp_verify:{current_user.id}")
        
    otp_key = f"otp:{current_user.id}:{request.scope}"
    stored_otp = await redis_client.get(otp_key)
    
    is_valid_otp = False
    if stored_otp:
        is_valid_otp = await asyncio.to_thread(verify_password, request.otp, stored_otp)
        
    if not stored_otp or not is_valid_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP."
        )
        
    if request.scope == "email_verification":
        current_user.email_verified = True
        db.add(current_user)
        await db.commit()
    else:
        raise HTTPException(status_code=400, detail="Invalid scope")
        
    await redis_client.delete(otp_key)
    
    return success_response(message="OTP verified successfully")

@router.post("/change-email", response_model=SuccessResponseModel[None])
async def change_email(
    request: ChangeEmailRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified."
        )

    await check_rate_limit(f"rate_limit:change_email:{current_user.id}")

    result = await db.execute(select(User).filter(User.email == request.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )

    current_user.email = request.email
    db.add(current_user)
    await db.commit()

    await redis_client.delete(f"otp:{current_user.id}:email_verification")

    otp, hashed_otp = await generate_and_hash_otp()
    await redis_client.setex(f"otp:{current_user.id}:email_verification", 600, hashed_otp)
    EmailService().enqueue_otp_email(current_user.email, otp)

    return success_response(message="Email updated. A new verification code has been sent.")

@router.post("/change-password", response_model=SuccessResponseModel[None])
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    is_valid = await asyncio.to_thread(verify_password, request.current_password, current_user.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )
        
    new_hashed_password = await asyncio.to_thread(get_password_hash, request.new_password)
    current_user.password = new_hashed_password
    db.add(current_user)
    await db.commit()
    
    return success_response(message="Password has been changed successfully.")

@router.post("/reset-password/request", response_model=SuccessResponseModel[ResetPasswordResponse])
async def reset_password_request(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    await check_rate_limit(f"rate_limit:reset_request:{request.email}")
        
    result = await db.execute(select(User).filter(User.email == request.email))
    user = result.scalars().first()
    
    request_id = str(uuid.uuid4())
    
    if user:
        otp, hashed_otp = await generate_and_hash_otp()
        
        # Save hash and user_id mapped to the request_id
        await redis_client.setex(f"password_reset:{request_id}:hash", 600, hashed_otp)
        await redis_client.setex(f"password_reset:{request_id}:user_id", 600, str(user.id))
        
        EmailService().enqueue_otp_email(user.email, otp)
        
    return success_response(
        message="If this email is registered, a password reset code has been sent.",
        data=ResetPasswordResponse(request_id=request_id).model_dump()
    )

@router.post("/reset-password/verify", response_model=SuccessResponseModel[None])
async def reset_password_verify(
    request: ResetPasswordVerify,
    db: AsyncSession = Depends(get_db)
):
    await check_rate_limit(f"rate_limit:reset_verify:{request.request_id}")
        
    hash_key = f"password_reset:{request.request_id}:hash"
    user_id_key = f"password_reset:{request.request_id}:user_id"
    
    stored_hash = await redis_client.get(hash_key)
    stored_user_id = await redis_client.get(user_id_key)
    
    is_valid_otp = False
    if stored_hash:
        is_valid_otp = await asyncio.to_thread(verify_password, request.otp, stored_hash)
        
    if not stored_hash or not stored_user_id or not is_valid_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired request or OTP."
        )
        
    user_id = int(stored_user_id)
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")
        
    new_hashed_password = await asyncio.to_thread(get_password_hash, request.new_password)
    user.password = new_hashed_password
    db.add(user)
    await db.commit()
    
    await redis_client.delete(hash_key)
    await redis_client.delete(user_id_key)
    
    return success_response(message="Password has been reset successfully.")

@router.post("/signout", response_model=SuccessResponseModel[None])
async def logout(token: str = Depends(oauth2_scheme)):
    await redis_client.delete(f"session:{token}")
    return success_response(message="Successfully logged out")