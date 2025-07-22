from enum import Enum
from pydantic_settings import BaseSettings
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    # Type hints for development, không ảnh hưởng runtime
    pass


class OrderStatus(str, Enum):
    pending = 'pending'
    cancelled = 'cancelled'
    completed = 'completed'


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    JWT_SECRET_KEY: str = ""
    JWT_REFRESH_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 43200


    class Config:
        env_file = ".env"


settings = Settings()