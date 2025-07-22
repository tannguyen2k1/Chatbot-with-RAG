from datetime import timedelta, datetime, timezone
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from database.models.auth_models import User
from config.settings import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: Session):
        self.db = db


    def authenticate_user(self, username: str, password: str) -> User:
        user = self.db.query(User).filter(User.username == username).first()
        if not user:
            raise ValueError("User not found")
        if not pwd_context.verify(password, str(user.hashed_password)):
            raise ValueError("Incorrect password")
        return user


    def create_access_token(self, user: User, expires_delta: timedelta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)) -> str:
        to_encode = {"sub": str(user.id), "role": user.role}
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt


    def create_refresh_token(self, user: User, expires_delta: timedelta = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)) -> str:
        to_encode = {"sub": str(user.id), "role": user.role}
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt


    def change_password(self, user: User, current_password: str, new_password: str) -> bool:
        """Đổi mật khẩu cho user hiện tại"""
        # Verify current password
        if not pwd_context.verify(current_password, str(user.hashed_password)):
            raise ValueError("Current password is incorrect")
        
        # Hash new password
        hashed_new_password = pwd_context.hash(new_password)
        
        # Update password in database
        self.db.query(User).filter(User.id == user.id).update({"hashed_password": hashed_new_password})
        self.db.commit()
        self.db.refresh(user)
        
        return True
    
    
    def create_reset_token(self, user: User) -> str:
        """Tạo token để reset password (có thời hạn ngắn)"""
        to_encode = {
            "sub": str(user.id), 
            "type": "password_reset",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=15)  # Token có hiệu lực 15 phút
        }
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt
    
    
    def verify_reset_token(self, token: str) -> User:
        """Verify reset password token và trả về user"""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get("sub")
            token_type = payload.get("type")
            
            if user_id is None or token_type != "password_reset":
                raise ValueError("Invalid token")
                
            user = self.db.query(User).filter(User.id == int(user_id)).first()
            if not user:
                raise ValueError("User not found")
                
            return user
        except JWTError:
            raise ValueError("Invalid or expired reset token")
    
    
    def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password bằng token"""
        user = self.verify_reset_token(token)
        
        # Hash new password
        hashed_new_password = pwd_context.hash(new_password)
        
        # Update password in database
        self.db.query(User).filter(User.id == user.id).update({"hashed_password": hashed_new_password})
        self.db.commit()
        self.db.refresh(user)
        
        return True
    
    
    def get_user_by_email(self, email: str) -> User:
        """Lấy user theo email"""
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            raise ValueError("User with this email not found")
        return user
    
    
    def simple_reset_password(self, username: str, new_password: str) -> bool:
        """Reset password đơn giản chỉ với username và new_password"""
        user = self.db.query(User).filter(User.username == username).first()
        if not user:
            raise ValueError("User not found")
        
        # Hash new password
        hashed_new_password = pwd_context.hash(new_password)
        
        # Update password in database
        self.db.query(User).filter(User.id == user.id).update({"hashed_password": hashed_new_password})
        self.db.commit()
        self.db.refresh(user)
        
        return True