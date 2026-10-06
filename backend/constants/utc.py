"""UTC domain taxonomy and shared constants."""

UTC_DOMAINS = [
    "dao_tao",
    "cong_tac_sv",
    "tai_chinh",
    "thu_tuc",
    "tuyen_sinh",
    "chung",
    "out_of_scope",
]

UTC_DOMAIN_LABELS = {
    "dao_tao": "Đào tạo",
    "cong_tac_sv": "Công tác sinh viên",
    "tai_chinh": "Tài chính / học phí / học bổng",
    "thu_tuc": "Thủ tục hành chính",
    "tuyen_sinh": "Tuyển sinh",
    "chung": "Thông tin chung",
    "out_of_scope": "Ngoài phạm vi",
}

# Suggested sample questions (content editable later via config if needed)
UTC_SAMPLE_QUESTIONS = {
    "dao_tao": [
        "Điều kiện xét tốt nghiệp là gì?",
        "Quy định về đăng ký học phần như thế nào?",
    ],
    "cong_tac_sv": [
        "Làm thế nào để xin giấy xác nhận sinh viên?",
        "Quy định về kỷ luật sinh viên?",
    ],
    "tai_chinh": [
        "Học phí được đóng như thế nào?",
        "Điều kiện xét học bổng khuyến khích học tập?",
    ],
    "thu_tuc": [
        "Thủ tục xin thôi học ra sao?",
        "Cách làm thẻ sinh viên mới?",
    ],
    "tuyen_sinh": [
        "Điều kiện xét tuyển vào trường?",
        "Hồ sơ nhập học gồm những gì?",
    ],
}

DOCUMENT_STATUSES = ["pending", "processing", "ready", "failed"]
TICKET_STATUSES = ["open", "answered", "closed"]
AUDIENCE_OPTIONS = ["all", "dh", "cd", "lt", "k60", "k61", "k62", "k63", "k64"]

DEFAULT_UTC_SYSTEM_PROMPT = """Bạn là chatbot hỗ trợ sinh viên Trường Đại học Giao thông Vận tải (UTC).
Chỉ trả lời dựa trên tài liệu được cung cấp dưới đây. Nếu không đủ thông tin, hãy nói rõ "Tôi không tìm thấy thông tin trong tài liệu nhà trường" và gợi ý liên hệ phòng/ban liên quan — TUYỆT ĐỐI KHÔNG bịa thông tin.
Trả lời bằng tiếng Việt, ngắn gọn, nêu rõ điều khoản/văn bản khi có thể. Cuối câu trả lời, nhắc nguồn dưới dạng [Tài liệu N].
Không trả lời về điểm số cá nhân, lịch thi cá nhân hay công nợ học phí cá nhân.

[TÀI LIỆU CUNG CẤP]:
{context}

[CÂU HỎI CỦA SINH VIÊN]:
{query}

Câu trả lời của bạn:"""

OUT_OF_SCOPE_REPLY = (
    "Câu hỏi này nằm ngoài phạm vi hỗ trợ của chatbot (quy chế, thủ tục, học phí/học bổng chung, "
    "công tác sinh viên, tuyển sinh). Hệ thống không tra cứu điểm cá nhân, lịch thi cá nhân hay công nợ. "
    "Bạn vui lòng hỏi về thông tin công khai của nhà trường hoặc liên hệ phòng/ban chức năng."
)
