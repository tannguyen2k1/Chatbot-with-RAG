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
            if el["type"] == "Title":
                # Đóng gói section cũ trước khi chuyển sang heading mới
                if current_content:
                    sections.append({
                        "heading": current_heading,
                        "content": "\n".join(current_content)
                    })
                    current_content = []
                current_heading = el["text"]
            else:
                if el["text"].strip():
                    current_content.append(el["text"])
                    
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
