from schemas.user import UserResponse, PaginatedUserResponse  # Pydantic response model for users
from services.rbac import RBACService
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from middleware.dependencies import get_db, get_current_user
from services.user import UserService, UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

# Endpoint: Create a new user (Root/Admin only)
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from services.rbac import RBACService
    
    role_service = RBACService(db)
    if not role_service.is_admin_or_above(current_user):
        raise HTTPException(status_code=403, detail="You don't have permission to create users")
    
    service = UserService(db)
    user = service.create_user(user_data)
    # Ensure user has at least one role assigned if role is provided in user_data
    from database.models.auth_models import UserRole, Role
    if hasattr(user_data, 'role') and user_data.role:
        # Find role by name
        role_obj = db.query(Role).filter_by(name=user_data.role).first()
        if role_obj:
            # Check if user already has this role
            existing = db.query(UserRole).filter_by(user_id=user.id, role_id=role_obj.id).first()
            if not existing:
                db.add(UserRole(user_id=user.id, role_id=role_obj.id))
                db.commit()
    # Lấy roles dạng mảng
    user_roles = db.query(UserRole).filter_by(user_id=user.id).all()
    role_ids = [ur.role_id for ur in user_roles]
    roles = db.query(Role).filter(Role.id.in_(role_ids)).all() if role_ids else []
    user_dict = user.__dict__.copy()
    user_dict["roles"] = [r.name for r in roles] if roles else []
    return UserResponse(**user_dict)

# Endpoint: Retrieve profile for the currently logged-in user
@router.get("/me", response_model=UserResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # RBAC: build permissions từ role/privileges
    role_service = RBACService(db)
    user_dict = current_user.__dict__.copy()
    user_dict["permissions"] = role_service.get_user_permissions(current_user.id)
    # Chuẩn RBAC: trả về roles là mảng tên role
    from database.models.auth_models import UserRole, Role
    user_roles = db.query(UserRole).filter_by(user_id=current_user.id).all()
    role_ids = [ur.role_id for ur in user_roles]
    roles = db.query(Role).filter(Role.id.in_(role_ids)).all() if role_ids else []
    user_dict["roles"] = [r.name for r in roles]
    return UserResponse(**user_dict)

# Endpoint: Retrieve a list of users (Admin/Root only)
@router.get("/", response_model=PaginatedUserResponse)
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", description="Search by username or email"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # removed import of RoleService, now using RBACService
    role_service = RBACService(db)
    if not role_service.is_admin_or_above(current_user):
        raise HTTPException(status_code=403, detail="You don't have permission to view users")
    service = UserService(db)
    skip = (page - 1) * page_size
    users = service.list_users(skip=skip, limit=page_size, search=search)
    total = service.count_users(search=search)
    result = []
    from database.models.auth_models import UserRole, Role
    for u in users:
        status = "active" if getattr(u, "is_active", 1) == 1 else "inactive"
        role_service = RBACService(db)
        if hasattr(u, "id") and isinstance(u.id, int):
            permissions = role_service.get_user_permissions(u.id)
        else:
            permissions = {}
        # Lấy roles dạng mảng
        user_roles = db.query(UserRole).filter_by(user_id=u.id).all()
        role_ids = [ur.role_id for ur in user_roles]
        roles = db.query(Role).filter(Role.id.in_(role_ids)).all() if role_ids else []
        user_dict = u.__dict__.copy()
        user_dict["roles"] = [r.name for r in roles]
        user_dict["permissions"] = permissions
        user_dict["status"] = status
        result.append(UserResponse(**user_dict))
    return {
        "data": result,
        "total": total,
        "page": page,
        "page_size": page_size
    }

# Endpoint: Retrieve user details by ID (Root/Admin có thể xem theo cấp độ)
@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # removed import of RoleService, now using RBACService
    service = UserService(db)
    role_service = RBACService(db)
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Kiểm tra quyền xem user
    if not role_service.can_manage_user(current_user, user):
        raise HTTPException(status_code=403, detail="Not authorized to view this user")
    status = "active" if getattr(user, "is_active", 1) == 1 else "inactive"
    role_service = RBACService(db)
    if hasattr(user, "id") and isinstance(user.id, int):
        permissions = role_service.get_user_permissions(user.id)
    else:
        permissions = {}
    # Lấy roles dạng mảng
    from database.models.auth_models import UserRole, Role
    user_roles = db.query(UserRole).filter_by(user_id=user.id).all()
    role_ids = [ur.role_id for ur in user_roles]
    roles = db.query(Role).filter(Role.id.in_(role_ids)).all() if role_ids else []
    user_dict = user.__dict__.copy()
    user_dict["roles"] = [r.name for r in roles]
    user_dict["permissions"] = permissions
    user_dict["status"] = status
    return UserResponse(**user_dict)

# Endpoint: Update user details by ID (Root/Admin có thể quản lý theo cấp độ)
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # removed import of RoleService, now using RBACService
    service = UserService(db)
    role_service = RBACService(db)
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Kiểm tra quyền quản lý user
    if not role_service.can_manage_user(current_user, user):
        raise HTTPException(status_code=403, detail="Not authorized to manage this user")
    # Chỉ root mới được sửa role, và không cho sửa thành 'root'
    if not role_service.is_root(current_user):
        update_data.role = None
    elif update_data.role == "root":
        raise HTTPException(status_code=403, detail="Không được gán role là root")
    updated_user = service.update_user(user_id, update_data)
    # Lấy roles dạng mảng giống các API khác
    from database.models.auth_models import UserRole, Role
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found after update")
    user_roles = db.query(UserRole).filter_by(user_id=getattr(updated_user, "id", None)).all()
    role_ids = [ur.role_id for ur in user_roles]
    roles = db.query(Role).filter(Role.id.in_(role_ids)).all() if role_ids else []
    user_dict = updated_user.__dict__.copy()
    user_dict["roles"] = [r.name for r in roles]
    return UserResponse(**user_dict)

# Endpoint: Delete a user by ID (Root có thể xóa tất cả, Admin chỉ xóa user)
@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
        user_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    # removed import of RoleService, now using RBACService
    
    service = UserService(db)
    role_service = RBACService(db)
    
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Kiểm tra quyền xóa user
    if not role_service.can_manage_user(current_user, user):
        raise HTTPException(status_code=403, detail="Not authorized to delete this user")
    
    success = service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": f"User with ID: {user_id} has been deleted"}




