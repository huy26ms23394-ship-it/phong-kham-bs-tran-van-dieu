import { Prescription, PrescribedMedication } from '../types/medical';

export type PrescriptionTemplateType =
  | 'template-dieu-a5-traditional' // Mẫu 1: Toa Truyền Thống BS. Diệu (A5 Chuẩn Thực Tế - Mặc định)
  | 'template-byt-modern'          // Mẫu 2: Toa Chuẩn Bộ Y Tế Hiện Đại (A5/A4)
  | 'template-reminder-icons'      // Mẫu 3: Toa Kết Hợp Lịch Nhắc Biểu Tượng (Sáng/Trưa/Chiều/Tối)
  | 'template-dieu-overlay';       // Mẫu 4: Chế Độ In Đè Lên Phôi Giấy Có Sẵn (Chỉ in dữ liệu)

export interface PrintCalibrationSettings {
  templateId: PrescriptionTemplateType;
  paperSize: 'A5' | 'A4';
  scalePercent: number; // 90%, 95%, 100%, 105%, 110%
  offsetTopMm: number;  // -15mm -> +15mm
  offsetLeftMm: number; // -15mm -> +15mm
  autoCollapseEmptyLines: boolean; // Co gọn dòng trống nếu kê > 6 thuốc
}

export const DEFAULT_PRINT_CALIBRATION: PrintCalibrationSettings = {
  templateId: 'template-dieu-a5-traditional',
  paperSize: 'A5',
  scalePercent: 100,
  offsetTopMm: 0,
  offsetLeftMm: 0,
  autoCollapseEmptyLines: false,
};

export const PRINT_TEMPLATE_META = [
  {
    id: 'template-dieu-a5-traditional' as PrescriptionTemplateType,
    title: 'Mẫu 1: Toa Truyền Thống BS. Diệu (A5)',
    shortTitle: 'Mẫu 1 - BS. Diệu (A5)',
    subtitle: 'Tái tạo 100% bản gốc toa giấy A5 truyền thống thực tế',
    badge: 'MẶC ĐỊNH MỚI',
    paperDefault: 'A5' as const,
  },
  {
    id: 'template-byt-modern' as PrescriptionTemplateType,
    title: 'Mẫu 2: Toa Chuẩn Bộ Y Tế Hiện Đại (A5/A4)',
    shortTitle: 'Mẫu 2 - Chuẩn BYT',
    subtitle: 'Bố cục bảng biểu khoa học, mã vạch & QR VietQR thanh toán',
    badge: 'BYT 2026',
    paperDefault: 'A5' as const,
  },
  {
    id: 'template-reminder-icons' as PrescriptionTemplateType,
    title: 'Mẫu 3: Toa Kèm Lịch Nhắc Biểu Tượng',
    shortTitle: 'Mẫu 3 - Lịch Biểu Tượng',
    subtitle: 'Bảng nhắc Sáng-Trưa-Chiều-Tối chữ to cho người lớn tuổi',
    badge: 'NGƯỜI CAO TUỔI',
    paperDefault: 'A5' as const,
  },
  {
    id: 'template-dieu-overlay' as PrescriptionTemplateType,
    title: 'Mẫu 4: In Đè Lên Phôi Giấy Có Sẵn',
    shortTitle: 'Mẫu 4 - In Đè Phôi Giấy',
    subtitle: 'Ẩn khung tiêu đề cố định, chỉ in chữ & số vào phôi giấy có sẵn',
    badge: 'CHUYÊN DỤNG',
    paperDefault: 'A5' as const,
  },
];

export const STORAGE_KEY_TEMPLATE_ID = 'mediba_print_template_id';
export const STORAGE_KEY_CALIBRATION = 'mediba_print_calibration';

export function loadSavedTemplateId(): PrescriptionTemplateType {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TEMPLATE_ID);
    if (
      saved === 'template-dieu-a5-traditional' ||
      saved === 'template-byt-modern' ||
      saved === 'template-reminder-icons' ||
      saved === 'template-dieu-overlay'
    ) {
      return saved;
    }
  } catch {}
  return 'template-dieu-a5-traditional';
}

export function saveTemplateId(templateId: PrescriptionTemplateType): void {
  try {
    localStorage.setItem(STORAGE_KEY_TEMPLATE_ID, templateId);
  } catch {}
}

export function loadSavedCalibration(): PrintCalibrationSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CALIBRATION);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_PRINT_CALIBRATION,
        ...parsed,
      };
    }
  } catch {}
  return DEFAULT_PRINT_CALIBRATION;
}

export function saveCalibration(calibration: PrintCalibrationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_CALIBRATION, JSON.stringify(calibration));
  } catch {}
}

/**
 * Thuật toán quy đổi liều dùng từ ma trận Sáng-Trưa-Chiều-Tối sang văn phong truyền thống:
 * "Ngày uống X lần, mỗi lần: Y viên Trước, sau ăn"
 */
export function formatTraditionalDoseSchedule(med: PrescribedMedication): {
  timesPerDay: number;
  perDoseText: string;
  timing: 'truoc_an' | 'sau_an' | 'trong_an' | 'truoc_ngu' | 'khac';
  rawInstruction: string;
} {
  const m = med.dosage?.morning ?? 0;
  const n = med.dosage?.noon ?? 0;
  const a = med.dosage?.afternoon ?? 0;
  const e = med.dosage?.evening ?? 0;

  const activeDoses: { label: string; amount: number }[] = [];
  if (m > 0) activeDoses.push({ label: 'Sáng', amount: m });
  if (n > 0) activeDoses.push({ label: 'Trưa', amount: n });
  if (a > 0) activeDoses.push({ label: 'Chiều', amount: a });
  if (e > 0) activeDoses.push({ label: 'Tối', amount: e });

  const timesPerDay = activeDoses.length;
  let perDoseText = '';

  if (timesPerDay === 0) {
    perDoseText = med.instructions || 'Theo chỉ định của Bác sĩ';
  } else {
    // Kiểm tra xem tất cả các lần uống có cùng lượng viên hay không
    const firstAmount = activeDoses[0].amount;
    const isUniform = activeDoses.every((d) => d.amount === firstAmount);

    if (isUniform) {
      const unit = (med.unit || 'viên').toLowerCase();
      const slotNames = activeDoses.map((d) => d.label).join(' - ');
      perDoseText = `${firstAmount} ${unit} (${slotNames})`;
    } else {
      // Các buổi uống lượng thuốc lệch nhau
      perDoseText = activeDoses.map((d) => `${d.label} ${d.amount}v`).join(', ');
    }
  }

  const timing = (med.dosage?.timing as any) || (med.timing as any) || 'sau_an';

  return {
    timesPerDay,
    perDoseText,
    timing,
    rawInstruction: med.instructions || '',
  };
}

/**
 * Bệnh nhân và đơn thuốc mẫu chuẩn thực tế của BS. Diệu để Bác sĩ in thử (Test Print)
 */
export const SAMPLE_TEST_PRESCRIPTION: Prescription = {
  id: 'rx-sample-dieu-a5',
  prescriptionCode: 'BN-0452',
  patientId: 'patient-sample-an',
  patientName: 'NGUYỄN VĂN AN',
  patientBirthYear: '1961',
  patientGender: 'nam',
  patientPhone: '0903.123.456',
  patientAddress: '124/5 Tùng Thiện Vương, P.11, Q.8, TP.HCM',
  patientAllergies: ['Không có tiền sử dị ứng'],
  diagnosis: 'Tăng huyết áp nguyên phát (I10) - Đái tháo đường Type 2 (E11)',
  examinationDate: new Date().toISOString().slice(0, 10),
  vitalSigns: {
    bloodPressureSystolic: 130,
    bloodPressureDiastolic: 80,
    bloodPressure: '130/80',
    heartRate: 78,
    temperature: 36.8,
    weightKg: 65,
    heightCm: 168,
  },
  doctorAdvice: 'Uống thuốc đều đặn đúng giờ. Ăn nhạt, giảm mỡ đường, tập thể dục nhẹ 20 phút mỗi ngày.',
  followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  symptoms: 'Tái khám định kỳ tăng huyết áp & đái tháo đường',
  clinicInfo: {
    clinicName: 'PHÒNG KHÁM BS. TRẦN VĂN DIỆU',
    doctorName: 'BS. Trần Văn Diệu',
    doctorTitle: 'Bác Sĩ Chuyên Khoa',
    specialty: 'Đa Khoa - Nội Khoa - Tim Mạch',
    licenseNumber: '00362/SYT-GPHĐ',
    address: '293/14, Tùng Thiện Vương - P.11 - Q.8',
    phone: '090.4492423',
    consultingHours: 'Ngày thường: 15h - 19h | CN: 5h30 - 9h',
  },
  doctorName: 'BS. Trần Văn Diệu',
  clinicName: 'PHÒNG KHÁM BS. TRẦN VĂN DIỆU',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  medications: [
    {
      id: 'med-01',
      name: 'Amlor',
      activeIngredient: 'Amlodipine besylate',
      strength: '5mg',
      form: 'Viên nang',
      unit: 'Viên',
      totalQuantity: 30,
      quantity: 30,
      category: 'Tim mạch - Huyết áp',
      dosage: { morning: 1, noon: 0, afternoon: 0, evening: 0, timing: 'sau_an' },
      instructions: 'Uống 1 viên vào buổi sáng sau khi ăn no',
      durationDays: 30,
      warningNote: 'Theo dõi triệu chứng phù mắt cá chân nhẹ',
    },
    {
      id: 'med-02',
      name: 'Glucophage',
      activeIngredient: 'Metformin hydrochloride',
      strength: '850mg',
      form: 'Viên nén bao phim',
      unit: 'Viên',
      totalQuantity: 60,
      quantity: 60,
      category: 'Đái tháo đường',
      dosage: { morning: 1, noon: 0, afternoon: 0, evening: 1, timing: 'sau_an' },
      instructions: 'Uống 1 viên sáng, 1 viên tối sau ăn chính',
      durationDays: 30,
      warningNote: 'Uống trong hoặc ngay sau bữa ăn để giảm kích ứng dạ dày',
    },
    {
      id: 'med-03',
      name: 'Nexium',
      activeIngredient: 'Esomeprazole',
      strength: '40mg',
      form: 'Viên nén kháng acid',
      unit: 'Viên',
      totalQuantity: 30,
      quantity: 30,
      category: 'Dạ dày - Tiêu hóa',
      dosage: { morning: 1, noon: 0, afternoon: 0, evening: 0, timing: 'truoc_an' },
      instructions: 'Uống 1 viên trước ăn sáng 30 phút. Nuốt nguyên viên',
      durationDays: 30,
      warningNote: 'Không bẻ, nhai hoặc nghiền viên thuốc',
    },
    {
      id: 'med-04',
      name: 'Tanakan',
      activeIngredient: 'Ginkgo biloba extract',
      strength: '40mg',
      form: 'Viên nén bao phim',
      unit: 'Viên',
      totalQuantity: 60,
      quantity: 60,
      category: 'Tuần hoàn não',
      dosage: { morning: 1, noon: 0, afternoon: 0, evening: 1, timing: 'sau_an' },
      instructions: 'Uống 1 viên sáng, 1 viên tối sau ăn',
      durationDays: 30,
    },
  ],
};
