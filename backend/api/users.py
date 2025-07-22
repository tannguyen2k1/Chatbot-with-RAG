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
    return user

# Endpoint: Retrieve profile for the currently logged-in user
@router.get("/me", response_model=UserResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # RBAC: permissions can be fetched from role/privileges if needed
    user_dict = current_user.__dict__.copy()
    user_dict["permissions"] = getattr(current_user, "permissions", {})
    return UserResponse(**user_dict)

# Endpoint: Retrieve a list of users (Admin/Root only)
@router.get("/", response_model=PaginatedUserResponse)
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # removed import of RoleService, now using RBACService
    role_service = RBACService(db)
    if not role_service.is_admin_or_above(current_user):
        raise HTTPException(status_code=403, detail="You don't have permission to view users")
    service = UserService(db)
    skip = (page - 1) * page_size
    users = service.list_users(skip=skip, limit=page_size)
    total = service.count_users()
    result = []
    for u in users:
        status = "active" if getattr(u, "is_active", 1) == 1 else "inactive"
        result.append(UserResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            phone=u.phone,
            is_active=u.is_active,
            role=u.role,
            permissions=getattr(u, "permissions", {}),
            status=status
        ))
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
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        is_active=user.is_active,
        role=user.role,
        permissions=getattr(user, "permissions", {}),
        status=status
    )

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
    return updated_user

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




