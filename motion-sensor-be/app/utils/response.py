from pydantic import BaseModel
from typing import Any, Generic, TypeVar, Optional

T = TypeVar('T')

class SuccessResponseModel(BaseModel, Generic[T]):
    success: bool = True
    message: str
    data: Optional[T] = None
    meta: Optional[Any] = None

class ErrorResponseModel(BaseModel):
    success: bool = False
    message: str
    errors: Optional[list[Any]] = None

def success_response(
    message: str,
    data: Any = None,
    meta: Any = None,
):
    response = {
        "success": True,
        "message": message,
    }

    if data is not None:
        response["data"] = data

    if meta is not None:
        response["meta"] = meta

    return response


def error_response(
    message: str,
    errors: list | None = None,
):
    response: dict[str, Any] = {
        "success": False,
        "message": message,
    }

    if errors is not None:
        response["errors"] = errors

    return response