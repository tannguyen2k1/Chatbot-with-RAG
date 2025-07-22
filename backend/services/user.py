from sqlalchemy.orm import Session
from database.models.auth_models import User
from pydantic import BaseModel


# Pydantic schemas for user operations
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str | None = None
    phone: str | None = None
    is_active: int = 1
    role: str = "user"


class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    full_name: str | None = None
    phone: str | None = None
    is_active: int | None = None
    role: str | None = None


class UserService:
    def __init__(self, db: Session):
        self.db = db


    def create_user(self, user_data: UserCreate) -> User:
        # Check if username already exists
        existing_username = self.db.query(User).filter_by(username=user_data.username).first()
        if existing_username:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User with username '{user_data.username}' already exists."
            )
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed_password = pwd_context.hash(user_data.password)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            phone=user_data.phone,
            is_active=user_data.is_active,
            role=user_data.role
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user


    def get_user(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()


    def update_user(self, user_id: int, update_data: UserUpdate) -> User | None:
        user = self.get_user(user_id)
        if not user:
            return None
        update_dict = {}
        if update_data.username is not None:
            update_dict["username"] = update_data.username
        if update_data.email is not None:
            update_dict["email"] = update_data.email
        if update_data.full_name is not None:
            update_dict["full_name"] = update_data.full_name
        if update_data.phone is not None:
            update_dict["phone"] = update_data.phone
        if update_data.is_active is not None:
            update_dict["is_active"] = update_data.is_active
        if update_dict:
            self.db.query(User).filter(User.id == user_id).update(update_dict)
            self.db.commit()
            self.db.refresh(user)
        return user


    def delete_user(self, user_id: int) -> bool:
        user = self.get_user(user_id)
        if not user:
            return False
        self.db.delete(user)
        self.db.commit()
        return True


    def list_users(self, skip: int = 0, limit: int = 10, search: str = "") -> list[User]:
        query = self.db.query(User)
        if search:
            search_lower = f"%{search.lower()}%"
            query = query.filter(
                (User.username.ilike(search_lower)) |
                (User.email.ilike(search_lower))
            )
        return query.order_by(User.id.asc()).offset(skip).limit(limit).all()

    def count_users(self, search: str = "") -> int:
        query = self.db.query(User)
        if search:
            search_lower = f"%{search.lower()}%"
            query = query.filter(
                (User.username.ilike(search_lower)) |
                (User.email.ilike(search_lower))
            )
        return query.count()