# Ghi chú cập nhật báo cáo ĐATN — Chatbot hỗ trợ sinh viên UTC

Nguồn đề cương: `decuong_DATN_NguyenVanTan_191200907.docx`.

## Ngữ cảnh sản phẩm

Chatbot hỗ trợ sinh viên Trường Đại học Giao thông Vận tải (UTC), trả lời
thông tin công khai về quy chế đào tạo, công tác sinh viên, học phí/học bổng
chung, thủ tục hành chính và tuyển sinh. Không kết nối hệ thống đào tạo cá
nhân (điểm / lịch thi / công nợ).

## Use-case chính

1. **Sinh viên (`student`)**: chat FAQ-first → RAG có filter domain/metadata → citation.
2. **Cán bộ (`staff`)**: hàng chờ ticket từ feedback tiêu cực; trả lời → đẩy FAQ.
3. **Quản trị (`admin`/`root`)**: kho tri thức (upload + metadata), FAQ, stats, RBAC, config, audit.

## Luồng kỹ thuật (tóm tắt)

- Domain router rule-based (`dao_tao`, `cong_tac_sv`, `tai_chinh`, `thu_tuc`, `tuyen_sinh`, `chung`, `out_of_scope`).
- FAQ match trước; miss thì hybrid search + filter Qdrant payload + rerank.
- Citation chips trên UI (`X-Citations`); feedback hữu ích/không hữu ích.
- Seed roles/permissions không phụ thuộc corpus thật.

## Screenshot gợi ý (chèn vào báo cáo)

- Login branding UTC
- Chat empty state với gợi ý theo 5 chủ đề
- Câu trả lời kèm citation chips + nút feedback
- `/admin/knowledge` upload metadata
- `/admin/tickets` trả lời + tạo FAQ
- `/admin/stats` overview

## Tài khoản seed mặc định

| User | Password | Role |
|------|----------|------|
| admin | admin123456 | admin |
| staff | staff123456 | staff |
| student | student123456 | student |

## Kiểm thử

```bash
cd backend
python -m scripts.eval_utc_domains
```

Tinh chỉnh prompt/RAG tại `/admin/chat-config`.
