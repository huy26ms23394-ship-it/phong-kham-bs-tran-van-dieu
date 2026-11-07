import {
  DailySlotSchedule,
  DoseSlot,
  MealTiming,
  MedicationDosage,
  Patient,
  Prescription,
} from '../types/medical';

export const MEAL_TIMING_LABELS: Record<MealTiming, string> = {
  truoc_an: 'Trước khi ăn (30 phút)',
  sau_an: 'Sau khi ăn no (15-30 phút)',
  trong_an: 'Uống ngay trong bữa ăn',
  truoc_ngu: 'Trước khi đi ngủ',
  khi_can: 'Uống khi cần (cơn đau/sốt)',
};

export const SLOT_INFO: Record<
  DoseSlot,
  { label: string; defaultTime: string; description: string }
> = {
  morning: {
    label: 'Buổi Sáng',
    defaultTime: '07:00',
    description: 'Khoảng 06:30 - 08:00 sáng',
  },
  noon: {
    label: 'Buổi Trưa',
    defaultTime: '11:30',
    description: 'Khoảng 11:30 - 12:30 trưa',
  },
  afternoon: {
    label: 'Buổi Chiều',
    defaultTime: '17:30',
    description: 'Khoảng 17:00 - 18:30 chiều',
  },
  evening: {
    label: 'Buổi Tối',
    defaultTime: '20:30',
    description: 'Khoảng 20:00 - 21:30 tối',
  },
};

export function formatMealTiming(timing: MealTiming, customNote?: string): string {
  if (customNote && customNote.trim()) {
    return `${MEAL_TIMING_LABELS[timing] || timing} (${customNote.trim()})`;
  }
  return MEAL_TIMING_LABELS[timing] || 'Theo chỉ dẫn của bác sĩ';
}

export function formatDosageSummary(dosage: MedicationDosage, unit: string = 'viên'): string {
  const parts: string[] = [];
  if (dosage.morning > 0) parts.push(`Sáng ${dosage.morning} ${unit}`);
  if (dosage.noon > 0) parts.push(`Trưa ${dosage.noon} ${unit}`);
  if (dosage.afternoon > 0) parts.push(`Chiều ${dosage.afternoon} ${unit}`);
  if (dosage.evening > 0) parts.push(`Tối ${dosage.evening} ${unit}`);

  if (parts.length === 0) {
    return `Uống khi cần thiết (${formatMealTiming(dosage.timing, dosage.customTimingNote)})`;
  }

  const timingText = formatMealTiming(dosage.timing, dosage.customTimingNote);
  return `${parts.join(', ')} - ${timingText}`;
}

export function calculateMedicationTotalQuantity(
  dosage: MedicationDosage,
  durationDays: number
): number {
  const dailyTotal =
    (dosage.morning || 0) +
    (dosage.noon || 0) +
    (dosage.afternoon || 0) +
    (dosage.evening || 0);
  if (dailyTotal <= 0) return 1;
  return Math.ceil(dailyTotal * Math.max(1, durationDays));
}

/**
 * Chuẩn Thông tư 52/2017/TT-BYT (Điều 6 Khoản 4):
 * Số lượng thuốc chỉ có một chữ số (nhỏ hơn 10) thì viết số 0 phía trước (VD: 05 viên).
 */
export function formatPrescriptionQuantity(quantity: number): string {
  const n = Number(quantity) || 0;
  if (n > 0 && n < 10 && Number.isInteger(n)) {
    return `0${n}`;
  }
  return String(n);
}

/**
 * Chuẩn hóa viết hoa chữ cái đầu Họ và Tên tiếng Việt (VD: "nguyễn văn an" -> "Nguyễn Văn An")
 */
export function formatVietnameseFullName(raw: string): string {
  if (!raw) return '';
  return String(raw)
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Kiểm tra cảnh báo tương kỵ dị ứng chéo giữa thuốc kê và tiền sử dị ứng của bệnh nhân
 */
export function checkMedicationAllergyWarning(
  med: { name: string; activeIngredient?: string },
  allergies?: string[]
): string | null {
  if (!allergies || allergies.length === 0) return null;
  const activeAllergies = allergies.filter(
    (a) => a && !a.toLowerCase().includes('không có') && !a.toLowerCase().includes('chưa ghi nhận')
  );
  if (activeAllergies.length === 0) return null;

  const medText = `${med.name || ''} ${med.activeIngredient || ''}`.toLowerCase();
  const allergyText = activeAllergies.join(', ').toLowerCase();

  // 1. Nhóm Penicillin / Beta-lactam
  if (
    allergyText.includes('penicillin') ||
    allergyText.includes('amoxicillin') ||
    allergyText.includes('augmentin') ||
    allergyText.includes('kháng sinh họ beta')
  ) {
    if (
      medText.includes('amoxicillin') ||
      medText.includes('augmentin') ||
      medText.includes('klamentin') ||
      medText.includes('ampicillin') ||
      medText.includes('penicillin')
    ) {
      return `CẢNH BÁO DỊ ỨNG NGHIÊM TRỌNG: Thuốc chứa nhóm Penicillin/Amoxicillin trùng tiền sử dị ứng (${activeAllergies.join(', ')})!`;
    }
    if (medText.includes('cefuroxim') || medText.includes('cephalosporin') || medText.includes('cefixim') || medText.includes('zinnat')) {
      return `THẬN TRỌNG PHẢN ỨNG CHÉO: Bệnh nhân dị ứng Penicillin, lưu ý nguy cơ dị ứng chéo (~5-10%) với nhóm Cephalosporin!`;
    }
  }

  // 2. Nhóm NSAID / Aspirin
  if (
    allergyText.includes('aspirin') ||
    allergyText.includes('nsaid') ||
    allergyText.includes('ibuprofen') ||
    allergyText.includes('diclofenac') ||
    allergyText.includes('meloxicam') ||
    allergyText.includes('celecoxib')
  ) {
    if (
      medText.includes('aspirin') ||
      medText.includes('acetylsalicylic') ||
      medText.includes('celebrex') ||
      medText.includes('celecoxib') ||
      medText.includes('meloxicam') ||
      medText.includes('mobic') ||
      medText.includes('ibuprofen') ||
      medText.includes('diclofenac')
    ) {
      return `CẢNH BÁO DỊ ỨNG: Thuốc thuộc nhóm kháng viêm NSAID/Aspirin trùng với tiền sử dị ứng (${activeAllergies.join(', ')})!`;
    }
  }

  // 3. Nhóm Paracetamol / Acetaminophen
  if (allergyText.includes('paracetamol') || allergyText.includes('acetaminophen') || allergyText.includes('panadol')) {
    if (
      medText.includes('paracetamol') ||
      medText.includes('acetaminophen') ||
      medText.includes('panadol') ||
      medText.includes('efferalgan') ||
      medText.includes('hapacol') ||
      medText.includes('ultracet')
    ) {
      return `CẢNH BÁO DỊ ỨNG: Thuốc có chứa Paracetamol trùng tiền sử dị ứng (${activeAllergies.join(', ')})!`;
    }
  }

  // 4. Đối chiếu từ khóa trực tiếp
  for (const a of activeAllergies) {
    const tokens = a
      .toLowerCase()
      .replace(/dị ứng|nổi mẩn|ngứa|phù|sốc|thuốc/g, '')
      .split(/[,()/+-]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 4);
    for (const token of tokens) {
      if (medText.includes(token)) {
        return `CẢNH BÁO DỊ ỨNG: Phát hiện thành phần "${token}" trùng với tiền sử dị ứng (${a})!`;
      }
    }
  }

  return null;
}

export function calculateDailyDoseSlots(prescription: Prescription): DailySlotSchedule[] {
  const slots: DoseSlot[] = ['morning', 'noon', 'afternoon', 'evening'];

  return slots.map((slot) => {
    const slotInfo = SLOT_INFO[slot];
    const items = prescription.medications
      .filter((med) => (med.dosage[slot] || 0) > 0)
      .map((med) => ({
        medicationName: med.name,
        strength: med.strength,
        doseAmount: med.dosage[slot],
        unit: med.unit || 'viên',
        timing: med.dosage.timing,
        instructions: med.instructions || formatDosageSummary(med.dosage, med.unit),
        warningOrNote: med.warningOrNote,
      }));

    return {
      slot,
      label: slotInfo.label,
      defaultTime: slotInfo.defaultTime,
      items,
    };
  });
}

export function generatePrescriptionCode(existingCount = 0): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const index = String(existingCount + 1).padStart(3, '0');
  return `TOA-${year}${month}${day}-${index}`;
}

export function generatePatientCode(existingCount = 0): string {
  const year = new Date().getFullYear();
  const index = String(existingCount + 1).padStart(3, '0');
  return `BN-${year}-${index}`;
}

export function validatePatientForm(patient: Partial<Patient>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!patient.fullName || !patient.fullName.trim()) {
    errors.fullName = 'Họ và tên bệnh nhân không được để trống';
  }

  if (!patient.birthYear) {
    errors.birthYear = 'Năm sinh không được để trống';
  } else {
    const year = Number(patient.birthYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear) {
      errors.birthYear = `Năm sinh không hợp lệ (1900 - ${currentYear})`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePrescriptionForm(prescription: Partial<Prescription>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!prescription.patientId) {
    errors.patientId = 'Vui lòng chọn bệnh nhân';
  }

  if (!prescription.diagnosis || !prescription.diagnosis.trim()) {
    errors.diagnosis = 'Chẩn đoán bệnh không được để trống';
  }

  if (!prescription.examinationDate) {
    errors.examinationDate = 'Ngày khám không được để trống';
  }

  if (!prescription.medications || prescription.medications.length === 0) {
    errors.medications = 'Toa thuốc cần có ít nhất 1 loại thuốc';
  } else {
    const hasInvalidMed = prescription.medications.some(
      (m) => !m.name || !m.name.trim() || (m.totalQuantity || 0) <= 0
    );
    if (hasInvalidMed) {
      errors.medications = 'Vui lòng điền đủ tên thuốc và số lượng cho các thuốc';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
