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
   - `http://localhost:3000`

## Lệnh kiểm tra

- Chạy kiểm thử tự động (Vitest): `npm test`
- Kiểm tra kiểu TypeScript: `npm run typecheck`
- Build kiểm tra bản chạy chính thức: `npm run build`

## Mặc định tạm đang dùng (theo Phần 15 của PRD)

- **Thể thức:** Đơn và đôi đều 5 set (thắng 3 set). Mã chấp `x-y-z` áp dụng lẻ dùng số đầu, chẵn dùng số giữa.
- **Lịch:** 4 kỳ 2 tuần (8 tuần), tổng 132 trận (96 đơn + 36 đôi), không lượt về.
- **Quyền riêng tư (Q9):** Trang web đặt `noindex, nofollow` để chỉ chia sẻ nội bộ qua link.
- **Triển khai:** Hiện đang chạy trên máy local (Milestone M0). Kết nối Supabase và đưa lên Vercel sẽ thực hiện ở các bước tiếp theo.
