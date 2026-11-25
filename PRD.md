# PRD – Legend Chicks Cup 2026 (Giải bóng bàn Gà Con · Mùa 5)

| Mục | Nội dung |
|---|---|
| Chủ dự án / Admin chính | Lại Hải Nam |
| Phiên bản tài liệu | 1.0 · 25/11/2026 |
| Dự án | Độc lập, không liên quan các dự án khác của anh Nam |
| Người thực thi | AI Agent trong Antigravity, anh Nam duyệt từng Milestone |
| Dữ liệu kèm theo | `seed/season5.json` (đội, điểm, bảng chấp), `assets/logo-legend-chicks-cup.png` |
| Trạng thái | Bản nháp. Các mục ở Phần 15 cần anh Nam xác nhận. Trong lúc chờ, Agent dùng "mặc định tạm" |

---

## 1. Tóm tắt và mục tiêu

Website quản lý và hiển thị giải bóng bàn nội bộ CLB (16 tuyển thủ, 4 đội), thay thế file Excel Mùa 4.

**Vấn đề của Mùa 4 (rút từ dữ liệu thực tế):**
- Kết quả nhập thủ công qua tin nhắn và ảnh. 14/105 trận phải "cân lại / sửa".
- Trận dồn vào cuối mùa: ngày 24/10 có 14 trận, 10/10 có 11 trận. 7 trận không đấu kịp.
- Người chơi xem số liệu khó trên điện thoại. File Excel gửi qua lại, dễ nhiều phiên bản.
- Cần bảng chấp tự tính theo điểm, thống kê tự cập nhật, lịch sinh đúng quy ước.

**Mục tiêu sản phẩm (đo được):**

| # | Mục tiêu | Chỉ số |
|---|---|---|
| G1 | Mọi thành viên xem lịch, mã chấp, kết quả, bảng xếp hạng trên điện thoại, không cần đăng nhập | Trang chính tải dưới 2 giây trên 4G |
| G2 | Ai cũng gửi được tỉ số không cần đăng nhập, chỉ số liệu đã được Admin duyệt mới vào dữ liệu chính thức | 100% số liệu hiển thị và phân tích lấy từ kết quả đã duyệt |
| G3 | Sinh lịch tự động đúng quy ước, Admin chỉnh tay được | 0 vi phạm quy tắc "cặp đôi chỉ gặp mỗi đội một lần" |
| G4 | Tùy biến cao: luật, bảng chấp, số trận, giao diện đổi được từ trang Admin, không sửa code | Xem Phần 9 |
| G5 | Truy vết đầy đủ mọi thay đổi | Mọi sửa đổi có nhật ký: ai, khi nào, trước và sau |

## 2. Phạm vi

**Trong phạm vi (P0 là bắt buộc trước khai mạc Mùa 5):**
- Quản lý mùa giải, đội, tuyển thủ, điểm trình.
- Bảng chấp tự động theo quy tắc Excel Mùa 4.
- Bộ sinh lịch thi đấu theo quy ước của giải.
- Gửi tỉ số công khai, kèm hàng đợi duyệt của Admin.
- Bảng xếp hạng đội, cá nhân, cặp đôi. Thống kê.
- Công cụ gợi ý điều chỉnh điểm cuối mùa.
- Trang cấu hình và giao diện theo thương hiệu Legend Chicks Cup.
- Xuất dữ liệu ra CSV/Excel.

**Ngoài phạm vi (không làm ở phiên bản 1):**
- Thanh toán, lệ phí, cá cược, tiền thưởng.
- Ứng dụng di động riêng (chỉ web, ưu tiên mobile).
- Đăng nhập cho thành viên thường.
- Chat, bình luận, thông báo đẩy. Có thể làm sau (P2).

## 3. Người dùng và quyền

| Vai trò | Đăng nhập | Quyền |
|---|---|---|
| Khách (mọi thành viên, ai có link) | Không | Xem mọi dữ liệu chính thức. Gửi tỉ số (cần chờ duyệt). Xem lịch cá nhân. Dùng máy tính mã chấp |
| Admin | Có (email) | Duyệt, từ chối, sửa tỉ số. Sinh và sửa lịch. Quản lý đội, tuyển thủ, điểm. Cấu hình luật, giao diện. Xem nhật ký. Xuất dữ liệu |

Chỉ có một cấp Admin ở phiên bản 1. Danh sách Admin lưu trong bảng `admins`, thêm bớt trực tiếp trong Supabase.

## 4. Dữ liệu Mùa 5 (nguồn: bảng điểm thống nhất và kết quả bốc thăm)

Dữ liệu đầy đủ ở `seed/season5.json`. Tổng 16 người, 134 điểm, trung bình 8,4 điểm/người.

| Đội | Thành viên (điểm bắt đầu Mùa 5) | Tổng |
|---|---|---|
| Đội 1 | Nam Gai 12, Hùng 8, Thanh 7, Thảo 7 | 34 |
| Đội 2 | Kiên 10, Dương 9, Sinh 8, Dũng 6 | 33 |
| Đội 3 | Nhất 9, Đức 9, Hiếu 9, Khanh 7 | 34 |
| Đội 4 | Tân 12, Nam 8, Vinh 7, Thông 6 | 33 |

- **Người cần đánh dấu `provisional` (điểm tạm):** Tân (12 điểm, người mới), Khanh (7 điểm, không đấu Mùa 4).
- **Tên gọi:** "Nam" và "Nam Gai" là hai người khác nhau. Dữ liệu có biệt danh (Nam Gấu, Gió = Thông, Dũng zin). Giao diện luôn hiển thị đủ để tránh nhầm.
- **Phương** không tham gia Mùa 5.
- Tên bốn đội chưa chốt. Mặc định "Đội 1" đến "Đội 4", Admin đổi tên được.

## 5. Luật giải (đã có trong file Excel Mùa 4, chuyển thành cấu hình)

### 5.1 Thể thức trận

| Loại | Thắng khi | Tỉ số hợp lệ |
|---|---|---|
| Đơn | Thắng 3 set (tối đa 5 set) | 3-0, 3-1, 3-2 |
| Đôi | Thắng 3 set (tối đa 5 set), giống trận đơn | 3-0, 3-1, 3-2 |

(Mùa 4 đôi chỉ đấu 3 set thắng 2. Mùa 5 anh Nam đã chốt đôi cũng đấu 5 set. Giá trị này vẫn cấu hình được theo từng loại trận.)

- Mỗi trận thắng cho đội 1 điểm đội, kể cả trận đôi.
- Số set cần thắng cấu hình được theo từng loại trận.

### 5.2 Tính mã chấp

| Loại | Công thức chênh |
|---|---|
| Đơn | `chênh = abs(điểm A − điểm B)` |
| Đôi | `chênh = abs((tổng điểm cặp A − tổng điểm cặp B) / 2)` |

Người (hoặc cặp) điểm cao hơn là bên **chấp** (nhường điểm). Bên còn lại là bên **được chấp**. Chênh bằng 0 thì ngang nhau.

Bảng tra (đơn và đôi dùng chung giá trị):

| Chênh | Mã chấp | Chênh | Mã chấp |
|---|---|---|---|
| 0 | 0-0-0 | 3.5 | 3-4-3 |
| 0.5 | 0-1-0 | 4 | 4-4-4 |
| 1 | 0-2-0 | 4.5 | 4-5-4 |
| 1.5 | 2-0-2 | 5 | 5-5-5 |
| 2 | 2-2-2 | 5.5 | 5-6-5 |
| 2.5 | 2-3-2 | 6 | 6-6-6 |
| 3 | 3-3-3 | | |

- Bảng nằm trong bảng `handicap_rules` của từng mùa, Admin sửa được.

**Cách áp dụng mã chấp trong trận (anh Nam đã xác nhận):** mã `x-y-z` đọc theo từng set, số bắt đầu và kết thúc giống nhau, các set lẻ dùng số đầu, các set chẵn dùng số giữa. Bên điểm cao **nhường** cho bên điểm thấp số điểm tương ứng ở mỗi set.

| Mã | Set 1 | Set 2 | Set 3 | Set 4 | Set 5 |
|---|---|---|---|---|---|
| 0-2-0 | 0 | 2 | 0 | 2 | 0 |
| 2-3-2 | 2 | 3 | 2 | 3 | 2 |
| 4-4-4 | 4 | 4 | 4 | 4 | 4 |

- Mọi trận, đơn hay đôi, đều có tối đa 5 set, thắng 3 set. Dùng đủ 5 cột ở bảng trên cho cả hai loại trận.
- Với trận đôi, chênh lấy theo `abs((tổng cặp A − tổng cặp B) / 2)`, rồi tra bảng và đọc mã theo set như trận đơn.
- Giao diện hiển thị bảng chấp theo từng set, ghi rõ bên nào nhường, để người chơi không phải tự đọc mã.
- Hệ thống chỉ ghi nhận tỉ số theo set. Điểm chấp là quy ước khi chơi, không ảnh hưởng cách tính tỉ số.
- Công thức suy ra (hàm `handicapPerSet(code, setIndex)`): set lẻ lấy số đầu, set chẵn lấy số giữa. Cấu hình `handicap_pattern = "alternate"` cho phép đổi cách đọc sau này.
- Mức chênh lớn hơn giá trị lớn nhất trong bảng: lấy dòng lớn nhất (mặc định tạm). Mùa 5 chênh tối đa là 6 nên chưa xảy ra.
- Mã chấp được **chụp lại và lưu vào từng trận** khi sinh lịch. Nếu điểm trình đổi giữa mùa, chỉ các trận chưa đấu được tính lại. Trận đã đấu giữ nguyên mã.

### 5.3 Điểm đội và xếp hạng đội

- Điểm đội = tổng số trận thắng (đơn + đôi).
- Hòa điểm xét theo thứ tự cấu hình được. Mặc định tạm: (1) kết quả đối đầu, (2) hiệu số set, (3) tổng số trận đơn thắng.
- Chỉ dùng kết quả đã duyệt.

### 5.4 Điều chỉnh điểm trình cuối mùa

Căn cứ bảng "Hạng cuối mùa" của Mùa 4. Mặc định tạm, mọi ngưỡng cấu hình được:

| Tỷ lệ thắng cả mùa (làm tròn số nguyên) | Điều chỉnh |
|---|---|
| Từ 29% trở xuống | Giảm 1 điểm |
| 30% đến 78% | Giữ nguyên |
| Từ 79% trở lên | Tăng 1 điểm |

- Tối đa ±1 điểm mỗi mùa.
- Cơ sở tính: tỷ lệ thắng **tổng** (đơn + đôi), cấu hình được sang "chỉ đơn".
- Số trận tối thiểu để xét: mặc định 8 trận. Luật cũ ghi "8 trận đơn". Mùa 5 mỗi người có 12 trận đơn nên điều kiện này luôn đạt, giữ nguyên cho dùng cả hai cách tính.
- Công cụ chỉ **gợi ý**. Admin có quyền ghi đè từng người, bắt buộc nhập lý do (ví dụ Mùa 4: Hiếu và Kiên được tăng thêm 1 điểm theo quyết định ban tổ chức). Lưu ở `rating_decisions`.
- Người đánh dấu `provisional` có điểm kiểm tra giữa mùa (mặc định sau kỳ 1). Admin quyết định, giới hạn ±1.

## 6. Bộ sinh lịch thi đấu (quy ước đã chốt với anh Nam)

### 6.1 Quy ước gốc

1. **Đơn:** mỗi người đánh đơn với **tất cả người của các đội khác**, trừ đồng đội. Một lần duy nhất, không có lượt về.
2. **Đôi:** mỗi người ghép cặp với **từng đồng đội** (mỗi người có 3 cặp trong đội mình). Mỗi cặp đánh đúng **1 trận** với **mỗi đội khác**.
3. Một cặp đôi không đánh hai lần với cùng một đội. Không có lượt về.
4. Chỉ có một lượt vòng tròn giữa các đội.

> Diễn giải cần anh xác nhận (Q2): câu "đánh với mỗi bảng 1 Set" được hiểu là **1 trận đôi** với mỗi bảng, không phải 1 set.

### 6.2 Cách tính số trận (4 đội, mỗi đội 4 người)

| Hạng mục | Cách tính | Kết quả |
|---|---|---|
| Đơn mỗi người | 12 người của 3 đội khác | **12 trận** |
| Tổng trận đơn | 16 người × 12 ÷ 2 | **96 trận** |
| Cặp đôi mỗi đội | Chọn 2 trong 4 người: C(4,2) | 6 cặp |
| Đôi mỗi người | 3 cặp × 3 đội đối thủ | **9 trận** |
| Đôi mỗi cặp | 1 trận với mỗi đội khác | 3 trận |
| Tổng trận đôi | 4 đội × 6 cặp × 3 đội đối thủ ÷ 2 (mỗi trận có 2 cặp) | **36 trận** |
| **Tổng cả giải** | 96 + 36 | **132 trận** |
| Mỗi người | 12 đơn + 9 đôi | **21 trận** |
| Mỗi đội | 48 đơn + 18 đôi | 66 trận |

Phép tính đôi của anh (9 trận mỗi người) khớp với kết quả này. Số trận đôi của cả giải là 36. Khối lượng này nhiều hơn Mùa 4 (105 trận, mỗi người 18 trận). Xem rủi ro ở 6.6.

### 6.3 Cấu trúc fixture và chia kỳ

- Mỗi cặp đội gặp nhau một lần, gọi là một **fixture**. Với 4 đội có 6 fixture. Khi chọn **3 kỳ**, mỗi kỳ gồm 2 fixture theo phương pháp xoay vòng như bảng dưới. Khi chọn **4 kỳ**, 132 trận được chia cân bằng vào 4 kỳ (mục 6.6) mà không nhất thiết giữ nguyên fixture.

| Kỳ (khi chọn 3 kỳ) | Fixture 1 | Fixture 2 |
|---|---|---|
| 1 | Đội 1 – Đội 2 | Đội 3 – Đội 4 |
| 2 | Đội 1 – Đội 3 | Đội 2 – Đội 4 |
| 3 | Đội 1 – Đội 4 | Đội 2 – Đội 3 |

- Mỗi fixture có **22 trận**: 16 đơn (mỗi người đội A gặp từng người đội B) và 6 đôi (6 cặp của A gặp 6 cặp của B, mỗi cặp đúng một trận).
- Mỗi người trong một fixture: 4 đơn + 3 đôi = 7 trận. Mỗi kỳ (khi chọn 3 kỳ) có 44 trận.
- Quy ước chỉ áp dụng cho đội 4 người. Với số đội hoặc số người khác, bộ sinh lịch tổng quát hóa theo cùng công thức, trường hợp số đội lẻ thì có đội nghỉ mỗi kỳ.

### 6.4 Ghép cặp đôi trong một fixture

Mỗi đội có 6 cặp: 12, 13, 14, 23, 24, 34. Mỗi cặp bên A phải gặp đúng một cặp bên B và ngược lại, nên cần một **phép ghép 1-1 giữa 6 cặp A và 6 cặp B** (có 720 phương án).

Bộ sinh lịch chọn phương án tối ưu theo thứ tự ưu tiên:
1. Không có trận đôi nào có hai người của cùng một đội đối đầu chính đồng đội mình (luôn đúng theo cấu trúc).
2. Mỗi người bên A gặp mỗi người bên B trong đôi **1 hoặc 2 lần** (không lệch quá 1), vì mỗi người có 6 lượt đối thủ trải trên 4 người của đội kia.
3. Chênh lệch mã chấp giữa các trận cân đối (tùy chọn `balance_handicap`, mặc định tắt).

Admin có thể đổi phép ghép bằng tay, vẫn bị kiểm tra các ràng buộc ở 6.5.

### 6.5 Ràng buộc kiểm tra tự động

| Mã | Ràng buộc | Mức |
|---|---|---|
| R1 | Không có trận giữa hai người cùng đội | Cứng |
| R2 | Mỗi cặp đôi đánh đúng 1 trận với mỗi đội khác, không lặp, không có lượt về | Cứng |
| R3 | Mỗi người đủ 12 đơn (một trận với từng người đội khác) và đủ 9 đôi | Cứng |
| R4 | Mỗi trận đủ 2 hoặc 4 người, không trùng người | Cứng |
| R5 | Cân bằng đối thủ trong đôi (mục 6.4, ý 2) | Cảnh báo |
| R8 | Mỗi người có số trận mỗi kỳ lệch không quá 1 so với mục tiêu (7 trận với 3 kỳ, 5–6 trận với 4 kỳ) | Cảnh báo |

Vi phạm "Cứng" chỉ cho phép khi Admin xác nhận ghi đè và nhập lý do. Mọi ghi đè vào nhật ký.

### 6.6 Cách thi đấu thực tế: kỳ 2 tuần, tự thu xếp

Quy chế do anh Nam chốt:
1. Mùa giải kéo dài **6–8 tuần**, chia thành các **kỳ 2 tuần**: 3 kỳ (6 tuần) hoặc 4 kỳ (8 tuần).
2. **BTC xếp lịch mỗi 2 tuần một lần**: đầu mỗi kỳ, Admin đăng danh sách trận của kỳ đó.
3. VĐV **tự thu xếp thời gian** trong kỳ để đánh hết trận được giao (đánh trong tuần hoặc cuối tuần, thường 18h–20h, ai rảnh đến CLB). Hệ thống không ép ngày giờ từng trận.
4. Hết kỳ, trận chưa đấu bị **xử thua**. Trận không chuyển sang kỳ sau.
5. Hệ thống **cảnh báo trận tồn trước 3 ngày hết kỳ** (mục 6.8).

Các số trận ở Phần 6 là cho **cả mùa giải** (một lượt vòng tròn duy nhất, 132 trận).

**Chọn 3 kỳ hay 4 kỳ?**

| Chỉ số | 3 kỳ (6 tuần) | 4 kỳ (8 tuần) | Mùa 4 thực tế |
|---|---|---|---|
| Trận mỗi kỳ | 44 | 33 | |
| Trận mỗi tuần | 22 | khoảng 16–17 | khoảng 16 (98 trận trong khoảng 6 tuần) |
| Trận mỗi người mỗi kỳ | 7 | 5–6 | |
| Chia trận vào kỳ | Theo cặp đội: mỗi kỳ 2 fixture (mục 6.3) | Chia cân bằng để mỗi người có 5–6 trận mỗi kỳ | |

- Tốc độ Mùa 4 tính theo ngày trong ghi chú kết quả, có thể là ngày cập nhật chứ không phải ngày đấu, nên chỉ mang tính tham khảo.
- Ước tính công suất: mỗi trận 15–20 phút, mỗi tối 2 giờ, 2 bàn thì khoảng 14 trận mỗi tối nếu đủ người. Con số này là giả định của tôi.
- **Đã chốt: dùng 4 kỳ (8 tuần).** Nhịp 16–17 trận mỗi tuần gần bằng thực tế Mùa 4. Phương án 3 kỳ đòi hỏi nhanh hơn Mùa 4 khoảng 35%, trong khi luật xử thua mới nghiêm hơn và Mùa 4 vẫn còn 7 trận không đấu kịp. Chỉ chọn 3 kỳ nếu anh em chắc chắn đến CLB từ 3 tối mỗi tuần.
- Cấu hình: `periods_count = 4`. Phương án 3 kỳ vẫn có trong bộ sinh lịch nhưng không dùng cho Mùa 5.

**Quy tắc đăng lịch:**
- Bộ sinh lịch tạo đủ 132 trận ngay từ đầu và gán vào các kỳ. Trận của kỳ chưa đăng bị ẩn với khách.
- Trước khi đăng, Admin được chuyển trận giữa các kỳ (vẫn kiểm tra R1–R4). Có cảnh báo nếu một người có quá nhiều trận ở một kỳ (**R8**: lệch quá 1 so với mục tiêu mỗi kỳ).
- Đăng kỳ là hành động có ghi nhật ký. Sau khi đăng, chỉ chuyển trận khi Admin nhập lý do.

### 6.7 Đóng kỳ và xử thua

| Quy tắc | Mặc định |
|---|---|
| Hết ngày cuối kỳ (23:59), trận chưa có kết quả | Vào hàng đợi **đề xuất xử thua** cho Admin |
| Cách xử | **BTC (Admin) tự cập nhật từng trận**. Hệ thống không tự xử thua. Có thao tác "áp dụng nhanh" cho nhiều trận đã chọn cùng một kết quả xử |
| Trận có bản gửi tỉ số đang chờ duyệt, ngày đấu nằm trong kỳ | **Không xử thua**, chờ Admin duyệt |
| Gửi tỉ số muộn | Chấp nhận trong `submission_grace_hours` = 48 giờ sau hết kỳ, nếu ngày đấu nằm trong kỳ |
| Xử thua ai | **Do BTC chọn cho từng trận** (anh Nam chốt): xử thua một bên (bên kia thắng 3-0, `winner_a` hoặc `winner_b`), hoặc cả hai bên thua, không bên nào được điểm đội (`both`). Hệ thống không có mặc định, trận chưa được chọn thì kỳ chưa đóng được |
| Thống kê cá nhân | Bên bị xử thua tính một trận thua (`forfeit_counts_in_stats` = bật) |
| Ngoại lệ | Admin gia hạn riêng một trận (ví dụ ốm, đi công tác), nhập lý do, ghi nhật ký. Trận đó được chuyển sang kỳ kế tiếp |
| Kỳ sau | Trận bị xử thua không chuyển sang kỳ sau. Kỳ kế tiếp chỉ có trận mới do BTC đăng |

Sau khi Admin xác nhận toàn bộ, kỳ chuyển sang trạng thái `closed` và dữ liệu kỳ đó được khóa.

> Đã chốt (Q13): BTC là người cập nhật kết quả xử thua cho từng trận.

### 6.8 Cảnh báo trận tồn (yêu cầu mới)

Mục đích: báo sớm cho BTC và VĐV khi còn trận chưa đấu, để kịp đánh trước khi bị xử thua.

| Mốc | Thời điểm (giờ Việt Nam) | Mặc định |
|---|---|---|
| Cảnh báo chính | **3 ngày trước khi hết kỳ**, 08:00 | Bật |
| Nhắc lại | 1 ngày trước khi hết kỳ | Bật |
| Ngày cuối | Sáng ngày cuối kỳ | Bật |

Các mốc cấu hình được trong `alert_days_before` (mặc định `[3, 1, 0]`).

**Mức độ chậm tiến độ** (tính theo tỷ lệ trận của kỳ đã có kết quả đã duyệt):

| Mức | Điều kiện (mặc định) | Màu |
|---|---|---|
| Bình thường | Đã hoàn thành từ 70% trở lên | Vàng |
| Chậm | Dưới 70% | Đỏ |

Ngưỡng 70% cấu hình được (`alert_completion_threshold`). Mọi trận chưa đấu của kỳ đều được liệt kê, kể cả khi toàn giải chưa chậm.

**Nội dung cảnh báo cho BTC (Admin):**
- Số trận tồn và tỷ lệ hoàn thành của kỳ.
- Danh sách trận tồn, nhóm theo người: ai nợ nhiều trận nhất, ai nợ trận đôi cần đủ 4 người.
- Nhóm theo đội và theo cặp đội.
- Số trận có bản gửi chờ duyệt (không tính là tồn, nhưng nhắc Admin duyệt gấp).
- Khi hết kỳ, danh sách "trận cần xử" xuất hiện để BTC chọn kết quả xử cho từng trận.

**Nội dung cảnh báo cho VĐV (không cần đăng nhập):**
- Dải thông báo đầu trang chủ: "Kỳ 2 còn 3 ngày, còn 18 trận chưa đấu. Trận không đấu kịp sẽ bị xử thua."
- Trang cá nhân: "Bạn còn N trận cần đấu trước dd/MM", kèm danh sách đối thủ.
- Trang W9: những trận còn nợ mà mọi người tham gia đang có mặt tối nay.

**Kênh gửi:**

| Kênh | Mức | Ghi chú |
|---|---|---|
| Dải thông báo trên web và bảng điều khiển Admin (A11) | P0 | Tính theo ngày hiện tại khi mở trang, không cần tác vụ nền |
| Telegram | Không dùng | Anh Nam đã chốt không cần (Q14). Có thể làm sau |

Email và Telegram không dùng ở phiên bản 1, để tránh thêm dịch vụ ngoài.

### 6.9 Theo dõi tiến độ và gợi ý trận tối nay (P1)

**Trận còn nợ (P0, trong hồ sơ cá nhân W4):** số đơn và đôi còn lại trong kỳ, đối thủ chưa gặp, cặp đôi chưa đánh, hạn chót.

**Mốc tiến độ tuần:** mục tiêu tích lũy theo tuần bằng số trận của kỳ chia đều cho 2 tuần. Admin thấy người nào dưới 50% mốc.

**Check-in tối nay (W9):**
- Khách bấm tên mình để báo "tối nay tôi có mặt". Không cần đăng nhập, dùng cơ chế giới hạn tốc độ như gửi tỉ số.
- Dữ liệu check-in chỉ dùng để gợi ý, tự hết hiệu lực sau 24 giờ, không ảnh hưởng kết quả.

**Gợi ý trận khả thi:** từ danh sách người có mặt, hệ thống liệt kê các trận còn nợ của kỳ hiện tại mà **mọi người tham gia đều đang có mặt** (đơn cần 2 người, đôi cần đủ 4 người). Ưu tiên:
1. Trận của người còn nhiều trận nợ nhất.
2. Trận đôi, vì khó gom đủ 4 người nhất.
3. Trận ở kỳ sắp hết hạn.
4. Không xếp một người vào hai trận cùng lúc (**R6**). Cảnh báo nếu một người liên tiếp quá 3 trận (**R7**).

Danh sách chỉ là gợi ý. Đánh xong thì vào trận đó gửi tỉ số (mục 7).

**Cấu hình:** `tables_default = 2`, `tables_max = 4`, `avg_match_minutes = 18`, `weekly_target_mode = even`.

## 7. Quy trình gửi và duyệt tỉ số

### 7.1 Luồng chính

```
Khách mở trận → "Nhập tỉ số" → chọn tên người gửi → nhập số set → gửi
        ↓
Bản ghi score_submissions, trạng thái = PENDING
        ↓
Admin xem hàng đợi → DUYỆT / TỪ CHỐI / SỬA RỒI DUYỆT
        ↓ (duyệt)
Ghi vào bảng results (chính thức) + nhật ký → bảng xếp hạng, thống kê, hiển thị cập nhật
```

### 7.2 Yêu cầu chi tiết

| # | Yêu cầu |
|---|---|
| S1 | Khách không cần đăng nhập. Chọn "người gửi" từ danh sách 16 tuyển thủ (khai báo, không xác thực) |
| S2 | Form chỉ nhận tỉ số hợp lệ theo thể thức (5.1). Sai thì báo lỗi tiếng Việt |
| S3 | Tuỳ chọn đính kèm ảnh bằng chứng (ảnh, tối đa 5MB, lưu Supabase Storage). Ghi chú tùy chọn |
| S4 | Một trận có thể có nhiều bản gửi. Nếu khác nhau về người thắng, hệ thống đánh dấu **Xung đột** cho Admin |
| S5 | Khi một bản được duyệt, các bản còn lại của trận đó chuyển `superseded` |
| S6 | Số liệu chờ duyệt **không** tính vào xếp hạng, thống kê, điều chỉnh điểm |
| S7 | Hiển thị công khai: trận có bản chờ duyệt hiện nhãn "Chờ duyệt". Mặc định không hiện tỉ số đề xuất (cấu hình `show_pending_score`, mặc định tắt) |
| S8 | Admin cũng nhập trực tiếp: tự động duyệt, vẫn ghi nhật ký |
| S9 | Admin sửa kết quả đã duyệt: tạo bản sửa, giữ lịch sử trước và sau |
| S10 | Hàng đợi Admin: lọc theo trạng thái, vòng, đội. Duyệt hàng loạt các bản không xung đột |
| S11 | Phòng chống lạm dụng: giới hạn tốc độ theo IP (mặc định 10 lượt/giờ), trường ẩn chống bot (honeypot), tuỳ chọn Cloudflare Turnstile. Không lưu IP thô, lưu băm |
| S12 | Từ chối phải ghi lý do. Lý do hiện cho người gửi nếu họ mở lại trận đó trên cùng thiết bị |
| S13 | Form có ô "ngày đấu" (mặc định hôm nay) và ô chọn bàn (tùy chọn). Trận không cần đặt lịch trước, ai đánh trận nào trước cũng được |

### 7.3 Trạng thái

| Bảng | Trạng thái |
|---|---|
| `matches.status` | `scheduled`, `played`, `forfeit`, `cancelled` |
| `score_submissions.status` | `pending`, `approved`, `rejected`, `superseded` |

## 8. Chức năng và màn hình

Ưu tiên: **P0** bắt buộc trước khai mạc, **P1** nên có, **P2** làm sau.

### 8.1 Trang công khai (mobile first)

| Mã | Màn hình | Nội dung chính | Ưu tiên |
|---|---|---|---|
| W1 | Trang chủ | Logo, xếp hạng 4 đội, kết quả mới nhất, số trận còn lại, **dải cảnh báo trận tồn khi kỳ sắp hết hạn (6.8)**, nút "Nhập tỉ số" | P0 |
| W2 | Lịch và kết quả | Danh sách trận theo kỳ (chỉ kỳ đã đăng), hạn chót từng kỳ. Lọc theo đội, người, trạng thái. Mỗi trận hiển thị mã chấp, bên nhường và điểm chấp theo từng set | P0 |
| W3 | Chi tiết trận | Hai bên, điểm, mã chấp, tỉ số chính thức, form gửi tỉ số, lịch sử duyệt | P0 |
| W4 | Hồ sơ cá nhân | Trận còn nợ trong kỳ và hạn chót, lịch của riêng người đó, mã chấp với từng đối thủ, kết quả, tỷ lệ thắng đơn và đôi, điểm dự kiến Mùa 6 theo luật | P0 |
| W5 | Bảng xếp hạng | Đội, cá nhân (đơn, đôi, tổng), cặp đôi. Sắp xếp theo cột | P0 |
| W6 | Máy tính mã chấp | Chọn hai người hoặc hai cặp, ra mã chấp ngay | P1 |
| W7 | Quy chế giải | Trang nội dung Markdown, Admin chỉnh sửa được | P1 |
| W8 | Lịch sử mùa trước | Tổng kết Mùa 4 (dữ liệu nhập một lần, chỉ đọc) | P2 |
| W9 | Tối nay ai đến | Check-in bằng cách bấm tên, danh sách trận khả thi theo người có mặt, tiến độ toàn giải (mục 6.9) | P1 |

### 8.2 Trang Admin (đăng nhập)

| Mã | Màn hình | Nội dung chính | Ưu tiên |
|---|---|---|---|
| A1 | Hàng đợi duyệt | Danh sách bản gửi chờ duyệt, so sánh bản xung đột, xem ảnh | P0 |
| A2 | Quản lý mùa giải | Tạo mùa, sao chép cấu hình từ mùa trước, khóa/mở khóa | P0 |
| A3 | Đội và tuyển thủ | Thêm, sửa, chuyển đội, điểm trình, đánh dấu điểm tạm | P0 |
| A4 | Bộ sinh lịch | Chọn tham số, sinh, xem trước, kiểm tra R1–R5 và R8, chia kỳ, kéo thả chỉnh tay, **đăng lịch từng kỳ** | P0 |
| A5 | Quản lý trận | **Đóng kỳ và cập nhật xử thua từng trận** (6.7), chọn bên bị xử, gia hạn riêng một trận, hủy, nhập trực tiếp (kèm ngày đấu thực tế), sửa kết quả đã duyệt | P0 |
| A6 | Bảng chấp | Sửa các dòng của bảng chấp, xem trước tác động lên lịch chưa đấu | P1 |
| A7 | Điều chỉnh điểm cuối mùa | Chạy gợi ý theo luật, ghi đè và lý do, chốt điểm Mùa kế tiếp | P1 |
| A8 | Cấu hình | Toàn bộ mục ở Phần 9 | P1 |
| A9 | Nhật ký | Lọc theo người, loại hành động, thời gian | P1 |
| A11 | Tiến độ kỳ và cảnh báo | Tỷ lệ hoàn thành, danh sách trận tồn theo người và đội, mức chậm tiến độ, cấu hình mốc cảnh báo | P0 |
| A10 | Xuất / nhập dữ liệu | Xuất CSV/XLSX toàn bộ. Nhập danh sách tuyển thủ từ CSV | P1 |

## 9. Tùy biến (yêu cầu "độ tùy biến cao")

Mọi mục dưới đây nằm trong cấu hình của mùa (cột JSON `seasons.settings` và bảng liên quan), chỉnh từ A8 mà không sửa code.

| Nhóm | Cấu hình |
|---|---|
| Cấu trúc giải | Số đội, số người mỗi đội, tên đội, màu đội, số lượt vòng tròn (mặc định 1) |
| Thể thức | Số set thắng cho đơn và đôi. Có tính điểm đội cho đôi hay không |
| Bảng chấp | Sửa từng dòng. Công thức chênh đôi (mặc định chia 2). Cách xử lý chênh vượt bảng |
| Lịch | `singles_mode` (`all` = đánh tất cả, `limited` = rút gọn), ngày kết thúc mùa, mốc tiến độ hàng tuần, số bàn, `periods_count` (đã chốt 4), `submission_grace_hours`, `alert_days_before`, `alert_completion_threshold`, chế độ cân bằng đối thủ và cân bằng chênh điểm trong ghép cặp đôi |
| Điểm đội | Thứ tự xét hòa. Điểm cho trận xử thua |
| Điều chỉnh điểm | Ngưỡng giảm và tăng, cơ sở tính (tổng hoặc đơn), số trận tối thiểu, mức tối đa mỗi mùa |
| Gửi tỉ số | Bật/tắt ảnh bằng chứng. Hiện hay ẩn tỉ số chờ duyệt. Giới hạn tốc độ. Bật Turnstile |
| Hiển thị | Bật/tắt từng trang và từng khối (ví dụ: xếp hạng cặp đôi, điểm dự kiến). Thứ tự khối trên trang chủ |
| Thương hiệu | Logo, bảng màu, chế độ sáng/tối mặc định, tên giải, câu khẩu hiệu |
| Nội dung | Văn bản các nhãn chính và trang Quy chế (Markdown) |
| Quyền riêng tư | Cho phép công khai tên đầy đủ hay chỉ biệt danh. Có cho công cụ tìm kiếm lập chỉ mục (mặc định không) |

**Quy tắc khóa:** sau khi mùa chuyển sang `active`, các cấu hình ảnh hưởng đến lịch và mã chấp (số đội, tham số lịch, bảng chấp) chỉ sửa khi Admin xác nhận. Mọi thay đổi ghi nhật ký và áp dụng cho trận chưa đấu.

## 10. Thiết kế dữ liệu (PostgreSQL trên Supabase)

```sql
create table seasons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  status text not null default 'draft' check (status in ('draft','active','closed')),
  starts_on date, ends_on date,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons on delete cascade,
  name text not null, color text, sort_order int not null default 0
);

create table players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null, nickname text, active boolean not null default true
);

create table season_players (
  season_id uuid references seasons on delete cascade,
  player_id uuid references players,
  team_id uuid not null references teams,
  rating_start numeric(4,1) not null,
  rating_end numeric(4,1),
  is_provisional boolean not null default false,
  primary key (season_id, player_id)
);

create table handicap_rules (
  season_id uuid references seasons on delete cascade,
  diff numeric(3,1) not null,
  singles_code text not null, doubles_code text not null, note text,
  primary key (season_id, diff)
);

create table periods (             -- kỳ 2 tuần do BTC đăng lịch
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons on delete cascade,
  period_no int not null, name text,
  starts_on date not null, ends_on date not null,
  status text not null default 'draft' check (status in ('draft','published','closed')),
  published_at timestamptz, closed_at timestamptz,
  unique (season_id, period_no)
);

create table alert_log (           -- nhật ký cảnh báo trận tồn đã gửi
  id bigserial primary key,
  period_id uuid not null references periods on delete cascade,
  days_before int not null, channel text not null,
  backlog_count int not null, completion_pct numeric(5,2),
  sent_at timestamptz not null default now()
);

create table fixtures (            -- một cặp đội gặp nhau
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons on delete cascade,
  team_a_id uuid not null references teams, team_b_id uuid not null references teams,
  check (team_a_id <> team_b_id)
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons on delete cascade,
  fixture_id uuid not null references fixtures on delete cascade,
  kind text not null check (kind in ('singles','doubles')),
  sets_to_win int not null,
  period_id uuid not null references periods,   -- kỳ mà trận thuộc về
  status text not null default 'scheduled' check (status in ('scheduled','played','forfeit','cancelled')),
  handicap_diff numeric(3,1), handicap_code text,
  handicap_giver char(1) check (handicap_giver in ('a','b')),   -- null nếu ngang nhau
  created_at timestamptz not null default now()
);

create table match_sides (         -- 1 người (đơn) hoặc 2 người (đôi) mỗi bên
  match_id uuid references matches on delete cascade,
  side char(1) check (side in ('a','b')),
  player_id uuid references players,
  primary key (match_id, side, player_id)
);

create table score_submissions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches on delete cascade,
  submitted_by_player_id uuid references players,      -- khai báo, không xác thực
  sets_a int not null, sets_b int not null,
  set_details jsonb,                                   -- tuỳ chọn: điểm từng set
  evidence_path text, note text,
  played_on date,                                      -- ngày đấu thực tế do người gửi khai
  status text not null default 'pending' check (status in ('pending','approved','rejected','superseded')),
  ip_hash text, created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users, reviewed_at timestamptz, review_note text
);

create table results (             -- chỉ chứa kết quả CHÍNH THỨC
  match_id uuid primary key references matches on delete cascade,
  sets_a int not null, sets_b int not null, set_details jsonb,
  played_on date, table_no int,
  winner_side char(1) check (winner_side in ('a','b')),   -- null khi cả hai bên bị xử thua
  is_forfeit boolean not null default false,
  forfeit_kind text check (forfeit_kind in ('winner_a','winner_b','both')),
  source_submission_id uuid references score_submissions,
  approved_by uuid references auth.users, approved_at timestamptz not null default now()
);

create table rating_decisions (
  season_id uuid references seasons, player_id uuid references players,
  from_rating numeric(4,1), rule_rating numeric(4,1), final_rating numeric(4,1) not null,
  reason text, decided_by uuid references auth.users, decided_at timestamptz default now(),
  primary key (season_id, player_id)
);

create table audit_log (
  id bigserial primary key, actor uuid, action text not null, entity text not null,
  entity_id text, before jsonb, after jsonb, reason text, at timestamptz not null default now()
);

create table attendance (          -- check-in tối nay, chỉ phục vụ gợi ý trận
  season_id uuid references seasons on delete cascade,
  player_id uuid references players,
  on_date date not null,
  checked_in_at timestamptz not null default now(),
  primary key (season_id, player_id, on_date)
);

create table admins (user_id uuid primary key references auth.users, display_name text);
```

**View (chỉ dùng `results`):** `v_team_standings`, `v_player_stats` (đơn, đôi, tổng, tỷ lệ), `v_pair_stats`, `v_pending_flags` (chỉ trả `match_id` và `has_pending`, `has_conflict`, không lộ tỉ số).

**Bảo mật mức dòng (RLS):**
- Bật RLS cho mọi bảng.
- Khách chỉ **đọc** các bảng công khai: `seasons`, `teams`, `players`, `season_players`, `handicap_rules`, `periods`, `fixtures`, `matches` (chỉ trận thuộc kỳ đã đăng), `match_sides`, `results` và các view.
- Khách **không đọc, không ghi trực tiếp** `score_submissions`. Gửi tỉ số đi qua API server (route handler), nơi kiểm tra hợp lệ và giới hạn tốc độ rồi mới ghi bằng khóa dịch vụ.
- Admin: toàn quyền khi `exists (select 1 from admins where user_id = auth.uid())`.
- Khóa `service_role` chỉ nằm ở máy chủ, không bao giờ xuất hiện ở trình duyệt.

## 11. Kiến trúc và công nghệ

Dùng bộ công cụ anh Nam đã có (Vercel, Supabase, GitHub). Không dùng thêm dịch vụ khác nếu không cần.

| Lớp | Lựa chọn |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS. Phiên bản ổn định mới nhất |
| Backend | Route Handlers của Next.js. Supabase (Postgres, Auth, Storage) |
| Triển khai | Vercel (bản Hobby là đủ) |
| Kiểm thử | Vitest cho logic nghiệp vụ. Playwright cho luồng gửi và duyệt tỉ số (P1) |
| Xuất file | Thư viện tạo XLSX/CSV phía server |

**Nguyên tắc cho Agent:**
1. Toàn bộ logic nghiệp vụ nằm trong `src/lib/domain/` dưới dạng hàm thuần (không gọi DB), để kiểm thử.
2. Không viết cứng luật. Mọi ngưỡng, bảng chấp, tham số lịch đọc từ cấu hình mùa.
3. Mọi ghi dữ liệu quan trọng đi qua một hàm ghi nhật ký chung.
4. Giao diện tiếng Việt. Múi giờ `Asia/Ho_Chi_Minh`. Định dạng ngày `dd/MM/yyyy`.
5. Mobile first. Kiểm tra ở chiều rộng 375px trước.

**Cấu trúc thư mục đề xuất:**

```
legend-chicks-cup/
├─ PRD.md
├─ assets/logo-legend-chicks-cup.png
├─ seed/season5.json
├─ supabase/migrations/           # SQL ở Phần 10 + RLS + view
├─ src/
│  ├─ app/
│  │  ├─ (public)/                # W1–W8
│  │  ├─ admin/                   # A1–A10
│  │  └─ api/submit-score/        # nhận bản gửi công khai
│  ├─ lib/
│  │  ├─ domain/
│  │  │  ├─ handicap.ts           # tính chênh và mã chấp
│  │  │  ├─ scheduler.ts          # sinh lịch, kiểm tra R1–R5
│  │  │  ├─ standings.ts          # xếp hạng đội, cá nhân, cặp
│  │  │  └─ rating.ts             # gợi ý điều chỉnh điểm
│  │  ├─ supabase/                # client trình duyệt và máy chủ
│  │  └─ audit.ts
│  └─ components/
└─ tests/domain/
```

## 12. Bảo mật, quyền riêng tư và rủi ro

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| Gửi tỉ số giả, mạo danh người khác (không đăng nhập, "người gửi" chỉ là khai báo) | Cao | Admin duyệt là chốt kiểm soát. Hiển thị người gửi, thời gian, ảnh. Đánh dấu xung đột. Không tính dữ liệu chờ duyệt vào thống kê |
| Spam, bot gửi hàng loạt | Trung bình | Giới hạn tốc độ, honeypot, Turnstile tùy chọn, kích thước ảnh tối đa |
| Admin duyệt chậm, số liệu hiển thị trễ | Trung bình | Hàng đợi, đếm số chờ duyệt, duyệt hàng loạt. Cân nhắc thêm Admin thứ hai |
| Admin sửa nhầm, mất dấu vết | Trung bình | Nhật ký đầy đủ, lưu bản trước khi sửa |
| Đánh tự do nên người ít có mặt bị nợ nhiều trận, dồn cuối mùa | Cao | Hiển thị trận còn nợ từng người, mốc tiến độ hàng tuần, cảnh báo chậm, quy tắc xử lý trận chưa đấu khi hết hạn |
| Đổi luật giữa mùa gây tranh cãi | Cao | Khóa cấu hình khi mùa active, ghi lý do thay đổi, thông báo trên trang Quy chế |
| Lộ khóa `service_role` | Cao | Chỉ dùng ở máy chủ, lưu trong biến môi trường Vercel, không commit lên GitHub |
| Mất dữ liệu | Trung bình | Admin xuất XLSX định kỳ (khuyến nghị mỗi kỳ). Bật sao lưu Supabase nếu gói cho phép |
| Dữ liệu cá nhân | Thấp | Chỉ lưu tên, biệt danh, điểm, kết quả. Xin đồng ý của 16 thành viên trước khi công khai. Mặc định đặt `noindex`, chỉ chia sẻ qua link. Không thu số điện thoại, email thành viên |
| Điểm của người mới (Tân 12, Khanh 7) lệch thực lực | Trung bình | Cờ `provisional`, kiểm tra giữa mùa, mã chấp các trận chưa đấu tự tính lại |

Đây là giải nội bộ, không thuộc quảng cáo hay hoạt động dược nên không phát sinh yêu cầu pháp lý chuyên ngành. Nếu sau này công khai rộng (ví dụ làm case study cho Nam AI Lab), nên ẩn danh người chơi.

## 13. Tiêu chí nghiệm thu và ca kiểm thử

### 13.1 Ca kiểm thử mã chấp (lấy từ dữ liệu thật Mùa 4, điểm Mùa 4)

| Trận | Điểm hai bên | Chênh | Mã chấp đúng |
|---|---|---|---|
| Hiếu vs Nam Gai (đơn) | 8 – 12 | 4 | 4-4-4, Nam Gai chấp |
| Thanh vs Phương (đơn) | 8 – 7 | 1 | 0-2-0, Thanh chấp |
| Kiên vs Đức (đơn) | 9 – 9 | 0 | 0-0-0 |
| Kiên+Vinh vs Sinh+Phương (đôi) | 16 – 15 | 0.5 | 0-1-0 |
| Nam Gai+Sinh vs Dương+Hùng (đôi) | 20 – 17 | 1.5 | 2-0-2 |
| Hiếu+Thảo vs Đức+Thông (đôi) | 15 – 15 | 0 | 0-0-0 |

### 13.2 Ca kiểm thử điều chỉnh điểm (tỷ lệ thắng tổng Mùa 4)

| Người | Tỷ lệ | Kỳ vọng theo luật mặc định |
|---|---|---|
| Thanh | 28% | Giảm 1 (8 → 7) |
| Nam Gai | 78% | Giữ nguyên |
| Sinh, Thông | 72% | Giữ nguyên |
| Hiếu, Kiên | 67% | Giữ nguyên theo luật (Mùa 4 thực tế được tăng nhờ quyết định ban tổ chức) |
| Dũng | 6% | Luật gợi ý giảm 1. Admin ghi đè giữ 6 (nếu có mức sàn) |

### 13.3 Tiêu chí nghiệm thu theo Milestone

| Mã | Tiêu chí |
|---|---|
| AC1 | Seed `season5.json` nạp đủ 4 đội, 16 người, 13 dòng bảng chấp |
| AC2 | Sinh lịch với tham số mặc định ra đúng 132 trận (96 đơn, 36 đôi). Mỗi người đúng 12 đơn (một trận với từng người đội khác) và 9 đôi. Mỗi fixture có 22 trận. Vượt R1–R4 |
| AC3 | Mỗi cặp đôi đúng 1 trận với mỗi đội khác, không lặp, không lượt về. Test tự động xác nhận. Cân bằng đối thủ (R5) không lệch quá 1 |
| AC4 | Khách gửi tỉ số hợp lệ thì có bản `pending`, chưa thay đổi bảng xếp hạng |
| AC5 | Tỉ số không hợp lệ (ví dụ 3-3, 2-0, 4-1, với cả đơn và đôi) bị từ chối với thông báo tiếng Việt. Tỉ số 3-0, 3-1, 3-2 hợp lệ cho cả đơn và đôi |
| AC6 | Admin duyệt thì trận thành `played`, `results` có bản ghi, bảng xếp hạng cập nhật, nhật ký có dòng mới |
| AC7 | Hai bản gửi khác người thắng được đánh dấu "Xung đột" |
| AC8 | Người chưa đăng nhập không đọc được `score_submissions`, không gọi được API duyệt |
| AC9 | 13.1 và 13.2 pass trong Vitest |
| AC10 | Các trang W1–W5 dùng tốt ở chiều rộng 375px, không cuộn ngang trang |
| AC11 | Đổi một giá trị cấu hình (ví dụ ngưỡng giảm điểm) trong A8 làm thay đổi kết quả gợi ý mà không sửa code |
| AC12 | Xuất XLSX đủ: tuyển thủ, lịch, kết quả chính thức, bảng xếp hạng |
| AC14 | Ba ngày trước hết kỳ, trang chủ hiện dải cảnh báo đúng số trận tồn. Trang cá nhân hiện đúng số trận còn nợ và hạn chót. Admin thấy danh sách trận tồn theo người và mức chậm tiến độ (màu đỏ khi dưới ngưỡng) |
| AC15 | Hết kỳ, trận chưa đấu vào danh sách "trận cần xử" cho Admin. Trận có bản gửi chờ duyệt không nằm trong danh sách. Admin chọn bên bị xử (một bên hoặc cả hai) cho từng trận thì trận thành `forfeit`. Chưa xử hết thì không đóng được kỳ. Xử cả hai bên thì không cộng điểm đội cho bên nào |
| AC16 | Kỳ chưa đăng thì khách không thấy trận của kỳ đó. Đăng kỳ có ghi nhật ký |
| AC17 | Chia 4 kỳ cho mỗi người 5–6 trận mỗi kỳ, tổng đúng 21 trận. Chia 3 kỳ ra đúng 44 trận mỗi kỳ |
| AC13 | Check-in 4 người (2 đội) thì gợi ý có trận đôi khả thi. Chỉ gợi ý trận mà mọi người tham gia đều có mặt. Không gợi ý một người hai trận cùng lúc. Check-in hết hiệu lực sau 24 giờ |

## 14. Lộ trình Milestone cho Agent

Agent hoàn thành từng Milestone, chạy kiểm thử, báo cáo cho anh Nam duyệt rồi mới sang Milestone sau.

| MS | Nội dung | Kết quả bàn giao | Thuộc P |
|---|---|---|---|
| M0 | Khởi tạo dự án, kết nối Supabase và Vercel, thiết lập thương hiệu (logo, màu) | Trang trống chạy trên Vercel | P0 |
| M1 | Schema, RLS, view, seed Mùa 5, đăng nhập Admin | AC1, AC8 | P0 |
| M2 | Logic miền: handicap, scheduler, standings, rating cùng test | AC2, AC3, AC9 | P0 |
| M3 | Trang Admin: đội, tuyển thủ, bộ sinh lịch, chia kỳ và đăng kỳ, quản lý trận | Lịch Mùa 5 sinh và đăng từng kỳ được. AC16, AC17 | P0 |
| M4 | Trang công khai W1–W5, dải cảnh báo trận tồn, trận còn nợ trong kỳ, bảng tiến độ Admin A11 | AC10, AC14 | P0 |
| M5 | Gửi tỉ số công khai, hàng đợi duyệt, chống spam, nhật ký, đóng kỳ và xử thua | AC4–AC7, AC15 | P0 |
| M6 | Cấu hình A8, bảng chấp A6, điều chỉnh điểm A7, W6, W7, W9 (check-in, gợi ý trận, tiến độ) | AC11, AC13 | P1 |
| M7 | Xuất/nhập dữ liệu, rà soát bảo mật, kiểm thử cuối, hướng dẫn dùng cho Admin | AC12 | P1 |

**Điều kiện hoàn thành chung (Definition of Done):** có test cho logic, không lỗi TypeScript, không có khóa bí mật trong repo, chạy tốt ở 375px, có ghi chú cập nhật vào `README.md`.

## 15. Câu hỏi mở (anh Nam xác nhận) và mặc định tạm

Agent dùng cột "Mặc định tạm" để làm tiếp nếu chưa có trả lời. Mọi mục đều đã là cấu hình, đổi sau không phải viết lại.

| # | Câu hỏi | Mặc định tạm |
|---|---|---|
| Q1 | ~~Mã chấp a-b-c áp dụng thế nào?~~ **Đã chốt:** set lẻ dùng số đầu, set chẵn dùng số giữa (mục 5.2) | Không còn mở |
| Q2 | Xác nhận cách hiểu "mỗi cặp đánh với mỗi bảng 1 Set": hiểu là 1 trận đôi với mỗi đội (132 trận, mỗi người 21 trận) | Theo cách hiểu này |
| Q3 | ~~Số bàn, giờ chơi, thời lượng mùa, số kỳ~~ **Đã chốt:** 4 bàn (thường dùng 2), đánh tự do khoảng 18h–20h, mùa 8 tuần gồm 4 kỳ 2 tuần, trận tồn bị xử thua | Không còn mở |
| Q4 | Tên bốn đội | Đội 1 đến Đội 4 |
| Q5 | Luật điều chỉnh điểm: dùng tỷ lệ tổng hay chỉ đơn? Số trận tối thiểu? File "Hướng dẫn" ghi chỉ đơn, bảng mới nhất dùng tổng | Tỷ lệ tổng, ngưỡng 29/30–78/79, tối thiểu 8 trận |
| Q6 | Xếp hạng đội khi hòa điểm | Đối đầu, hiệu số set, tổng thắng đơn |
| Q7 | Người được gửi tỉ số: bất kỳ ai, hay chỉ người trong trận? | Chọn tên bất kỳ trong 16 người, Admin chốt |
| Q8 | Số Admin và email Admin | Một Admin (email anh Nam) |
| Q9 | Công khai thế nào: link riêng chia sẻ trong nhóm hay công khai hoàn toàn? | Chỉ qua link, `noindex` |
| Q10 | Kiểm tra điểm giữa mùa cho Tân và Khanh vào thời điểm nào? | Sau kỳ 1 |
| Q11 | Hạn chót mỗi kỳ | Ngày cuối của kỳ, 23:59 giờ Việt Nam. Gửi muộn chấp nhận trong 48 giờ nếu ngày đấu nằm trong kỳ |
| Q13 | ~~Xử thua trận không đấu~~ **Đã chốt:** BTC cập nhật từng trận | Không còn mở |
| Q14 | ~~Telegram~~ **Đã chốt:** không cần | Không còn mở |
| Q12 | Phương rời giải hẳn hay chỉ nghỉ Mùa 5? | Giữ trong danh sách tuyển thủ, không gán vào Mùa 5 |

## 16. Phụ lục

### 16.1 Nhận diện thương hiệu (từ logo Legend Chicks Cup 2026)

Logo: gà con vàng cầm vợt xanh trên khiên tím, chữ "LEGEND CHICKS CUP 2026". Agent lấy mã màu chính xác từ file logo, các giá trị dưới đây là điểm xuất phát.

| Token | Gợi ý | Dùng cho |
|---|---|---|
| `--brand-purple` | tím đậm (#6D28D9) | Viền, nút chính |
| `--brand-navy` | xanh navy (#1B2470) | Nền chế độ tối, tiêu đề |
| `--brand-yellow` | vàng (#FFC21A) | Điểm nhấn, huy hiệu |
| `--brand-orange` | cam (#F7931E) | Nhãn nổi bật, "chờ duyệt" |
| `--brand-blue` | xanh vợt (#2F5BEA) | Liên kết, trạng thái đang diễn ra |

Màu bốn đội mặc định: xanh dương, vàng đậm, xanh lá, tím (xem `seed/season5.json`). Chế độ sáng và tối đều phải đọc rõ. Màu chữ không dựa riêng vào màu đội, luôn kèm tên đội hoặc chấm màu.

### 16.2 Prompt giao việc cho Antigravity (dán vào Agent)

```
Bạn là kỹ sư phần mềm cho dự án "Legend Chicks Cup 2026".
Đọc toàn bộ PRD.md, seed/season5.json và assets/logo-legend-chicks-cup.png trước khi làm.

Quy tắc:
1. Làm đúng thứ tự Milestone ở Phần 14. Chỉ làm một Milestone mỗi lần, xong thì chạy test, báo cáo kết quả và dừng để tôi duyệt.
2. Với câu hỏi mở ở Phần 15, dùng "Mặc định tạm" và ghi vào README.md những mặc định đã dùng. Số trận và cấu trúc lịch theo đúng Phần 6 (132 trận), không rút gọn nếu tôi chưa yêu cầu.
3. Toàn bộ luật đọc từ cấu hình mùa, không viết cứng. Logic nghiệp vụ là hàm thuần trong src/lib/domain/ và phải có test Vitest, gồm các ca ở mục 13.1 và 13.2.
4. Khách không đăng nhập không được đọc hoặc ghi trực tiếp bảng score_submissions. Khóa service_role chỉ dùng ở máy chủ, không commit.
5. Giao diện tiếng Việt, mobile first (375px), hỗ trợ sáng và tối, theo thương hiệu ở Phụ lục 16.1.
6. Nếu thiếu thông tin hoặc có mâu thuẫn trong PRD, nêu rõ câu hỏi và đề xuất, không tự quyết những điểm ảnh hưởng đến luật giải.

Bắt đầu với M0. Báo cáo bằng tiếng Việt.
```

### 16.3 Cách dùng với Antigravity (từng bước)

1. Tạo thư mục dự án, ví dụ `legend-chicks-cup`, chép vào đó `PRD.md`, `AGENTS.md` (quy tắc cho Agent, Antigravity tự đọc), thư mục `assets/` và `seed/`.
2. Tạo sẵn: một dự án Supabase mới (dành riêng cho giải này) và một dự án Vercel trống. Giữ khóa Supabase ở biến môi trường, không dán vào chat với Agent.
3. Mở thư mục bằng Antigravity, dán prompt ở 16.2.
4. Sau mỗi Milestone, kiểm tra trên điện thoại và đối chiếu tiêu chí nghiệm thu ở 13.3 rồi mới cho sang bước kế.
