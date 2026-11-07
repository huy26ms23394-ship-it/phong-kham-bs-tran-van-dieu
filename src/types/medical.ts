export type MealTiming = 'truoc_an' | 'sau_an' | 'trong_an' | 'khi_can' | 'truoc_ngu';

export type DoseSlot = 'morning' | 'noon' | 'afternoon' | 'evening';

export interface MedicationDosage {
  morning: number; // Số lượng buổi sáng
  noon: number;    // Số lượng buổi trưa
  afternoon: number; // Số lượng buổi chiều
  evening: number; // Số lượng buổi tối
  timing: MealTiming; // Thời điểm uống
  customTimingNote?: string;
}

export interface PrescribedMedication {
  id: string;
  name: string; // Tên biệt dược
  activeIngredient?: string; // Hoạt chất
  strength?: string; // Hàm lượng (vd: 500mg, 10mg)
  form: string; // Viên nén, viên nang, gói, chai, ống...
  unit: string; // viên, gói, chai, ml...
  totalQuantity: number; // Tổng số lượng cấp
  dosage: MedicationDosage; // Phân bổ liều dùng trong ngày
  durationDays: number; // Số ngày uống
  instructions: string; // Hướng dẫn sử dụng
  warningOrNote?: string; // Lưu ý đặc biệt cho bệnh nhân
}

export interface VitalSigns {
  bloodPressureSystolic?: number; // Huyết áp tâm thu (mmHg)
  bloodPressureDiastolic?: number; // Huyết áp tâm trương (mmHg)
  heartRate?: number; // Nhịp tim (nhịp/phút)
  temperature?: number; // Nhiệt độ cơ thể (°C)
  weightKg?: number; // Cân nặng (kg)
  heightCm?: number; // Chiều cao (cm)
  spO2?: number; // Nồng độ oxy trong máu (%)
  bloodSugar?: number; // Đường huyết (mg/dL)
}

export interface Patient {
  id: string;
  patientCode: string; // Mã hồ sơ bệnh nhân (BN-0001)
  fullName: string; // Họ và tên bệnh nhân
  birthYear: number | string; // Năm sinh
  gender: 'nam' | 'nu' | 'khac'; // Giới tính
  phone: string; // Số điện thoại
  address?: string; // Địa chỉ
  healthInsuranceNumber?: string; // Số thẻ BHYT (nếu có)
  bloodType?: string; // Nhóm máu
  allergies: string[]; // Dị ứng thuốc & thực phẩm
  chronicConditions: string[]; // Tiền sử bệnh nền
  emergencyContactName?: string; // Tên người nhà
  emergencyContactPhone?: string; // SĐT người nhà
  notes?: string; // Ghi chú của phòng khám
  createdAt: string;
  updatedAt: string;
}

export interface ClinicSettings {
  clinicName: string; // Tên phòng khám (VD: PHÒNG KHÁM BÁC SĨ TRẦN VĂN DIỆU)
  doctorName: string; // Tên bác sĩ phụ trách (BS. Trần Văn Diệu)
  doctorTitle: string; // Học vị / Chức danh (Bác Sĩ Chuyên Khoa)
  specialty: string; // Chuyên khoa (Đa Khoa - Nội Khoa - Tim Mạch)
  licenseNumber: string; // Số giấy phép hoạt động (GPHĐ)
  practicingCertificate?: string; // Số chứng chỉ hành nghề (CCHN / GPHN)
  address: string; // Địa chỉ phòng khám
  phone: string; // Hotline phòng khám
  consultingHours: string; // Giờ khám bệnh
  // Cấu hình thanh toán ngân hàng & thu phí khám
  bankName?: string; // Tên ngân hàng (VD: Ngân hàng TMCP Ngoại Thương Việt Nam - Vietcombank)
  bankId?: string; // Mã ngân hàng VietQR (VD: 'VCB', 'MB', 'TCB', 'BIDV', 'ICB')
  bankAccountNo?: string; // Số tài khoản ngân hàng
  bankAccountName?: string; // Tên chủ tài khoản
  bankQrImage?: string; // Ảnh mã QR ngân hàng tải lên (cắt theo tỉ lệ 3:4, data URL base64)
  consultationFee?: number; // Tiền công khám bệnh mặc định (VNĐ)
}

export interface Prescription {
  id: string;
  prescriptionCode: string; // Mã đơn thuốc (VD: TOA-20261027-001)
  patientId: string;
  patientName: string;
  patientBirthYear: number | string;
  patientGender: 'nam' | 'nu' | 'khac';
  patientAddress?: string;
  patientPhone?: string;
  patientHealthInsuranceNumber?: string; // Số thẻ BHYT
  patientAllergies?: string[]; // Tiền sử dị ứng in trên toa
  guardianName?: string; // Họ tên người đưa trẻ đến khám / người nhà
  clinicInfo: ClinicSettings;
  examinationDate: string; // Ngày khám bệnh
  symptoms: string; // Triệu chứng lâm sàng / Lý do đến khám
  vitalSigns?: VitalSigns; // Chỉ số sinh hiệu lúc khám
  diagnosis: string; // Chẩn đoán bệnh
  icd10Code?: string; // Mã bệnh ICD-10
  medications: PrescribedMedication[];
  doctorAdvice: string; // Lời dặn dò của Bác sĩ Diệu
  followUpDate?: string; // Ngày hẹn tái khám
  labOrder?: LabOrder; // Phiếu chỉ định xét nghiệm cận lâm sàng (Trung tâm 548)
  labResultsSummary?: string; // Tóm tắt kết quả xét nghiệm bệnh nhân mang về
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface MedicationCatalogItem {
  id: string;
  name: string;
  activeIngredient?: string;
  strength: string;
  form: string;
  unit: string;
  category: string; // Kháng sinh, Giảm đau, Huyết áp, Dạ dày...
  defaultDosage: MedicationDosage;
  defaultDurationDays: number;
  defaultInstructions: string;
  warningNote?: string;
  expiryDate?: string; // Hạn sử dụng (YYYY-MM-DD)
  stockQuantity?: number; // Số lượng tồn kho hiện tại
  unitPrice?: number; // Đơn giá kê đơn / bán (VNĐ)
  unitCost?: number; // Giá vốn nhập kho (VNĐ)
}

export interface DailySlotSchedule {
  slot: DoseSlot;
  label: string;
  defaultTime: string;
  items: {
    medicationName: string;
    strength?: string;
    doseAmount: number;
    unit: string;
    timing: MealTiming;
    instructions: string;
    warningOrNote?: string;
  }[];
}

export interface PrescriptionTemplateSettings {
  departmentName: string; // Cơ quan chủ quản (VD: SỞ Y TẾ TP. HỒ CHÍ MINH)
  prescriptionTitle: string; // Tiêu đề đơn (VD: ĐƠN THUỐC NGOẠI TRÚ)
  prescriptionSubtitle: string; // Phụ đề đơn (VD: Khám bệnh và kê đơn điều trị ngoại trú)
  showClinicHeader: boolean;
  showPatientAge: boolean;
  showPatientAddress: boolean;
  showPatientPhone: boolean;
  showVitalSigns: boolean; // Chỉ số sinh hiệu (HA, mạch, nhiệt độ, cân nặng...)
  showDiagnosisIcd10: boolean; // Hiện mã bệnh ICD-10
  showMedicationNotes: boolean; // Hiện lưu ý dưới mỗi loại thuốc
  showIntegratedSchedule: boolean; // Bảng lịch nhắc uống thuốc sáng/trưa/chiều/tối
  doctorAdviceTitle: string; // Tiêu đề lời dặn (VD: Lời dặn của Bác Sĩ:)
  defaultDoctorAdvice: string; // Lời dặn mẫu
  showFollowUpDate: boolean; // Ngày hẹn tái khám
  footerNote: string; // Ghi chú chân trang pháp lý
  doctorSignatureTitle: string; // Chức danh ký (VD: BÁC SĨ KHÁM BỆNH)
  doctorSignatureName: string; // Họ tên người ký (VD: BS. Trần Văn Diệu)
  showPatientSignature: boolean; // Ô ký tên người bệnh / người nhà
  showDigitalSignatureStamp: boolean; // Chữ ký nháy / ký điện tử
  fontFamily: 'times' | 'arial' | 'roboto'; // Font in ấn (Mặc định: 'times' - Times New Roman)
  fontSize: '11pt' | '12pt' | '10pt'; // Cỡ chữ in chuẩn (11pt / 12pt)
  lineSpacing: 'compact' | 'normal' | 'relaxed';
  paperSize?: 'A4' | 'A5'; // Khổ giấy in chuẩn A4 hoặc A5
  showPaymentQr?: boolean; // Tùy chọn in mã VietQR thanh toán lên toa thuốc
  showCostSummary?: boolean; // Tùy chọn in bảng tổng tiền thuốc & tiền khám
  // Trang 2: Bảng dán tủ lạnh
  fridgeChartTitle: string;
  fridgeChartSubtitle: string;
  showFridgeSafetyRules: boolean;
  showFridgeEmergencyContact: boolean;
}

export interface ClinicalProtocol {
  id: string;
  name: string; // Tên phác đồ mẫu (VD: Phác đồ Tăng huyết áp nguyên phát)
  category: string; // Tim mạch, Nội tiết, Tiêu hóa, Hô hấp, Khớp, Thần kinh...
  diagnosis: string; // Chẩn đoán bệnh
  icd10Code: string; // Mã ICD-10
  symptoms: string; // Triệu chứng lâm sàng / Lý do đến khám
  doctorAdvice: string; // Lời dặn dò của Bác Sĩ
  followUpDays: number; // Số ngày hẹn tái khám (VD: 30 ngày cho bệnh mạn tính)
  medications: Array<{
    name: string;
    activeIngredient?: string;
    strength: string;
    form: string;
    unit: string;
    morning: number;
    noon: number;
    afternoon: number;
    evening: number;
    timing: MealTiming;
    durationDays: number;
    instructions: string;
    warningOrNote?: string;
  }>;
  isCustom?: boolean; // Do bác sĩ tự tạo và lưu
  createdAt?: string;
}

// ================= PHÂN HỆ CẬN LÂM SÀNG & XÉT NGHIỆM (TRUNG TÂM Y KHOA 548) =================
export type LabTestCategory =
  | 'huyet_hoc'
  | 'sinh_hoa_duong_huyet'
  | 'sinh_hoa_gan_than'
  | 'sinh_hoa_mo_mau'
  | 'nuoc_tieu'
  | 'viem_gan_mien_dich'
  | 'chan_doan_hinh_anh';

export interface LabTestItem {
  id: string; // VD: 'cbc', 'glucose_fasting', 'hba1c', 'sgpt', 'sgot', 'creatinine', 'ecg'...
  name: string; // Tên xét nghiệm (VD: "Định lượng Glucose máu đói")
  category: LabTestCategory;
  shortDesc?: string; // Ghi chú ngắn (VD: "Đo lúc đói > 8h")
  isFastTest?: boolean; // Lấy kết quả nhanh
}

export interface LabCenterReferral {
  id: string;
  name: string; // Tên trung tâm (VD: "TRUNG TÂM CHẨN ĐOÁN Y KHOA 548")
  address: string; // 548 Nguyễn Chí Thanh, P.7, Q.11, TP.HCM
  phone: string; // (028) 3855 5448
  notes?: string; // Lời dặn dò bệnh nhân
}

export interface LabOrderPackage {
  id: string;
  name: string; // Tên gói (VD: "Gói 1: Theo Dõi Đái Tháo Đường & Thận")
  description: string;
  testIds: string[]; // Danh sách test IDs trong gói
}

export interface LabOrder {
  orderCode: string; // Mã phiếu: XN-YYYYMMDD-001
  orderDate: string; // Ngày chỉ định
  referralCenter: LabCenterReferral; // Nơi nhận: Mặc định là Trung Tâm Y Khoa 548
  selectedTestIds: string[]; // Danh sách ID các xét nghiệm được bác sĩ chọn
  clinicalDiagnosis: string; // Chẩn đoán sơ bộ
  doctorNotes?: string; // Lời dặn trước khi đi làm xét nghiệm (VD: "Nhịn ăn sáng...")
  status?: 'ordered' | 'completed' | 'cancelled';
  resultsSummary?: string; // Tóm tắt kết quả xét nghiệm khi bệnh nhân mang về
}
