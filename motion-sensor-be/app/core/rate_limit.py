from fastapi import HTTPException, status

from app.core.redis_client import redis_client


async def check_rate_limit(key: str, max_requests: int = 5, window_seconds: int = 600):
    requests_count = await redis_client.incr(key)
    if requests_count == 1:
        await redis_client.expire(key, window_seconds)

    if requests_count > max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )
