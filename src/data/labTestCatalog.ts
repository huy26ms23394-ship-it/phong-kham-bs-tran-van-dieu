import {
  LabTestItem,
  LabCenterReferral,
  LabOrderPackage,
  LabTestCategory,
} from '../types/medical';

export const LAB_TEST_CATEGORIES: { id: LabTestCategory; label: string; iconName?: string }[] = [
  { id: 'sinh_hoa_duong_huyet', label: '1. Đường Huyết & HbA1c' },
  { id: 'sinh_hoa_mo_mau', label: '2. Bộ Mỡ Máu (Lipid Panel)' },
  { id: 'sinh_hoa_gan_than', label: '3. Chức Năng Gan - Thận - Gout' },
  { id: 'huyet_hoc', label: '4. Huyết Học & Đông Máu' },
  { id: 'nuoc_tieu', label: '5. Tổng Phân Tích Nước Tiểu' },
  { id: 'viem_gan_mien_dich', label: '6. Viêm Gan & Tuyến Giáp' },
  { id: 'chan_doan_hinh_anh', label: '7. Điện Tim, Siêu Âm & X-Quang' },
];

export const DEFAULT_LAB_CENTERS: LabCenterReferral[] = [
  {
    id: 'center_548',
    name: 'TRUNG TÂM CHẨN ĐOÁN Y KHOA 548',
    address: '548 Nguyễn Chí Thanh, Phường 7, Quận 11, TP. Hồ Chí Minh',
    phone: '(028) 3855 5448 • (028) 3955 1253',
    notes: 'Bệnh nhân nhịn ăn sáng từ 8-10 giờ (có thể uống nước lọc). Mang phiếu này nạp tại quầy tiếp nhận Trung Tâm 548.',
  },
  {
    id: 'center_medic_hoa_hao',
    name: 'TRUNG TÂM Y KHOA MEDIC HÒA HẢO',
    address: '254 Hòa Hảo, Phường 4, Quận 10, TP. Hồ Chí Minh',
    phone: '(028) 3927 0284',
    notes: 'Nhịn ăn sáng để xét nghiệm máu và siêu âm bụng chính xác.',
  },
  {
    id: 'center_diag',
    name: 'TRUNG TÂM XÉT NGHIỆM Y KHOA DIAG LABORATORIES',
    address: '414-420 Cao Thắng, Phường 12, Quận 10, TP. Hồ Chí Minh',
    phone: '1900 1717',
    notes: 'Trung tâm xét nghiệm tiêu chuẩn quốc tế ISO 15189.',
  },
  {
    id: 'center_pasteur',
    name: 'VIỆN PASTEUR TP. HỒ CHÍ MINH',
    address: '167 Pasteur, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    phone: '(028) 3823 0352',
    notes: 'Xét nghiệm chuyên sâu miễn dịch, vi sinh và huyết thanh học.',
  },
];

export const LAB_TEST_CATALOG: LabTestItem[] = [
  // 1. Đường Huyết & Đái Tháo Đường
  {
    id: 'glucose_fasting',
    name: 'Định lượng Glucose máu lúc đói (Fasting Glucose)',
    category: 'sinh_hoa_duong_huyet',
    shortDesc: 'Nhịn ăn sáng ít nhất 8 tiếng',
    isFastTest: true,
  },
  {
    id: 'hba1c',
    name: 'Đo lường Hemoglobin A1c (HbA1c - Đường huyết 3 tháng)',
    category: 'sinh_hoa_duong_huyet',
    shortDesc: 'Đánh giá kiểm soát đường huyết trung bình',
    isFastTest: true,
  },

  // 2. Bộ Mỡ Máu (Lipid Panel)
  {
    id: 'cholesterol_total',
    name: 'Cholesterol toàn phần (Total Cholesterol)',
    category: 'sinh_hoa_mo_mau',
    isFastTest: true,
  },
  {
    id: 'triglyceride',
    name: 'Triglyceride máu',
    category: 'sinh_hoa_mo_mau',
    shortDesc: 'Nhịn ăn ít nhất 10-12 tiếng',
    isFastTest: true,
  },
  {
    id: 'hdl_c',
    name: 'HDL-Cholesterol (Mỡ tốt bảo vệ tim mạch)',
    category: 'sinh_hoa_mo_mau',
    isFastTest: true,
  },
  {
    id: 'ldl_c',
    name: 'LDL-Cholesterol (Mỡ xấu gây xơ vữa động mạch)',
    category: 'sinh_hoa_mo_mau',
    isFastTest: true,
  },

  // 3. Chức Năng Gan - Thận - Gout
  {
    id: 'ure',
    name: 'Ure máu (BUN)',
    category: 'sinh_hoa_gan_than',
    isFastTest: true,
  },
  {
    id: 'creatinine',
    name: 'Creatinine máu (Kèm ước tính mức lọc cầu thận eGFR)',
    category: 'sinh_hoa_gan_than',
    shortDesc: 'Đánh giá chức năng thận và giai đoạn bệnh thận mạn',
    isFastTest: true,
  },
  {
    id: 'acid_uric',
    name: 'Acid Uric máu (Tầm soát bệnh Gút / Tăng acid uric)',
    category: 'sinh_hoa_gan_than',
    isFastTest: true,
  },
  {
    id: 'ast_sgot',
    name: 'Men gan AST (SGOT)',
    category: 'sinh_hoa_gan_than',
    isFastTest: true,
  },
  {
    id: 'alt_sgpt',
    name: 'Men gan ALT (SGPT)',
    category: 'sinh_hoa_gan_than',
    isFastTest: true,
  },
  {
    id: 'ggt',
    name: 'Men gan GGT (Gamma GT - Nhạy với ứ mật & bia rượu)',
    category: 'sinh_hoa_gan_than',
    isFastTest: true,
  },
  {
    id: 'bilirubin',
    name: 'Bilirubin toàn phần, trực tiếp, gián tiếp (Đánh giá hoàng đảm)',
    category: 'sinh_hoa_gan_than',
  },
  {
    id: 'ion_do',
    name: 'Điện giải đồ (Na+, K+, Cl- máu)',
    category: 'sinh_hoa_gan_than',
    shortDesc: 'Theo dõi điện giải khi dùng thuốc hạ áp, lợi tiểu',
    isFastTest: true,
  },

  // 4. Huyết Học & Đông Máu
  {
    id: 'cbc',
    name: 'Tổng phân tích tế bào máu ngoại vi (Công thức máu CBC 24 thông số)',
    category: 'huyet_hoc',
    shortDesc: 'Bạch cầu, Hồng cầu, Huyết sắc tố, Tiểu cầu',
    isFastTest: true,
  },
  {
    id: 'vs',
    name: 'Tốc độ máu lắng (VS - Giờ 1 & Giờ 2)',
    category: 'huyet_hoc',
    shortDesc: 'Đánh giá tình trạng viêm nhiễm toàn thân',
  },
  {
    id: 'blood_group',
    name: 'Định nhóm máu hệ ABO và Rhesus (RhD)',
    category: 'huyet_hoc',
  },

  // 5. Nước Tiểu
  {
    id: 'urine_10',
    name: 'Tổng phân tích nước tiểu 10 thông số (Bằng máy tự động)',
    category: 'nuoc_tieu',
    shortDesc: 'pH, Tỷ trọng, Protein, Đường, Hồng cầu, Bạch cầu niệu',
    isFastTest: true,
  },
  {
    id: 'microalbumin_urine',
    name: 'Định lượng Microalbumin niệu (Tầm soát sớm biến chứng thận ĐTĐ/THA)',
    category: 'nuoc_tieu',
  },

  // 6. Viêm Gan & Miễn Dịch
  {
    id: 'hbsag',
    name: 'HBsAg định tính / định lượng (Tầm soát Viêm gan B)',
    category: 'viem_gan_mien_dich',
  },
  {
    id: 'anti_hbs',
    name: 'Anti-HBs định lượng (Kháng thể bảo vệ Viêm gan B)',
    category: 'viem_gan_mien_dich',
  },
  {
    id: 'anti_hcv',
    name: 'Anti-HCV (Tầm soát Viêm gan C)',
    category: 'viem_gan_mien_dich',
  },
  {
    id: 'tsh',
    name: 'Định lượng TSH (Hormone kích thích tuyến giáp)',
    category: 'viem_gan_mien_dich',
  },
  {
    id: 'ft4',
    name: 'Định lượng FT4 (Thyroxine tự do)',
    category: 'viem_gan_mien_dich',
  },

  // 7. Chẩn Đoán Hình Ảnh & Thăm Dò Chức Năng (Thực hiện tại Trung Tâm 548)
  {
    id: 'ecg_12',
    name: 'Đo điện tâm đồ gắng sức / nghỉ (ECG 12 chuyển đạo)',
    category: 'chan_doan_hinh_anh',
    shortDesc: 'Tầm soát rối loạn nhịp tim, thiếu máu cơ tim',
    isFastTest: true,
  },
  {
    id: 'us_abdomen',
    name: 'Siêu âm bụng tổng quát màu (Gan, Mật, Tụy, Lách, Thận, Bàng quang)',
    category: 'chan_doan_hinh_anh',
    shortDesc: 'Nhịn tiểu căng bàng quang, nhịn ăn sáng',
  },
  {
    id: 'us_heart',
    name: 'Siêu âm tim Doppler màu (Khảo sát buồng tim, van tim, chức năng EF)',
    category: 'chan_doan_hinh_anh',
  },
  {
    id: 'us_carotid',
    name: 'Siêu âm Doppler động mạch cảnh & mạch máu não ngoại biên',
    category: 'chan_doan_hinh_anh',
    shortDesc: 'Đánh giá mảng xơ vữa động mạch cảnh ở người cao tuổi',
  },
  {
    id: 'us_thyroid',
    name: 'Siêu âm tuyến giáp Doppler màu',
    category: 'chan_doan_hinh_anh',
  },
  {
    id: 'xray_chest',
    name: 'Chụp X-quang tim phổi thẳng kỹ thuật số (KTS)',
    category: 'chan_doan_hinh_anh',
    shortDesc: 'Khảo sát nhu mô phổi, rốn phổi và bóng tim',
  },
  {
    id: 'xray_spine',
    name: 'Chụp X-quang cột sống thắt lưng thẳng - nghiêng',
    category: 'chan_doan_hinh_anh',
  },
  {
    id: 'xray_knee',
    name: 'Chụp X-quang khớp gối thẳng - nghiêng (Khảo sát thoái hóa khớp)',
    category: 'chan_doan_hinh_anh',
  },
];

export const LAB_ORDER_PACKAGES: LabOrderPackage[] = [
  {
    id: 'pkg_diabetes',
    name: 'Gói 1: Theo Dõi Đái Tháo Đường & Biến Chứng Thận (548)',
    description: 'Định lượng Đường huyết đói, HbA1c 3 tháng, Creatinine máu, eGFR và Nước tiểu 10 thông số.',
    testIds: ['glucose_fasting', 'hba1c', 'creatinine', 'urine_10', 'microalbumin_urine'],
  },
  {
    id: 'pkg_hypertension_cardio',
    name: 'Gói 2: Tăng Huyết Áp & Bộ Mỡ Máu Tim Mạch (548)',
    description: 'Bộ mỡ máu toàn diện (Cholesterol, Triglyceride, HDL, LDL), Điện giải đồ và Đo điện tim ECG.',
    testIds: ['cholesterol_total', 'triglyceride', 'hdl_c', 'ldl_c', 'ion_do', 'ecg_12'],
  },
  {
    id: 'pkg_liver_kidney_gout',
    name: 'Gói 3: Đánh Giá Chức Năng Gan - Thận - Gout (548)',
    description: 'Bộ men gan (AST, ALT, GGT), Chức năng thận (Ure, Creatinine, eGFR) và Tầm soát Acid Uric (Gout).',
    testIds: ['ast_sgot', 'alt_sgpt', 'ggt', 'ure', 'creatinine', 'acid_uric'],
  },
  {
    id: 'pkg_general_checkup',
    name: 'Gói 4: Khám Sức Khỏe Tổng Quát Ngoại Viện (548)',
    description: 'Công thức máu, Đường huyết, Bộ mỡ, Men gan, Thận, Nước tiểu, Điện tim và Siêu âm bụng tổng quát.',
    testIds: [
      'cbc',
      'glucose_fasting',
      'cholesterol_total',
      'triglyceride',
      'ldl_c',
      'ast_sgot',
      'alt_sgpt',
      'creatinine',
      'acid_uric',
      'urine_10',
      'ecg_12',
      'us_abdomen',
    ],
  },
  {
    id: 'pkg_thyroid',
    name: 'Gói 5: Kiểm Tra Chức Năng Tuyến Giáp (548)',
    description: 'Hormone TSH, FT4 và Siêu âm tuyến giáp Doppler màu.',
    testIds: ['tsh', 'ft4', 'us_thyroid'],
  },
];
