import os
import shutil
import uuid
from typing import List, Dict, Any, Tuple
from fastapi import UploadFile

# 1. Unstructured dùng làm Parser
from unstructured.partition.auto import partition
from unstructured.partition.html import partition_html
from unstructured.partition.text import partition_text

class IngestionService:
    def __init__(self):
        self.temp_dir = "./temp_ingestion"
        os.makedirs(self.temp_dir, exist_ok=True)

    def parse_elements(self, elements) -> List[Dict[str, Any]]:
        """
        Nhận diện và phân loại cấu trúc (Title, NarrativeText, ListItem, Table...)
        """
        parsed_elements = []
        for el in elements:
            el_type = el.category  # VD: 'Title', 'NarrativeText', 'ListItem', 'Table'
            parsed_elements.append({
                "type": el_type,
                "text": str(el)
            })
        return parsed_elements

    async def ingest_file(self, file: UploadFile) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Xử lý tải lên tài liệu (PDF, DOCX, HTML). Trả về parsed_elements và metadata"""
        file_ext = os.path.splitext(file.filename)[1].lower()
        temp_file_path = os.path.join(self.temp_dir, f"{uuid.uuid4()}{file_ext}")
        
        try:
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Unstructured Parser
            # Sử dụng strategy="fast" để bỏ qua OCR và nhận diện hình ảnh,
            # giúp đọc text trực tiếp cực nhanh và tránh lỗi thiếu module unstructured_inference
            elements = partition(filename=temp_file_path, strategy="fast")
            
            base_metadata = {
                "filename": file.filename,
                "file_type": file.content_type,
                "extension": file_ext
            }
            
            # Parse
            parsed_elements = self.parse_elements(elements)
            
            return parsed_elements, base_metadata
        except Exception as e:
            raise Exception(f"Lỗi khi ingest file: {str(e)}")
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    async def ingest_db_record(self, content: str, source_metadata: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Xử lý dữ liệu từ Database. Trả về parsed_elements và metadata"""
        try:
            # Unstructured Parser
            if "<" in content and ">" in content:
                elements = partition_html(text=content)
            else:
                elements = partition_text(text=content)
                
            # Parse
            parsed_elements = self.parse_elements(elements)
            
            return parsed_elements, source_metadata
        except Exception as e:
            raise Exception(f"Lỗi khi ingest DB record: {str(e)}")

# Singleton instance
ingestion_service = IngestionService()
