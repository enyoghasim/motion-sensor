import os

# Must happen before any `app.*` module is imported, since app.core.database
# reads DATABASE_URL at import time. This keeps the whole suite hermetic --
# no real Postgres/Redis/MQTT broker required.
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ.setdefault("RESEND_API_KEY", "test-key")
os.environ.setdefault("MQTT_BROKER_HOST", "localhost")

import uuid
from typing import AsyncIterator, Callable

import fakeredis.aioredis
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.core.rate_limit as rate_limit_module
import app.core.security as security_module
import app.routers.auth as auth_router_module
import app.routers.mqtt as mqtt_router_module
import app.services.device_service as device_service_module
from app.core.database import Base, get_db
from app.core.mqtt_client import get_mqtt_client
from app.core.security import create_session_token, get_password_hash
from app.main import app as fastapi_app
from app.models.user import User
from app.services.email_service import EmailService

# Every module that did `from app.core.redis_client import redis_client` needs
# its own binding patched -- patching app.core.redis_client.redis_client alone
# would not reach these already-bound local names.
_REDIS_PATCH_TARGETS = (
    security_module,
    rate_limit_module,
    auth_router_module,
    mqtt_router_module,
    device_service_module,
)


class _FakeMQTTClient:
    def is_connected(self) -> bool:
        return False

    def publish_motion_data(self, device_id: str, motion_detected: bool) -> None:
        pass

    def publish_device_status(self, device_id: str, status: str) -> None:
        pass


@pytest_asyncio.fixture
async def db_engine() -> AsyncIterator:
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncIterator[AsyncSession]:
    session_maker = async_sessionmaker(bind=db_engine, expire_on_commit=False)
    async with session_maker() as session:
        yield session


@pytest.fixture
def fake_redis(monkeypatch) -> fakeredis.aioredis.FakeRedis:
    fake = fakeredis.aioredis.FakeRedis(decode_responses=True)
    for module in _REDIS_PATCH_TARGETS:
        monkeypatch.setattr(module, "redis_client", fake)
    return fake


@pytest.fixture(autouse=True)
def no_email(monkeypatch):
    for method in (
        "enqueue_welcome_email",
        "enqueue_device_added_email",
        "enqueue_otp_email",
        "enqueue_device_deleted_email",
    ):
        monkeypatch.setattr(EmailService, method, lambda self, *a, **kw: None)


@pytest_asyncio.fixture
async def client(db_engine, fake_redis) -> AsyncIterator[AsyncClient]:
    session_maker = async_sessionmaker(bind=db_engine, expire_on_commit=False)

    async def override_get_db():
        async with session_maker() as session:
            yield session

    fastapi_app.dependency_overrides[get_db] = override_get_db
    fastapi_app.dependency_overrides[get_mqtt_client] = lambda: _FakeMQTTClient()

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def make_user(db_session: AsyncSession) -> Callable:
    async def _make_user(
        email: str | None = None,
        password: str = "Password123!",
        name: str = "Test User",
        verified: bool = False,
    ) -> User:
        user = User(
            email=email or f"{uuid.uuid4().hex}@example.com",
            password=get_password_hash(password),
            name=name,
            email_verified=verified,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user

    return _make_user


@pytest.fixture
def auth_headers(fake_redis) -> Callable:
    async def _auth_headers(user: User) -> dict:
        token = await create_session_token(user.id)
        return {"Authorization": f"Bearer {token}"}

    return _auth_headers
