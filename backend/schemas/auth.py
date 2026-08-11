from pydantic import BaseModel, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "current_password": "old_password123",
                "new_password": "new_password456",
            }
        }
    )


class ResetPasswordRequest(BaseModel):
    email: EmailStr

    model_config = ConfigDict(json_schema_extra={"example": {"email": "user@example.com"}})


class MessageResponse(BaseModel):
    message: str
