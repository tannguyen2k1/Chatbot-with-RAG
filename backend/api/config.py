from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.models.user import User
from schemas.config import (
    ConfigCreate, 
    ConfigUpdate, 
    ConfigResponse, 
    ChatConfigUpdate, 
    GeneralConfigUpdate
)
from dependencies import get_db, get_current_user
from services import ConfigService, PermissionError

router = APIRouter(prefix="/configs", tags=["Configs"])


def get_config_service(db: AsyncSession = Depends(get_db)) -> ConfigService:
    """Dependency injection cho ConfigService"""
    return ConfigService(db)


@router.get("", response_model=list[ConfigResponse])
async def list_configs(
    group_name: str | None = Query(None),
    service: ConfigService = Depends(get_config_service),
    current_user: User = Depends(get_current_user),
):
    """Lấy danh sách cấu hình (có phân quyền)"""
    try:
        return await service.get_all_configs_for(current_user.id, group_name)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")

@router.get("/general", response_model=dict)
async def get_general_config(
    service: ConfigService = Depends(get_config_service),
    current_user: User = Depends(get_current_user),
):
    """Lấy cài đặt chung (có phân quyền)"""
    try:
        return await service.get_general_config_for(current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.put("/general", response_model=dict)
async def update_general_config(
    data: GeneralConfigUpdate,
    service: ConfigService = Depends(get_config_service),
    current_user: User = Depends(get_current_user),
):
    """Cập nhật cài đặt chung (có phân quyền)"""
    try:
        return await service.update_general_config_for(current_user.id, data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.get("/chat", response_model=dict)
async def get_chat_config(
    service: ConfigService = Depends(get_config_service),
    current_user: User = Depends(get_current_user),
):
    """Lấy cấu hình chat hợp nhất (có phân quyền)"""
    try:
        return await service.get_chat_config_for(current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.put("/chat", response_model=dict)
async def update_chat_config(
    data: ChatConfigUpdate,
    service: ConfigService = Depends(get_config_service),
    current_user: User = Depends(get_current_user),
):
    """Cập nhật cấu hình chat (có phân quyền)"""
    try:
        return await service.update_chat_config_for(current_user.id, data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.get("/{key}", response_model=ConfigResponse)
async def get_config(
    key: str,
    service: ConfigService = Depends(get_config_service),
    current_user: User = Depends(get_current_user),
):
    """Lấy chi tiết cấu hình theo key (có phân quyền)"""
    try:
        return await service.get_config_for(current_user.id, key)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.post("", response_model=ConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_config(
    data: ConfigCreate,
    service: ConfigService = Depends(get_config_service),
    current_user: User = Depends(get_current_user),
):
    """Tạo cấu hình mới (có phân quyền)"""
    try:
        return await service.create_config_for(current_user.id, data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.put("/{key}", response_model=ConfigResponse)
async def update_config(
    key: str,
    data: ConfigUpdate,
    service: ConfigService = Depends(get_config_service),
    current_user: User = Depends(get_current_user),
):
    """Cập nhật cấu hình theo key (có phân quyền)"""
    try:
        return await service.update_config_for(current_user.id, key, data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.delete("/{key}")
async def delete_config(
    key: str,
    service: ConfigService = Depends(get_config_service),
    current_user: User = Depends(get_current_user),
):
    """Xóa cấu hình (có phân quyền)"""
    try:
        await service.delete_config_for(current_user.id, key)
        return {"message": f"Config '{key}' deleted successfully"}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")
