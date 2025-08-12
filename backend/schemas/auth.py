
from pydantic import BaseModel, EmailStr

# Validation schema for authentication/authorization data

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict | None = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "old_password123",
                "new_password": "new_password456"
            }
        }
class ResetPasswordRequest(BaseModel):
    email: EmailStr
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }

class MessageResponse(BaseModel):
    message: str

class SimpleResetPasswordRequest(BaseModel):
    username: str
    new_password: str
    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
                "new_password": "new_password123"
            }
        }
        
