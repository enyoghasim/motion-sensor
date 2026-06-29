from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import asyncio

from app.schemas.auth import RegisterUser, LoginUser, Token, UserResponse
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_session_token, get_current_user, oauth2_scheme
from app.core.redis_client import redis_client
from app.utils.response import success_response, SuccessResponseModel, ErrorResponseModel

router = APIRouter(
    prefix="/auth", 
    tags=["Authentication"],
    responses={422: {"model": ErrorResponseModel, "description": "Validation Error"}}
)

@router.post("/register", response_model=SuccessResponseModel[Token])
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
    
    token = await create_session_token(db_user.id)
    return success_response(
        message="User registered successfully",
        data=Token(access_token=token).model_dump()
    )

@router.post("/login", response_model=SuccessResponseModel[Token])
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
        data=Token(access_token=token).model_dump()
    )

@router.get("/me", response_model=SuccessResponseModel[UserResponse])
async def read_users_me(current_user: User = Depends(get_current_user)):
    user_data = {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "email_verified": current_user.email_verified,
    }
    return success_response(message="User profile retrieved", data=user_data)

@router.post("/logout", response_model=SuccessResponseModel[None])
async def logout(token: str = Depends(oauth2_scheme)):
    await redis_client.delete(f"session:{token}")
    return success_response(message="Successfully logged out")