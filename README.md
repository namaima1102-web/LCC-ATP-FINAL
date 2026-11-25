# Legend Chicks Cup 2026 (Giải bóng bàn Gà Con · Mùa 5)

Website quản lý và hiển thị giải bóng bàn nội bộ CLB (16 tuyển thủ, 4 đội, 132 trận, 4 kỳ 2 tuần).

## Cách chạy trên máy (Local)

1. Cài đặt thư viện (chỉ cần chạy lần đầu):
   ```bash
   npm install
   ```
2. Khởi động trang web ở chế độ phát triển:
   ```bash
   npm run dev
   ```
3. Mở trình duyệt và truy cập:
   - Trang công khai: `http://localhost:3000`
   - Trang đăng nhập Admin: `http://localhost:3000/admin/login`

## Kết nối Supabase & Nạp dữ liệu Mùa 5 (Milestone M1)

1. Tạo một dự án Supabase mới (hoặc dùng Supabase local).
2. Chép `.env.example` thành `.env.local` và điền đủ 3 khóa của dự án Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(chỉ dùng phía máy chủ, không commit lên Git)*
3. Vào **Supabase SQL Editor**, chạy lần lượt 2 file:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_views_and_rls.sql`
4. Chạy lệnh nạp dữ liệu Mùa 5 (đủ 4 đội, 16 tuyển thủ, 13 dòng bảng chấp, 4 kỳ):
   ```bash
   npm run seed
   ```
5. Tạo tài khoản Admin đầu tiên:
   - Vào **Supabase Authentication → Users → Add user** để tạo email/mật khẩu cho anh Nam.
   - Lấy `User UID` vừa tạo, chạy SQL sau trong SQL Editor:
     ```sql
     insert into admins (user_id, display_name)
     values ('<USER_UID>', 'Anh Nam');
     ```

## Lệnh kiểm tra

- Chạy kiểm thử tự động (Vitest): `npm test`
- Kiểm tra kiểu TypeScript: `npm run typecheck`
- Build kiểm tra bản chạy chính thức: `npm run build`

## Mặc định tạm đang dùng (theo Phần 15 của PRD)

- **Thể thức:** Đơn và đôi đều 5 set (thắng 3 set). Mã chấp `x-y-z` áp dụng lẻ dùng số đầu, chẵn dùng số giữa.
- **Lịch:** 4 kỳ 2 tuần (8 tuần), tổng 132 trận (96 đơn + 36 đôi), không lượt về.
- **Quyền riêng tư (Q9):** Trang web đặt `noindex, nofollow` để chỉ chia sẻ nội bộ qua link.
- **Bảo mật (AC8):** Khách không đọc/ghi trực tiếp bảng `score_submissions`; mọi API `/api/admin/*` yêu cầu đăng nhập và có bản ghi trong bảng `admins`.
