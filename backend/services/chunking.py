import re
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter

class ChunkingService:
    """
    Service chuyên trách cho việc chia nhỏ (Chunking) văn bản.
    Nhận dữ liệu thô đã được Parse từ IngestionService.
    """
    def __init__(self):
        # Khởi tạo LangChain Chunker
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", " ", ""]
        )

    def is_garbage_text(self, text: str) -> bool:
        """Bộ lọc nhiễu tổng hợp (Heuristic Filtering)"""
        # 1. Rule-based: Quá ngắn hoặc chỉ chứa số (thường là số trang)
        if len(text) < 3:
            return True
        if text.isdigit():
            return True
            
        # 3. Ratio Filtering: Chống lỗi giãn chữ "n o i t a v r e s n o C"
        # Nếu dòng dài hơn 10 ký tự mà khoảng trắng chiếm > 40% thì coi là rác
        if len(text) > 10:
            space_count = text.count(' ')
            if space_count / len(text) > 0.4:
                return True
                
        return False

    def clean_text(self, text: str) -> str:
        """Lọc nhiễu bằng Regex"""
        
        # Xóa các ký tự đặc biệt lặp lại nhiều lần
        text = re.sub(r'[-_=\.*~]{4,}', '', text)
        return text.strip()

    def group_and_chunk(self, parsed_elements: List[Dict[str, Any]], base_metadata: dict) -> List[Dict[str, Any]]:
        """
        - Bước 1: Gom nhóm nội dung theo Title (Heading).
        - Bước 2: Dùng LangChain (RecursiveCharacterTextSplitter) để Chunk nội dung dài.
        """
        # === GOM NHÓM THEO HEADING ===
        sections = []
        current_heading = "Document Info"
        current_content = []
        
        for el in parsed_elements:
            raw_text = el["text"].strip()
            if not raw_text:
                continue
                
            # Tiền xử lý văn bản
            text = self.clean_text(raw_text)
            
            # Loại bỏ các dòng rác
            if not text or self.is_garbage_text(text):
                continue
                
            is_title = el["type"] == "Title"
            
            # Lọc nhiễu Heading: Không cho phép Heading quá ngắn (ví dụ "A.") hoặc quá dài (nhầm với đoạn văn)
            if is_title and (len(text) < 4 or len(text) > 150):
                is_title = False
                
            if is_title:
                # Đóng gói section cũ trước khi chuyển sang heading mới
                if current_content:
                    sections.append({
                        "heading": current_heading,
                        "content": "\n".join(current_content)
                    })
                    current_content = []
                current_heading = text
            else:
                current_content.append(text)
                    
        # Đóng gói section cuối cùng
        if current_content:
            sections.append({
                "heading": current_heading,
                "content": "\n".join(current_content)
            })

        # === DÙNG LANGCHAIN NHƯ MỘT CHUNKER ===
        final_chunks = []
        for sec in sections:
            # LangChain chia nhỏ nội dung của từng section
            splits = self.text_splitter.split_text(sec["content"])
            
            for chunk_text in splits:
                final_chunks.append({
                    "text": chunk_text,
                    "metadata": {
                        **base_metadata,
                        "heading": sec["heading"]
                    }
                })
                
        return final_chunks

# Singleton instance
chunking_service = ChunkingService()
