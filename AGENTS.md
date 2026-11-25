# Quy tắc làm việc cho Agent – Legend Chicks Cup 2026

Dự án: website quản lý giải bóng bàn nội bộ (16 người, 4 đội, 132 trận, 4 kỳ 2 tuần).
Chủ dự án: anh Nam, không phải lập trình viên. Báo cáo bằng **tiếng Việt**, ngắn gọn, nói rõ "đã làm gì, tôi cần kiểm tra gì".

## Đọc trước khi làm
1. `PRD.md` là nguồn sự thật duy nhất (luật giải, lịch, quy trình duyệt tỉ số, dữ liệu, tiêu chí nghiệm thu).
2. `seed/season5.json` (đội, điểm, bảng chấp) và `assets/logo-legend-chicks-cup.png`.

## Cách làm việc
- Làm theo thứ tự Milestone ở Phần 14 của PRD. **Mỗi lần chỉ một Milestone.** Xong thì chạy kiểm thử, báo cáo, rồi dừng chờ anh Nam duyệt.
- Trước khi viết code cho mỗi Milestone, lập kế hoạch ngắn (các file sẽ tạo/sửa) để anh Nam xem.
- Luật giải KHÔNG viết cứng. Mọi ngưỡng, bảng chấp, tham số lịch đọc từ cấu hình mùa.
- Logic nghiệp vụ là hàm thuần trong `src/lib/domain/`, có test Vitest, gồm các ca ở mục 13.1 và 13.2 của PRD.
- Nếu PRD thiếu thông tin hoặc mâu thuẫn: nêu câu hỏi và đề xuất, **không tự quyết** những điểm ảnh hưởng đến luật giải. Không tự sửa `PRD.md`.
- Cuối mỗi Milestone: cập nhật `README.md` (cách chạy, các mặc định đã dùng), commit Git với thông điệp rõ ràng.

## Chốt từ anh Nam (không đổi nếu chưa được đồng ý)
- Mọi trận đơn và đôi đều 5 set, thắng 3 set.
- Mã chấp x-y-z: set lẻ dùng số đầu, set chẵn dùng số giữa. Bên điểm cao nhường điểm.
- Đơn: mỗi người đánh với mọi người của các đội khác (96 trận). Đôi: mỗi cặp đồng đội đánh đúng 1 trận với mỗi đội khác (36 trận). Một lượt, không lượt về.
- Mùa giải 8 tuần = 4 kỳ 2 tuần. BTC đăng lịch từng kỳ. Hết kỳ, trận chưa đấu bị xử thua, **BTC chọn kết quả xử cho từng trận**.
- Cảnh báo trận tồn trước 3 ngày hết kỳ (dải thông báo trên web và bảng Admin). Không dùng Telegram, không dùng email.
- Khách không đăng nhập được gửi tỉ số. Chỉ kết quả Admin đã duyệt mới vào dữ liệu chính thức.

## An toàn
- Không bao giờ ghi khóa bí mật (Supabase `service_role`, token) vào mã nguồn hoặc commit. Chỉ dùng `.env.local`, và đảm bảo `.env.local` nằm trong `.gitignore`.
- Khóa `service_role` chỉ dùng phía máy chủ.
- Khách không được đọc hoặc ghi trực tiếp bảng `score_submissions`. Bật RLS cho mọi bảng.
- Không chạy lệnh xóa dữ liệu hoặc `drop` trên cơ sở dữ liệu thật khi chưa hỏi anh Nam.

## Giao diện
- Tiếng Việt, mobile first (375px), hỗ trợ sáng và tối, theo thương hiệu ở Phụ lục 16.1 của PRD.
- Múi giờ `Asia/Ho_Chi_Minh`, định dạng ngày `dd/MM/yyyy`.
