# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Bác sĩ khám bệnh chính (Primary):** Bác sĩ lâm sàng tại phòng khám tư / phòng khám chuyên khoa ngoại trú (BS. Trần Văn Diệu), thực hiện tiếp nhận bệnh nhân, chẩn đoán, kê toa và in hướng dẫn điều trị liên tục dưới áp lực thời gian.
- **Nhân viên & Trợ lý phòng khám (Secondary):** Hỗ trợ tra cứu hồ sơ bệnh nhân, hỗ trợ in ấn, cập nhật trạng thái đơn thuốc thông qua máy tính phụ hoặc thiết bị di động (iPhone/iPad/Android) kết nối qua mạng nội bộ Wi-Fi (LAN).

## Product Purpose

Cung cấp công cụ quản lý khám chữa bệnh ngoại trú tinh gọn, loại bỏ hoàn toàn các thao tác rê chuột chậm chạp (triết lý "Zero-Mouse"), giúp bác sĩ hoàn thành quy trình kê đơn hoàn chỉnh kèm ma trận nhắc giờ uống thuốc trực quan trong vòng dưới 30 giây mà vẫn bảo đảm an toàn lâm sàng tối đa.

## Positioning

Khác biệt với các hệ thống quản lý bệnh viện (HIS/EMR) cồng kềnh, phân mảnh và phụ thuộc thao tác chuột, hệ thống tối ưu hóa hoàn toàn cho tốc độ phản xạ thực tế của bác sĩ phòng khám tư:
- Toàn bộ thao tác chỉ cần bàn phím (phím chức năng F1-F12 và phím tắt chuẩn y khoa).
- Tự động tạo ma trận phân liều uống trực quan (Sáng - Trưa - Chiều - Tối) trên bản in toa thuốc A4/A5, giúp người bệnh (đặc biệt là người cao tuổi) tuân thủ điều trị chính xác.
- Engine thẩm định lâm sàng offline tự động cảnh báo dị ứng, trùng hoạt chất và tương tác thuốc bất lợi ngay trong lúc gõ mà không cần mạng Internet.

## Operating Context

- **Môi trường phòng khám thực tế:** Bàn khám bệnh tại chỗ với màn hình máy tính bàn/laptop, kết nối máy in nhiệt hoặc máy in laser A4/A5, hoạt động liên tục trong ca khám.
- **Mạng cục bộ (LAN):** Máy chủ Express/Node.js chạy trực tiếp tại phòng khám (hoặc triển khai web), hỗ trợ quét mã QR để đồng bộ và truy cập nhanh từ điện thoại của trợ lý qua mạng Wi-Fi nội bộ.
- **Quy trình khám:** Tiếp nhận nhanh bệnh nhân (F1/F3) ➔ Nhập chẩn đoán/ICD-10 (F4) ➔ Tìm thuốc & thêm liều chuẩn (F2/Enter) ➔ Cảnh báo tương tác tự động ➔ Lưu & In toa thuốc kèm bảng lịch uống ngay lập tức (F9 / Ctrl+Enter).

## Capabilities and Constraints

- **Công nghệ nền tảng:** React 19, TypeScript, Tailwind CSS v4, Motion, Vite, Express/Node.js, PostgreSQL/Local DB.
- **Quy chuẩn kê đơn:** Tuân thủ Thông tư 04/2022/TT-BYT và Thông tư 27/2021/TT-BYT về đơn thuốc điện tử (Mã đơn thuốc định dạng chuẩn `DT-YYYYMMDD-XXXX`, mã liên thông quốc gia, mã QR xác thực toa thuốc, mã VietQR thanh toán tự động).
- **Danh mục dược:** Hơn 150 thuốc thiết yếu và danh mục thuốc lưu hành tại Việt Nam kèm sẵn phân liều chuẩn ngoại trú, dạng bào chế và hoạt chất.
- **Không phụ thuộc đám mây:** Toàn bộ dữ liệu lâm sàng, kiểm tra tương tác thuốc và in ấn vận hành trơn tru ngay cả khi mất kết nối Internet.

## Brand Commitments

- **Tên phòng khám:** Phòng Khám Bác Sĩ Trần Văn Diệu
- **Giấy phép / CCHN:** 012345/HCM-CCHN
- **Tông màu nhận diện y tế:** Xanh lá y tế / Emerald Green (`emerald-800`, `emerald-700`) kết hợp Slate/Zinc tối giản, trang trọng, tương phản cao, bảo vệ mắt khi làm việc nhiều giờ.

## Evidence on Hand

- Tài liệu hướng dẫn sử dụng chi tiết: `HUONG_DAN_SU_DUNG.md` (Phiên bản 2.5 - Chế độ thao tác bàn phím siêu tốc Zero-Mouse).
- Danh mục lâm sàng & dữ liệu thuốc: `src/data/essentialClinicDrugs150.ts`, `src/data/vietnamMarketDrugsCatalog.ts`, `src/data/clinicalProtocols.ts`.
- Mẫu in đơn thuốc chuẩn y tế Việt Nam: `src/components/PrintableClinicPrescription.tsx`, `src/components/PrintableLabOrder.tsx`.
- Cơ chế đồng bộ mạng LAN: `src/components/LanConnectModal.tsx`.

## Product Principles

1. **Bàn phím là trung tâm (Keyboard-First / Zero-Mouse):** Mọi tương tác cốt lõi từ tiếp nhận đến in ấn đều có phím tắt trực tiếp, không bắt buộc dùng chuột.
2. **An toàn lâm sàng là trên hết:** Cảnh báo dị ứng và tương tác thuốc xuất hiện ngay khi kê đơn; phòng ngừa tối đa rủi ro y khoa.
3. **Minh bạch và dễ hiểu cho người bệnh:** Bản in toa thuốc luôn đính kèm bảng chia giờ uống cụ thể (Sáng - Trưa - Chiều - Tối) và mã QR tiện lợi.
4. **Tốc độ và tính khả dụng cao:** Tối ưu hóa thời gian tải, dữ liệu lưu cục bộ, luôn sẵn sàng phục vụ không bị gián đoạn do mạng.

## Accessibility & Inclusion

- Tương phản màu sắc đạt chuẩn WCAG AA/AAA trên nền sáng và tối.
- Trực quan hóa thông tin liều uống bằng biểu tượng thời gian trực quan (Mặt trời mọc, Mặt trời đứng bóng, Hoàng hôn, Trăng sao) để người cao tuổi hoặc người thị lực kém dễ dàng nhận diện.
