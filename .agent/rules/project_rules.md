---
description: Các quy tắc lập trình chung cho dự án
---
# Coding Standards

1.  **Language**: Sử dụng tiếng Việt cho các comment và giải thích.
2.  **Tech Stack**:
    *   Frontend: React (TSX), TailwindCSS.
    *   Backend: Firebase Functions (TypeScript).
3.  **UI/UX**:
    *   Ưu tiên giao diện hiện đại (Mordern Clean UI).
    *   Không dùng thư viện UI nặng (như AntD, MUI) trừ khi cần thiết, ưu tiên TailwindCSS.
4.  **Performance**:
    *   Sử dụng `useMemo`, `useCallback` hợp lý.
    *   Lazy load các component lớn.
