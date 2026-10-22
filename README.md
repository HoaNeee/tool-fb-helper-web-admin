# FB Helper Web Admin

React + TypeScript + Vite, Tailwind CSS v4 và các component shadcn (Base UI).

## Chạy dự án

Dùng Node.js 20.19+ hoặc 22.12+ phù hợp với Vite 8.

- `npm run dev`: mở giao diện phát triển.
- `npm run build`: kiểm tra TypeScript và build production.
- `npm run lint`: kiểm tra ESLint.

## Các trang

- `/`: dashboard, thống kê trạng thái và lịch sử thao tác trong phiên.
- `/devices`: danh sách, tìm kiếm, lọc, thêm, sửa, chi tiết, bật/tắt thiết bị.
- `/ips`: danh sách, tìm kiếm, lọc, thêm, sửa, bật/tắt địa chỉ IPv4/IPv6.
- `/settings/system`: app_name, mail_support, status.
- `/settings/tool`: day_free_premium_for_new_user, break_per_batch_percent.
- `/settings/post`: tất cả field của SystemPostSetting.
- `/settings/comment`: tất cả field của SystemCommentWalkSetting.

Schema chuẩn: `src/types/types.ts`. SystemSetting.status dùng union `ACTIVE | INACTIVE | MAINTAINING`.

`src/data/admin-data.ts` chứa giá trị ban đầu để xem giao diện; không có mock API, service hay lệnh gửi tới thiết bị. Dữ liệu quản lý chỉ nằm trong React state và reset khi tải lại trang. Chỉ lựa chọn sáng/tối được lưu vào localStorage.

Các metadata input của cài đặt nằm trong `src/data/setting-fields.ts`. URL/pattern nhập mỗi dòng một giá trị và chuyển thành string[] khi lưu. ID chỉ đọc; phần trăm giới hạn 0–100, số ngày không âm, và form nhắc khi rời trang với thay đổi chưa lưu.

Khi nối backend, thay các callback onChange/onSave tại App bằng luồng tải/lưu thật. Host production cần fallback về index.html để hỗ trợ đường dẫn React Router.
