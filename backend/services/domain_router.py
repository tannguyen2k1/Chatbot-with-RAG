"""Rule-based UTC domain router (lightweight, no extra model)."""

from constants.utc import OUT_OF_SCOPE_REPLY, UTC_DOMAINS

DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "dao_tao": [
        "học phần",
        "tín chỉ",
        "tốt nghiệp",
        "điểm",
        "thi",
        "học kỳ",
        "đăng ký môn",
        "chương trình đào tạo",
        "học lại",
        "cải thiện điểm",
        "đồ án",
        "khóa luận",
        "đăng ký học phần",
    ],
    "cong_tac_sv": [
        "ký túc xá",
        "ktx",
        "đoàn",
        "hội sinh viên",
        "kỷ luật",
        "xác nhận sinh viên",
        "thẻ sinh viên",
        "công tác sinh viên",
        "ngoại khóa",
    ],
    "tai_chinh": [
        "học phí",
        "học bổng",
        "miễn giảm",
        "đóng tiền",
        "tài chính",
        "hỗ trợ chi phí",
    ],
    "thu_tuc": [
        "thủ tục",
        "đơn xin",
        "thôi học",
        "bảo lưu",
        "chuyển trường",
        "chuyển ngành",
        "xin giấy",
    ],
    "tuyen_sinh": [
        "tuyển sinh",
        "nhập học",
        "xét tuyển",
        "điểm chuẩn",
        "ngành học",
        "đăng ký xét tuyển",
        "hồ sơ nhập học",
    ],
    "out_of_scope": [
        "điểm của tôi",
        "điểm cá nhân",
        "lịch thi của tôi",
        "công nợ của tôi",
        "mã số sinh viên của tôi",
        "password",
        "mật khẩu email",
        "bitcoin",
        "chứng khoán",
    ],
}


def classify_domain(query: str) -> str:
    text = (query or "").lower()
    scores: dict[str, int] = {d: 0 for d in UTC_DOMAINS}
    for domain, kws in DOMAIN_KEYWORDS.items():
        for kw in kws:
            if kw in text:
                # Longer phrases weigh more (prefer specific matches)
                scores[domain] += max(1, len(kw.split()))
    if scores["out_of_scope"] > 0:
        return "out_of_scope"
    best = max(scores.items(), key=lambda x: x[1])
    if best[1] == 0:
        return "chung"
    return best[0]


def out_of_scope_message() -> str:
    return OUT_OF_SCOPE_REPLY
