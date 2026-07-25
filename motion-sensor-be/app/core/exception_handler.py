from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

def get_message(error):

    t = error["type"]

    field = error["loc"][-1].replace("_", " ").title()

    if t == "string_too_short":
        return f"{field} must be at least {error['ctx']['min_length']} characters."

    if t == "string_too_long":
        return f"{field} must be at most {error['ctx']['max_length']} characters."

    if t == "value_error":
        return str(error["ctx"]["error"])

    return error["msg"]


async def validation_exception_handler(
    _request: Request,
    exc: Exception,
):
    assert isinstance(exc, RequestValidationError)
    errors = []

    for err in exc.errors():

        field = err["loc"][-1]

        errors.append({
            "field": field,
            "message": get_message(err),
        })

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation failed.",
            "errors": errors,
        },
    )


async def http_exception_handler(
    _request: Request,
    exc: Exception,
):
    assert isinstance(exc, StarletteHTTPException)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "errors": None,
        },
        headers=exc.headers,
    )