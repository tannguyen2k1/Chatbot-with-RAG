from pydantic import BaseModel, EmailStr


# Validation schema for authentication/authorization data
class TokenData(BaseModel):
    sub: str  # user ID
    role: str # role ID


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class Login(BaseModel):
    username: str
    password: str


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


class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "reset_token_here",
                "new_password": "new_password123"
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