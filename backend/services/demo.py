from sqlalchemy.orm import Session
from database.models.demos import Demo
from validators.demos import DemoCreate, DemoUpdate
from typing import List, Optional


class DemoService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_demos(self, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> List[Demo]:
        """Lấy tất cả demos với phân trang và tìm kiếm"""
        query = self.db.query(Demo)
        if search:
            like = f"%{search}%"
            query = query.filter(
                (Demo.title.ilike(like)) | (Demo.description.ilike(like))
            )
        return query.order_by(Demo.id.asc()).offset(skip).limit(limit).all()

    def count_demos(self, search: Optional[str] = None) -> int:
        """Đếm tổng số lượng demos (có tìm kiếm)"""
        query = self.db.query(Demo)
        if search:
            like = f"%{search}%"
            query = query.filter(
                (Demo.title.ilike(like)) | (Demo.description.ilike(like))
            )
        return query.count()

    def get_demo_by_id(self, demo_id: int) -> Optional[Demo]:
        """Lấy demo theo ID"""
        return self.db.query(Demo).filter(Demo.id == demo_id).first()

    def create_demo(self, demo_data: DemoCreate) -> Demo:
        """Tạo demo mới"""
        new_demo = Demo(
            title=demo_data.title,
            description=demo_data.description
        )
        self.db.add(new_demo)
        self.db.commit()
        self.db.refresh(new_demo)
        return new_demo

    def update_demo(self, demo_id: int, demo_data: DemoUpdate) -> Optional[Demo]:
        """Cập nhật demo"""
        demo = self.get_demo_by_id(demo_id)
        if not demo:
            return None
        update_dict = {}
        if demo_data.title is not None:
            update_dict["title"] = demo_data.title
        if demo_data.description is not None:
            update_dict["description"] = demo_data.description
        if update_dict:
            self.db.query(Demo).filter(Demo.id == demo_id).update(update_dict)
            self.db.commit()
            self.db.refresh(demo)
        return demo

    def delete_demo(self, demo_id: int) -> bool:
        """Xóa demo"""
        demo = self.get_demo_by_id(demo_id)
        if not demo:
            return False
        
        self.db.delete(demo)
        self.db.commit()
        return True

