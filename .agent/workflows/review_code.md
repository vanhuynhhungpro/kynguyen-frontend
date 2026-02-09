---
description: Quy trình review code tự động
---

# Code Review Workflow

1.  **Phân tích thay đổi**:
    *   Đọc các file đã thay đổi gần đây.
    *   Kiểm tra logic nghiệp vụ.

2.  **Kiểm tra lỗi tiềm ẩn (Linting)**:
    *   Chạy lệnh `npm run lint` (nếu có).
    *   Soát lỗi cú pháp, type safety.
    *   // turbo
    *   echo "Checking for obvious errors..."

3.  **Đánh giá bảo mật**:
    *   Kiểm tra các rule Firestore (nếu có thay đổi).
    *   Đảm bảo không hardcode API Key.

4.  **Báo cáo**:
    *   Tổng hợp các vấn đề tìm thấy.
    *   Đề xuất cách sửa.
