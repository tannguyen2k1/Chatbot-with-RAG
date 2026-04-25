from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
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


@router.get("", response_model=list[ConfigResponse])
async def list_configs(
    group_name: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Lấy danh sách cấu hình (có phân quyền)"""
    service = ConfigService(db)
    try:
        return await service.get_all_configs_for(current_user.id, group_name)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")

@router.get("/general", response_model=dict)
async def get_general_config(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Lấy cài đặt chung (có phân quyền)"""
    service = ConfigService(db)
    try:
        return await service.get_general_config_for(current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.put("/general", response_model=dict)
async def update_general_config(
    data: GeneralConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Cập nhật cài đặt chung (có phân quyền)"""
    service = ConfigService(db)
    try:
        return await service.update_general_config_for(current_user.id, data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.get("/chat", response_model=dict)
async def get_chat_config(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Lấy cấu hình chat hợp nhất (có phân quyền)"""
    service = ConfigService(db)
    try:
        return await service.get_chat_config_for(current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.put("/chat", response_model=dict)
async def update_chat_config(
    data: ChatConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Cập nhật cấu hình chat (có phân quyền)"""
    service = ConfigService(db)
    try:
        return await service.update_chat_config_for(current_user.id, data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.get("/{key}", response_model=ConfigResponse)
async def get_config(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Lấy chi tiết cấu hình theo key (có phân quyền)"""
    service = ConfigService(db)
    try:
        return await service.get_config_for(current_user.id, key)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")



@router.post("", response_model=ConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_config(
    data: ConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Tạo cấu hình mới (có phân quyền)"""
    service = ConfigService(db)
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
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Cập nhật cấu hình theo key (có phân quyền)"""
    service = ConfigService(db)
    try:
        return await service.update_config_for(current_user.id, key, data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.delete("/{key}")
async def delete_config(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Xóa cấu hình (có phân quyền)"""
    service = ConfigService(db)
    try:
        await service.delete_config_for(current_user.id, key)
        return {"message": f"Config '{key}' deleted successfully"}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")
