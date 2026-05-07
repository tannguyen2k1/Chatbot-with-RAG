import os
import shutil
import uuid
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from typing import List, Dict, Any, Tuple
from fastapi import UploadFile

# 1. Unstructured dùng làm Parser
from unstructured.partition.auto import partition
from unstructured.partition.html import partition_html
from unstructured.partition.text import partition_text

_parsing_executor = ThreadPoolExecutor(max_workers=4)


class IngestionService:
    def __init__(self):
        self.temp_dir = "./temp_ingestion"
        os.makedirs(self.temp_dir, exist_ok=True)

    def parse_elements(self, elements) -> List[Dict[str, Any]]:
        parsed_elements = []
        for el in elements:
            el_type = el.category
            parsed_elements.append({
                "type": el_type,
                "text": str(el)
            })
        return parsed_elements

    def _partition_file(self, temp_file_path: str, languages: list[str]) -> Any:
        return partition(filename=temp_file_path, strategy="fast", languages=languages)

    def ingest_file_bytes(self, file_bytes: bytes, filename: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Xử lý file từ bytes (dùng cho background task)."""
        file_ext = os.path.splitext(filename)[1].lower()
        temp_file_path = os.path.join(self.temp_dir, f"{uuid.uuid4()}{file_ext}")

        try:
            with open(temp_file_path, "wb") as buffer:
                buffer.write(file_bytes)

            elements = self._partition_file(temp_file_path, ["vie", "eng"])

            base_metadata = {
                "filename": filename,
                "extension": file_ext
            }

            parsed_elements = self.parse_elements(elements)
            return parsed_elements, base_metadata
        except Exception as e:
            raise Exception(f"Lỗi khi ingest file: {str(e)}")
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    def ingest_file(self, file: UploadFile) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        file_ext = os.path.splitext(file.filename)[1].lower()
        temp_file_path = os.path.join(self.temp_dir, f"{uuid.uuid4()}{file_ext}")

        try:
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            elements = self._partition_file(temp_file_path, ["vie", "eng"])

            base_metadata = {
                "filename": file.filename,
                "file_type": file.content_type,
                "extension": file_ext
            }

            parsed_elements = self.parse_elements(elements)
            return parsed_elements, base_metadata
        except Exception as e:
            raise Exception(f"Lỗi khi ingest file: {str(e)}")
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    def ingest_db_record(self, content: str, source_metadata: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        try:
            if "<" in content and ">" in content:
                elements = partition_html(text=content)
            else:
                elements = partition_text(text=content)

            parsed_elements = self.parse_elements(elements)
            return parsed_elements, source_metadata
        except Exception as e:
            raise Exception(f"Lỗi khi ingest DB record: {str(e)}")


ingestion_service = IngestionService()
