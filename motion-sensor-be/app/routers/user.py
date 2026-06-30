from fastapi import APIRouter, Depends
from app.schemas.auth import UserResponse
from app.models.user import User
from app.core.security import get_current_user
from app.utils.response import success_response, SuccessResponseModel

router = APIRouter(
    prefix="/user",
    tags=["User"]
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
