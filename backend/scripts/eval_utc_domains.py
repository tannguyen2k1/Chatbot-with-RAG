"""
UTC chatbot eval harness — domain router + OOS checks (no live LLM required).

Usage:
  cd backend
  python -m scripts.eval_utc_domains

Attach real FAQ/KB questions later by editing EVAL_CASES.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.domain_router import classify_domain

# Expected domain per sample question (fill with real corpus later)
EVAL_CASES: list[tuple[str, str]] = [
    ("Điều kiện xét tốt nghiệp là gì?", "dao_tao"),
    ("Quy định đăng ký học phần như thế nào?", "dao_tao"),
    ("Làm thế nào để xin giấy xác nhận sinh viên?", "cong_tac_sv"),
    ("Quy định về kỷ luật sinh viên?", "cong_tac_sv"),
    ("Học phí được đóng như thế nào?", "tai_chinh"),
    ("Điều kiện xét học bổng khuyến khích học tập?", "tai_chinh"),
    ("Thủ tục xin thôi học ra sao?", "thu_tuc"),
    ("Cách làm thẻ sinh viên mới?", "cong_tac_sv"),  # keyword "thẻ sinh viên"
    ("Điều kiện xét tuyển vào trường?", "tuyen_sinh"),
    ("Hồ sơ nhập học gồm những gì?", "tuyen_sinh"),
    ("Điểm của tôi kỳ này bao nhiêu?", "out_of_scope"),
    ("Lịch thi của tôi tuần sau?", "out_of_scope"),
    ("Công nợ của tôi còn bao nhiêu?", "out_of_scope"),
    ("Bitcoin hôm nay tăng không?", "out_of_scope"),
    ("Trường UTC ở đâu?", "chung"),
]


def run() -> int:
    passed = 0
    failed: list[tuple[str, str, str]] = []
    for query, expected in EVAL_CASES:
        got = classify_domain(query)
        ok = got == expected
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] expected={expected:14} got={got:14} | {query}")
        if ok:
            passed += 1
        else:
            failed.append((query, expected, got))

    total = len(EVAL_CASES)
    print("-" * 60)
    print(f"Result: {passed}/{total} passed")
    if failed:
        print("Failed cases:")
        for q, exp, got in failed:
            print(f"  - {q!r}: expected {exp}, got {got}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
