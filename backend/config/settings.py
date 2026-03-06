from enum import Enum
from pydantic_settings import BaseSettings
from typing import TYPE_CHECKING, Optional

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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10000000
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10000000
    CORS_ALLOW_ORIGINS: str = "https://vtms.localhost,http://localhost:3000,http://127.0.0.1:3000,http://localhost,capacitor://localhost,ionic://localhost,null"
    CORS_ALLOW_ORIGIN_REGEX: str = r"^(null|https?://([a-zA-Z0-9-]+\.)?(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+)(:\d+)?|(capacitor|ionic|file)://.*)$"
    REFRESH_COOKIE_NAME: str = "refresh_token"
    REFRESH_COOKIE_SECURE: bool = False
    REFRESH_COOKIE_SAMESITE: str = "lax"
    REFRESH_COOKIE_PATH: str = "/"
    REFRESH_COOKIE_DOMAIN: Optional[str] = None

    @property
    def cors_allow_origins_list(self) -> list[str]:
        return [x.strip() for x in self.CORS_ALLOW_ORIGINS.split(",") if x.strip()]


    class Config:
        env_file = ".env"


settings = Settings()