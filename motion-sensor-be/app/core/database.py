import os
from dotenv import load_dotenv

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

load_dotenv()

db_url = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/motion_sensor"
)

if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(db_url)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, autoflush=False, autocommit=False, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with SessionLocal() as db:
        yield db
