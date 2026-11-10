import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Patient,
  Prescription,
  PrescribedMedication,
  ClinicSettings,
  MealTiming,
  MedicationCatalogItem,
  ClinicalProtocol,
  LabOrder,
  LabCenterReferral,
  LabTestItem,
} from '../types/medical';
import {
  calculateMedicationTotalQuantity,
  generatePrescriptionCode,
  generatePatientCode,
  validatePrescriptionForm,
  MEAL_TIMING_LABELS,
  checkMedicationAllergyWarning,
  formatVietnameseFullName,
} from '../utils/medicationSchedule';
import { ClinicLayoutMode } from '../types/theme';
import { useSmartPagination } from '../hooks/useSmartPagination';
import { ClinicPaginationBar } from './ClinicPaginationBar';
import { matchesVietnameseSearch } from '../utils/vietnameseSearch';
import { CLINIC_MEDICATION_CATALOG } from '../data/initialData';
import { INITIAL_CLINICAL_PROTOCOLS } from '../data/clinicalProtocols';
import {
  LAB_TEST_CATALOG,
  LAB_ORDER_PACKAGES,
  DEFAULT_LAB_CENTERS,
  LAB_TEST_CATEGORIES,
} from '../data/labTestCatalog';
import {
  Stethoscope,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ShieldAlert,
  Activity,
  Printer,
  Save,
  UserPlus,
  Search,
  Eye,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  X,
  Keyboard,
  Check,
  CheckCircle2,
  Globe,
  RotateCcw,
  Edit3,
  Clock,
  TrendingUp,
  QrCode,
  BookmarkPlus,
  Layers,
  FlaskConical,
  Building2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CheckSquare,
  Square,
} from 'lucide-react';
import { PrescriptionReviewModal } from './PrescriptionReviewModal';
import { getGoogleSearchUrl } from './PharmacyCatalogModal';
import { DrugDetailPopover } from './DrugDetailPopover';
import { PatientTrendChartModal } from './PatientTrendChartModal';
import { BankQrModal } from './BankQrModal';
import { runComprehensiveLocalSafetyCheck, ClinicalRuleAlert } from '../utils/clinicalRules';

interface ConsultationFormProps {
  patients: Patient[];
  selectedPatientId?: string;
  clinicInfo: ClinicSettings;
  onUpdateClinicSettings?: (settings: ClinicSettings) => void;
  catalog?: MedicationCatalogItem[];
  prescriptions?: Prescription[];
  presetPrescription?: Prescription | null;
  onClearPresetPrescription?: () => void;
  onSavePrescription: (prescription: Prescription, shouldPrintImmediately?: boolean) => void;
  onOpenNewPatientModal: () => void;
  onQuickSavePatient?: (patient: Patient) => void;
  onEditPatient?: (patient: Patient) => void;
  onDraftChange?: (draft: {
    patient?: Patient;
    diagnosis: string;
    symptoms: string;
    medications: PrescribedMedication[];
    vitals: { bloodPressure: string; pulse: number; weight: number; height: number };
  }) => void;
  layoutMode?: ClinicLayoutMode;
}

const COMMON_DIAGNOSES = [
  { label: 'Tăng huyết áp nguyên phát', icd: 'I10' },
  { label: 'Đái tháo đường Type 2', icd: 'E11' },
  { label: 'Rối loạn lipid máu hỗn hợp', icd: 'E78' },
  { label: 'Viêm dạ dày - tá tràng / GERD', icd: 'K29, K21' },
  { label: 'Viêm họng - thanh quản cấp', icd: 'J02, J04' },
  { label: 'Viêm phế quản cấp', icd: 'J20' },
  { label: 'Hội chứng tiền đình / Thiểu năng tuần hoàn não', icd: 'H81, G45' },
  { label: 'Thoái hóa khớp gối / Cột sống', icd: 'M17, M47' },
];

export const ConsultationForm: React.FC<ConsultationFormProps> = ({
  patients,
  selectedPatientId,
  clinicInfo,
  onUpdateClinicSettings,
  catalog = CLINIC_MEDICATION_CATALOG,
  prescriptions = [],
  presetPrescription,
  onClearPresetPrescription,
  onSavePrescription,
  onOpenNewPatientModal,
  onQuickSavePatient,
  onEditPatient,
  onDraftChange,
  layoutMode = 'standard',
}) => {
  const isFocusMode = layoutMode === 'focus-prescribing';
  const isCompactMode = layoutMode === 'compact-pro';
  const [isPharmacyDrawerOpen, setIsPharmacyDrawerOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [patientId, setPatientId] = useState<string>(
    selectedPatientId || patients[0]?.id || ''
  );
  const [patientSearch, setPatientSearch] = useState('');
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');

  // Quick Inline Patient Entry state
  const [showQuickPatientForm, setShowQuickPatientForm] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickAge, setQuickAge] = useState('50');
  const [quickBirthYear, setQuickBirthYear] = useState(String(currentYear - 50));
  const [quickGender, setQuickGender] = useState<'nam' | 'nu'>('nam');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickAllergy, setQuickAllergy] = useState('');

  const [examinationDate, setExaminationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [icd10Code, setIcd10Code] = useState('');

  // Vital Signs
  const [bpSystolic, setBpSystolic] = useState('130');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [heartRate, setHeartRate] = useState('75');
  const [temperature, setTemperature] = useState('36.8');
  const [weightKg, setWeightKg] = useState('65');

  // Prescribed Medications
  const [medications, setMedications] = useState<PrescribedMedication[]>([]);
  const [doctorAdvice, setDoctorAdvice] = useState(
    'Uống thuốc đầy đủ đúng giờ theo hướng dẫn, ăn nhạt, kiêng mỡ và đường, uống đủ 2 lít nước mỗi ngày. Tái khám đúng hẹn.'
  );
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [catalogFilter, setCatalogFilter] = useState('all');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [draftPrescription, setDraftPrescription] = useState<Prescription | null>(null);

  // Keyboard Navigation Refs & State
  const patientSearchInputRef = useRef<HTMLInputElement>(null);
  const catalogSearchInputRef = useRef<HTMLInputElement>(null);
  const diagnosisInputRef = useRef<HTMLInputElement>(null);
  const catalogListRef = useRef<HTMLDivElement>(null);

  const [catalogSelectedIndex, setCatalogSelectedIndex] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hovered drug popover state
  const [hoveredDrug, setHoveredDrug] = useState<{
    item: MedicationCatalogItem;
    rect: DOMRect;
  } | null>(null);
  const drugHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDrugMouseEnter = (item: MedicationCatalogItem, e: React.MouseEvent<HTMLElement>) => {
    if (drugHoverTimeoutRef.current) {
      clearTimeout(drugHoverTimeoutRef.current);
      drugHoverTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDrug({ item, rect });
  };

  const handleDrugMouseLeave = () => {
    if (drugHoverTimeoutRef.current) {
      clearTimeout(drugHoverTimeoutRef.current);
    }
    drugHoverTimeoutRef.current = setTimeout(() => {
      setHoveredDrug(null);
    }, 260);
  };

  const handlePopoverMouseEnter = () => {
    if (drugHoverTimeoutRef.current) {
      clearTimeout(drugHoverTimeoutRef.current);
      drugHoverTimeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    if (drugHoverTimeoutRef.current) {
      clearTimeout(drugHoverTimeoutRef.current);
    }
    drugHoverTimeoutRef.current = setTimeout(() => {
      setHoveredDrug(null);
    }, 260);
  };

  // Sync patientId whenever selectedPatientId prop changes
  useEffect(() => {
    if (selectedPatientId) {
      setPatientId(selectedPatientId);
    }
  }, [selectedPatientId]);

  const selectedPatient =
    patients.find((p) => p.id === patientId) || patients[0];

  // Comprehensive Clinical Safety Check (Offline 0ms, Zero-latency)
  const [showSafetyAlertDetails, setShowSafetyAlertDetails] = useState(false);
  const safetyAlerts = React.useMemo(() => {
    return runComprehensiveLocalSafetyCheck({
      medications: medications.map((m) => ({ name: m.name, activeIngredient: m.activeIngredient })),
      chronicConditions: selectedPatient?.chronicConditions || [],
      vitals: {
        bloodPressureSystolic: bpSystolic,
        bloodPressureDiastolic: bpDiastolic,
        heartRate: heartRate,
        temperature: temperature,
      },
    });
  }, [medications, selectedPatient, bpSystolic, bpDiastolic, heartRate, temperature]);

  // Modals: Trend Chart & Bank QR Modal
  const [isTrendModalOpen, setIsTrendModalOpen] = useState(false);
  const [isBankQrModalOpen, setIsBankQrModalOpen] = useState(false);

  // Ghi Chú Xét Nghiệm & Cận Lâm Sàng (VD: Trung Tâm 548 / Medic)
  const [hasLabReferral, setHasLabReferral] = useState<boolean>(false);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [selectedLabCenter, setSelectedLabCenter] = useState<LabCenterReferral>(DEFAULT_LAB_CENTERS[0]);
  const [labDoctorNotes, setLabDoctorNotes] = useState<string>('');
  const [labResultsSummary, setLabResultsSummary] = useState<string>('');

  const handleToggleLabTest = (testId: string) => {
    setSelectedLabTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const handleApplyLabPackage = (testIds: string[]) => {
    setSelectedLabTests((prev) => {
      const allPresent = testIds.every((id) => prev.includes(id));
      if (allPresent) {
        return prev.filter((id) => !testIds.includes(id));
      }
      return Array.from(new Set([...prev, ...testIds]));
    });
  };

  // Clinical Protocols (1-Click Prescribing)
  const [protocols, setProtocols] = useState<ClinicalProtocol[]>(() => {
    try {
      const saved = localStorage.getItem('mediba_custom_protocols_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...INITIAL_CLINICAL_PROTOCOLS];
        }
      }
    } catch {}
    return INITIAL_CLINICAL_PROTOCOLS;
  });

  const handleApplyProtocol = (proto: ClinicalProtocol) => {
    setDiagnosis(proto.diagnosis);
    setIcd10Code(proto.icd10Code);
    if (proto.symptoms && !symptoms) setSymptoms(proto.symptoms);
    if (proto.doctorAdvice) setDoctorAdvice(proto.doctorAdvice);
    if (proto.followUpDays) {
      const d = new Date();
      d.setDate(d.getDate() + proto.followUpDays);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setFollowUpDate(`${y}-${m}-${day}`);
    }

    const newMeds: PrescribedMedication[] = proto.medications.map((m) => {
      const durationDays = m.durationDays || 7;
      const dosage = {
        morning: m.morning,
        noon: m.noon,
        afternoon: m.afternoon,
        evening: m.evening,
        timing: m.timing,
      };
      const totalQuantity = calculateMedicationTotalQuantity(dosage, durationDays);
      return {
        id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: m.name,
        activeIngredient: m.activeIngredient || '',
        strength: m.strength || '',
        form: m.form || 'Viên nén',
        unit: m.unit || 'viên',
        totalQuantity,
        dosage,
        durationDays,
        instructions: m.instructions || '',
        warningOrNote: m.warningOrNote || '',
      };
    });

    setMedications(newMeds);
    setToastMessage(`Đã nạp phác đồ "${proto.name}" (${newMeds.length} thuốc)`);
  };

  const handleSaveCurrentAsProtocol = () => {
    if (medications.length === 0) {
      alert('Vui lòng kê ít nhất 1 loại thuốc trước khi lưu thành phác đồ mẫu.');
      return;
    }
    const protoName = prompt('Nhập tên phác đồ mẫu mới:', diagnosis || 'Phác đồ điều trị mới');
    if (!protoName || !protoName.trim()) return;

    const newProto: ClinicalProtocol = {
      id: `proto-custom-${Date.now()}`,
      name: protoName.trim(),
      category: 'Phác đồ Bác Sĩ Diệu',
      diagnosis: diagnosis.trim() || 'Chưa đặt chẩn đoán',
      icd10Code: icd10Code.trim() || '',
      symptoms: symptoms.trim() || '',
      doctorAdvice: doctorAdvice.trim() || '',
      followUpDays: 14,
      isCustom: true,
      createdAt: new Date().toISOString(),
      medications: medications.map((m) => ({
        name: m.name,
        activeIngredient: m.activeIngredient,
        strength: m.strength || '',
        form: m.form,
        unit: m.unit,
        morning: m.dosage.morning,
        noon: m.dosage.noon,
        afternoon: m.dosage.afternoon,
        evening: m.dosage.evening,
        timing: m.dosage.timing,
        durationDays: m.durationDays,
        instructions: m.instructions,
        warningOrNote: m.warningOrNote,
      })),
    };

    const updated = [newProto, ...protocols];
    setProtocols(updated);
    try {
      const customOnly = updated.filter((p) => p.isCustom);
      localStorage.setItem('mediba_custom_protocols_v1', JSON.stringify(customOnly));
    } catch {}
    setToastMessage(`Đã lưu phác đồ mẫu "${newProto.name}" thành công!`);
  };

  // Latest prescription for the currently selected patient (for 1-click follow-up reload)
  const latestPatientPrescription = prescriptions.find(
    (rx) => rx.patientId === selectedPatient?.id
  );

  const loadPrescriptionIntoForm = (rx: Prescription, label = 'Đã nạp lại đơn thuốc') => {
    setPatientId(rx.patientId);
    setSymptoms(rx.symptoms || '');
    setDiagnosis(rx.diagnosis || '');
    setIcd10Code(rx.icd10Code || '');
    if (rx.vitalSigns) {
      if (rx.vitalSigns.bloodPressureSystolic) setBpSystolic(String(rx.vitalSigns.bloodPressureSystolic));
      if (rx.vitalSigns.bloodPressureDiastolic) setBpDiastolic(String(rx.vitalSigns.bloodPressureDiastolic));
      if (rx.vitalSigns.heartRate) setHeartRate(String(rx.vitalSigns.heartRate));
      if (rx.vitalSigns.temperature) setTemperature(String(rx.vitalSigns.temperature));
      if (rx.vitalSigns.weightKg) setWeightKg(String(rx.vitalSigns.weightKg));
    }
    setMedications(
      rx.medications.map((m) => ({
        ...m,
        id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        dosage: { ...m.dosage },
      }))
    );
    if (rx.doctorAdvice) setDoctorAdvice(rx.doctorAdvice);
    if (rx.labOrder) {
      setHasLabReferral(true);
      setSelectedLabTests(rx.labOrder.selectedTestIds || []);
      if (rx.labOrder.referralCenter) setSelectedLabCenter(rx.labOrder.referralCenter);
      if (rx.labOrder.doctorNotes) setLabDoctorNotes(rx.labOrder.doctorNotes);
    } else {
      setSelectedLabTests([]);
    }
    if (rx.labResultsSummary || rx.labOrder?.resultsSummary) {
      setHasLabReferral(true);
      setLabResultsSummary(rx.labResultsSummary || rx.labOrder?.resultsSummary || '');
    } else {
      setLabResultsSummary('');
    }
    setToastMessage(`${label}: ${rx.prescriptionCode} (${rx.medications.length} thuốc)`);
  };

  // Load presetPrescription when triggered from PrescriptionList ("Kê Lại / Sửa")
  useEffect(() => {
    if (presetPrescription) {
      loadPrescriptionIntoForm(presetPrescription, 'Đã nạp đơn để kê lại / chỉnh sửa');
      onClearPresetPrescription?.();
    }
  }, [presetPrescription]);

  // Notify parent App of draft state so ClinicalAiModal gets live consultation data
  useEffect(() => {
    onDraftChange?.({
      patient: selectedPatient,
      diagnosis,
      symptoms,
      medications,
      vitals: {
        bloodPressure: `${bpSystolic || 120}/${bpDiastolic || 80}`,
        pulse: Number(heartRate) || 75,
        weight: Number(weightKg) || 65,
        height: 165,
      },
    });
  }, [selectedPatient, diagnosis, symptoms, medications, bpSystolic, bpDiastolic, heartRate, weightKg]);

  const handleQuickCreatePatient = () => {
    const cleanName = formatVietnameseFullName(quickName);
    if (!cleanName) {
      alert('Vui lòng nhập họ và tên bệnh nhân.');
      return;
    }
    const nowStr = new Date().toISOString().split('T')[0];
    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      patientCode: generatePatientCode(patients.length),
      fullName: cleanName,
      birthYear: Number(quickBirthYear) || currentYear - 50,
      gender: quickGender,
      phone: quickPhone.trim(),
      address: '',
      allergies: quickAllergy.trim()
        ? quickAllergy
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : ['Không có tiền sử dị ứng thuốc'],
      chronicConditions: [],
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    onQuickSavePatient?.(newPatient);
    setPatientId(newPatient.id);
    setQuickName('');
    setQuickPhone('');
    setQuickAllergy('');
    setShowQuickPatientForm(false);
    setPatientSearch('');
    setToastMessage(`Đã tạo nhanh & chọn BN: ${newPatient.fullName} (${newPatient.patientCode})`);
  };

  const handleSetAllDurationDays = (days: number) => {
    if (medications.length === 0) return;
    setMedications((prev) =>
      prev.map((m) => ({
        ...m,
        durationDays: days,
        totalQuantity: calculateMedicationTotalQuantity(m.dosage, days),
      }))
    );
    const nextFollowUp = new Date(Date.now() + days * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0];
    setFollowUpDate(nextFollowUp);
    setToastMessage(`Đã đặt toàn bộ đơn thuốc: ${days} ngày uống (Tái khám: ${nextFollowUp})`);
  };

  const handleAddFromCatalog = (item: MedicationCatalogItem) => {
    const existingIndex = medications.findIndex(
      (m) => m.name.toLowerCase() === item.name.toLowerCase() && m.strength === item.strength
    );
    if (existingIndex !== -1) {
      setToastMessage(`Thuốc "${item.name}" đã có trong đơn (Dòng số ${existingIndex + 1})`);
      return;
    }

    const allergyWarn = checkMedicationAllergyWarning(
      { name: item.name, activeIngredient: item.activeIngredient },
      selectedPatient?.allergies
    );

    const newMed: PrescribedMedication = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: item.name,
      activeIngredient: item.activeIngredient,
      strength: item.strength,
      form: item.form,
      unit: item.unit,
      totalQuantity: calculateMedicationTotalQuantity(
        item.defaultDosage,
        item.defaultDurationDays
      ),
      dosage: { ...item.defaultDosage },
      durationDays: item.defaultDurationDays,
      instructions: item.defaultInstructions,
      warningOrNote: item.warningNote,
    };
    setMedications((prev) => [...prev, newMed]);
    if (allergyWarn) {
      setToastMessage(`⚠️ CẢNH BÁO DỊ ỨNG: ${allergyWarn}`);
    } else {
      setToastMessage(`Đã thêm vào đơn: ${item.name} (${item.strength || item.form})`);
    }
  };

  const handleAddNewCustomMed = () => {
    const newMed: PrescribedMedication = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      strength: '500mg',
      form: 'Viên nén',
      unit: 'viên',
      totalQuantity: 20,
      dosage: {
        morning: 1,
        noon: 0,
        afternoon: 0,
        evening: 1,
        timing: 'sau_an',
      },
      durationDays: 10,
      instructions: 'Uống sáng 1 viên, tối 1 viên sau ăn',
    };
    setMedications([...medications, newMed]);
  };

  const handleUpdateDosage = (
    index: number,
    slot: 'morning' | 'noon' | 'afternoon' | 'evening',
    count: number
  ) => {
    const updated = [...medications];
    const newDosage = { ...updated[index].dosage, [slot]: Math.max(0, count) };
    updated[index].dosage = newDosage;
    updated[index].totalQuantity = calculateMedicationTotalQuantity(
      newDosage,
      updated[index].durationDays || 7
    );
    setMedications(updated);
  };

  const handleUpdateMed = (
    index: number,
    field: keyof PrescribedMedication,
    value: unknown
  ) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'durationDays') {
      const days = Number(value) || 1;
      updated[index].totalQuantity = calculateMedicationTotalQuantity(
        updated[index].dosage,
        days
      );
    }
    setMedications(updated);
  };

  const handleRemoveMed = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSelectQuickDiagnosis = (item: { label: string; icd: string }) => {
    if (!diagnosis.includes(item.label)) {
      setDiagnosis(diagnosis ? `${diagnosis}; ${item.label}` : item.label);
      setIcd10Code(icd10Code ? `${icd10Code}, ${item.icd}` : item.icd);
    }
    if (errors.diagnosis) {
      setErrors({ ...errors, diagnosis: '' });
    }
  };

  const buildPrescriptionObject = (idPrefix: string): Prescription => {
    // Tự động fallback sang bệnh nhân đầu tiên hoặc hồ sơ mẫu nếu chưa chọn cụ thể
    const patientObj = selectedPatient || patients[0] || {
      id: 'patient-temp',
      fullName: 'BỆNH NHÂN KHÁM BỆNH (BẢN XEM TRƯỚC)',
      birthYear: 1980,
      gender: 'nam' as const,
      phone: '0900 000 000',
      address: 'TP. Hồ Chí Minh',
      medicalHistory: [],
      chronicConditions: [],
      allergies: [],
    };

    return {
      id: `${idPrefix}-${Date.now()}`,
      prescriptionCode: generatePrescriptionCode(),
      patientId: patientObj.id,
      patientName: patientObj.fullName || 'Bệnh nhân khám bệnh',
      patientBirthYear: patientObj.birthYear || 1980,
      patientGender: patientObj.gender || 'nam',
      patientAddress: patientObj.address || 'TP. Hồ Chí Minh',
      patientPhone: patientObj.phone || '',
      patientHealthInsuranceNumber: patientObj.healthInsuranceNumber,
      patientAllergies: patientObj.allergies,
      guardianName: patientObj.emergencyContactName
        ? `${patientObj.emergencyContactName}${
            patientObj.emergencyContactPhone
              ? ` (${patientObj.emergencyContactPhone})`
              : ''
          }`
        : undefined,
      clinicInfo,
      examinationDate: examinationDate || new Date().toISOString().split('T')[0],
      symptoms: symptoms.trim() || 'Khám nội khoa tổng quát định kỳ',
      vitalSigns: {
        bloodPressureSystolic: bpSystolic ? Number(bpSystolic) : undefined,
        bloodPressureDiastolic: bpDiastolic ? Number(bpDiastolic) : undefined,
        heartRate: heartRate ? Number(heartRate) : undefined,
        temperature: temperature ? Number(temperature) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
      },
      diagnosis: diagnosis.trim() || 'Khám nội khoa tổng quát (Bản xem trước)',
      icd10Code: icd10Code.trim() || 'Z00.0',
      medications: medications || [],
      doctorAdvice: doctorAdvice.trim() || 'Uống thuốc đầy đủ đúng giờ theo hướng dẫn, ăn nhạt, kiêng mỡ và đường. Tái khám đúng hẹn.',
      followUpDate,
      labOrder: (selectedLabTests.length > 0 || labDoctorNotes.trim() || labResultsSummary.trim()) ? {
        orderCode: `XN-${String(examinationDate || new Date().toISOString().split('T')[0]).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
        orderDate: examinationDate || new Date().toISOString().split('T')[0],
        referralCenter: selectedLabCenter,
        selectedTestIds: selectedLabTests,
        clinicalDiagnosis: diagnosis.trim() || 'Khám nội khoa tổng quát',
        doctorNotes: labDoctorNotes.trim() || undefined,
        status: 'ordered',
        resultsSummary: labResultsSummary.trim() || undefined,
      } : undefined,
      labResultsSummary: labResultsSummary.trim() || undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Mở Pop-up xem trước toa thuốc ngay lập tức (không chặn bởi validation)
  const handleOpenReview = () => {
    const draftRx = buildPrescriptionObject('rx-draft');
    setDraftPrescription(draftRx);
    setIsReviewModalOpen(true);
    setToastMessage('Đã mở pop-up xem trước toa thuốc (A4/A5 & Lịch uống)');
  };

  const handleSubmit = (shouldPrint: boolean) => {
    if (!selectedPatient) {
      alert('Vui lòng chọn hoặc thêm bệnh nhân trước khi lưu đơn thuốc.');
      return;
    }

    const partialRx: Partial<Prescription> = {
      patientId: selectedPatient.id,
      diagnosis,
      examinationDate,
      medications,
    };

    const validation = validatePrescriptionForm(partialRx);
    if (!validation.valid) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      alert(`Chưa thể lưu đơn thuốc:\n- ${firstError}`);
      return;
    }

    const newPrescription = buildPrescriptionObject('rx');
    onSavePrescription(newPrescription, shouldPrint);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch) ||
      p.patientCode.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const categories = useMemo<string[]>(
    () => ['all', ...Array.from(new Set(catalog.map((m) => m.category)))],
    [catalog]
  );

  const filteredCatalog = useMemo<MedicationCatalogItem[]>(() => {
    return catalog.filter((m) => {
      const matchesCategory = catalogFilter === 'all' || m.category === catalogFilter;
      const targetText = `${m.name} ${m.activeIngredient || ''} ${m.category}`;
      const matchesSearch = matchesVietnameseSearch(targetText, catalogSearchTerm);
      return matchesCategory && matchesSearch;
    });
  }, [catalog, catalogFilter, catalogSearchTerm]);

  const catalogPagination = useSmartPagination<MedicationCatalogItem>({
    items: filteredCatalog,
    initialPageSize: 15,
    resetDependencies: [catalogSearchTerm, catalogFilter],
  });

  // Keyboard navigation & events with multi-page support
  const handleCatalogKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCatalogSelectedIndex((prev) => {
        const next = Math.min(prev + 1, Math.max(0, filteredCatalog.length - 1));
        const targetPage = Math.floor(next / catalogPagination.pageSize) + 1;
        if (targetPage !== catalogPagination.currentPage) {
          catalogPagination.goToPage(targetPage);
        }
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCatalogSelectedIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        const targetPage = Math.floor(next / catalogPagination.pageSize) + 1;
        if (targetPage !== catalogPagination.currentPage) {
          catalogPagination.goToPage(targetPage);
        }
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCatalog.length > 0) {
        const item = filteredCatalog[catalogSelectedIndex] || filteredCatalog[0];
        if (item) {
          handleAddFromCatalog(item);
          setCatalogSearchTerm('');
          setCatalogSelectedIndex(0);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCatalogSearchTerm('');
      catalogSearchInputRef.current?.blur();
    }
  };

  useEffect(() => {
    setCatalogSelectedIndex(0);
  }, [catalogSearchTerm, catalogFilter]);

  useEffect(() => {
    if (catalogListRef.current && catalogSelectedIndex >= 0) {
      const pageLocalIndex = catalogSelectedIndex % catalogPagination.pageSize;
      const activeChild = catalogListRef.current.children[pageLocalIndex] as HTMLElement | undefined;
      if (activeChild) {
        activeChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [catalogSelectedIndex, catalogPagination.pageSize]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    const onFocusDrug = () => {
      catalogSearchInputRef.current?.focus();
      catalogSearchInputRef.current?.select();
    };
    const onFocusPatient = () => {
      patientSearchInputRef.current?.focus();
      patientSearchInputRef.current?.select();
    };
    const onFocusDiagnosis = () => {
      diagnosisInputRef.current?.focus();
      diagnosisInputRef.current?.select();
    };
    const onAddCustom = () => {
      handleAddNewCustomMed();
    };
    const onSaveRx = () => {
      handleSubmit(false);
    };
    const onSaveAndPrintRx = () => {
      handleSubmit(true);
    };
    const onReviewRx = () => {
      handleOpenReview();
    };

    window.addEventListener('clinic:focus-drug-search', onFocusDrug);
    window.addEventListener('clinic:focus-patient-search', onFocusPatient);
    window.addEventListener('clinic:focus-diagnosis', onFocusDiagnosis);
    window.addEventListener('clinic:add-custom-drug', onAddCustom);
    window.addEventListener('clinic:save-rx', onSaveRx);
    window.addEventListener('clinic:save-and-print-rx', onSaveAndPrintRx);
    window.addEventListener('clinic:review-rx', onReviewRx);

    return () => {
      window.removeEventListener('clinic:focus-drug-search', onFocusDrug);
      window.removeEventListener('clinic:focus-patient-search', onFocusPatient);
      window.removeEventListener('clinic:focus-diagnosis', onFocusDiagnosis);
      window.removeEventListener('clinic:add-custom-drug', onAddCustom);
      window.removeEventListener('clinic:save-rx', onSaveRx);
      window.removeEventListener('clinic:save-and-print-rx', onSaveAndPrintRx);
      window.removeEventListener('clinic:review-rx', onReviewRx);
    };
  }, [
    medications,
    diagnosis,
    examinationDate,
    doctorAdvice,
    followUpDate,
    bpSystolic,
    bpDiastolic,
    heartRate,
    temperature,
    weightKg,
    selectedPatient,
    clinicInfo,
    icd10Code,
    symptoms,
  ]);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Clinic Header Banner: Expanded, elegant widescreen clinical banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-emerald-700/60 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
            <Stethoscope className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight uppercase flex items-center gap-2">
              <span>Khám Bệnh &amp; Kê Toa Thuốc</span>
              <span className="text-xs font-normal normal-case text-emerald-200 hidden md:inline">
                · Đo sinh hiệu, kê đơn &amp; tạo lịch nhắc uống thuốc
              </span>
            </h1>
            <p className="text-xs text-emerald-200/90 font-medium">
              BS. Trần Văn Diệu · CCHN: {clinicInfo?.licenseNumber || '08362/SYT-GPHĐ'} · {clinicInfo?.phone || ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-emerald-200/90 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
            <Keyboard className="w-4 h-4 text-emerald-300" />
            <span>Phím tắt: F1 (BN) · F2 (Thuốc) · F4 (Bệnh) · Ctrl+Enter (In)</span>
          </div>

          <button
            onClick={onOpenNewPatientModal}
            className="h-9 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 text-xs transition-all border border-amber-500/80 shrink-0 active:scale-98 cursor-pointer"
            title="Tiếp nhận bệnh nhân mới (Phím tắt: F3 hoặc Alt+N)"
          >
            <UserPlus className="w-4 h-4 text-amber-950" />
            <span>Tiếp Nhận BN</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono bg-amber-500/40 text-amber-950 rounded font-bold">
              F3
            </kbd>
          </button>
        </div>
      </div>

      {/* Main Grid: Widescreen balanced split (8 cols clinical form / 4 cols pharmacy catalog) */}
      <div className={`grid grid-cols-12 ${isCompactMode ? 'gap-3.5 lg:gap-4.5' : 'gap-6 lg:gap-8'}`}>
        {/* Left Column: Consultation & Rx Form */}
        <div className={`col-span-12 ${isFocusMode ? 'xl:col-span-12' : 'xl:col-span-8'} ${isCompactMode ? 'space-y-3.5 lg:space-y-4' : 'space-y-6 lg:space-y-8'}`}>
          {/* Patient Selection Card */}
          <div className={`bg-white dark:bg-slate-900 ${isCompactMode ? 'p-3.5 sm:p-4.5' : 'p-5 sm:p-6'} rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm ${isCompactMode ? 'space-y-2.5' : 'space-y-4'} transition-colors`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Chọn bệnh nhân khám bệnh:</span>
                  <span className="text-rose-500">*</span>
                </label>
                {onQuickSavePatient && (
                  <button
                    type="button"
                    onClick={() => setShowQuickPatientForm((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                      showQuickPatientForm
                        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{showQuickPatientForm ? 'Đóng nhập nhanh' : '+ Nhập Nhanh Tại Chỗ'}</span>
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  ref={patientSearchInputRef}
                  type="text"
                  value={patientSearch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPatientSearch(val);
                    const matches = patients.filter(
                      (p) =>
                        p.fullName.toLowerCase().includes(val.toLowerCase()) ||
                        p.phone.includes(val) ||
                        p.patientCode.toLowerCase().includes(val.toLowerCase())
                    );
                    if (matches.length > 0) {
                      setPatientId(matches[0].id);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredPatients.length > 0) {
                      e.preventDefault();
                      setPatientId(filteredPatients[0].id);
                      diagnosisInputRef.current?.focus();
                    }
                  }}
                  placeholder="Tìm tên, SĐT, mã BN..."
                  className="w-full pl-8 pr-12 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                />
                <kbd className="absolute right-2 top-2 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-600 select-none pointer-events-none" title="Nhấn F1 để nhảy vào tìm bệnh nhân">
                  F1
                </kbd>
              </div>
            </div>

            {/* Quick Inline Patient Creation Bar (5-second workflow) */}
            {showQuickPatientForm && (
              <div className="p-3.5 rounded-md bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    Tiếp nhận nhanh bệnh nhân mới (Không cần mở cửa sổ phụ)
                  </span>
                  <button
                    type="button"
                    onClick={onOpenNewPatientModal}
                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-900 cursor-pointer"
                  >
                    Mở form đầy đủ (BHYT, Địa chỉ, Giám hộ)...
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      onBlur={() => {
                        if (quickName.trim()) setQuickName(formatVietnameseFullName(quickName));
                      }}
                      placeholder="Họ và tên bệnh nhân *"
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-md border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="130"
                      value={quickAge}
                      onChange={(e) => {
                        const a = e.target.value;
                        setQuickAge(a);
                        const num = parseInt(a, 10);
                        if (!isNaN(num) && num >= 0 && num <= 130) {
                          setQuickBirthYear(String(currentYear - num));
                        }
                      }}
                      placeholder="Tuổi"
                      title="Nhập tuổi (Tự tính năm sinh)"
                      className="w-14 px-2 py-1.5 text-xs font-bold text-center rounded-md border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300"
                    />
                    <span className="text-[10px] text-slate-500">({quickBirthYear})</span>
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={quickGender}
                      onChange={(e) => setQuickGender(e.target.value as 'nam' | 'nu')}
                      className="w-full px-2 py-1.5 text-xs font-bold rounded-md border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    >
                      <option value="nam">Nam</option>
                      <option value="nu">Nữ</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="tel"
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      placeholder="Số ĐT"
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleQuickCreatePatient}
                      className="w-full h-full min-h-[32px] px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-md flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Lưu &amp; Chọn</span>
                    </button>
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    value={quickAllergy}
                    onChange={(e) => setQuickAllergy(e.target.value)}
                    placeholder="Dị ứng thuốc (nếu có, phân cách bằng dấu phẩy - VD: Penicillin, Aspirin)..."
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {filteredPatients.length > 0 ? (
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-sm focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
              >
                {filteredPatients.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-slate-900">
                    {p.patientCode} - {p.fullName} ({currentYear - Number(p.birthYear)} tuổi • {p.gender === 'nam' ? 'Nam' : 'Nữ'}) - SĐT: {p.phone || 'Chưa có'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-amber-900 dark:text-amber-200 font-medium">
                  Không tìm thấy bệnh nhân khớp với &ldquo;<strong>{patientSearch}</strong>&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setQuickName(formatVietnameseFullName(patientSearch));
                    setShowQuickPatientForm(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-md flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tạo nhanh BN &ldquo;{formatVietnameseFullName(patientSearch)}&rdquo;</span>
                </button>
              </div>
            )}

            {/* Selected Patient Details Banner */}
            {selectedPatient && (
              <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-md border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      {selectedPatient.fullName}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold rounded-md text-xs font-mono border border-emerald-200 dark:border-emerald-700">
                      {selectedPatient.patientCode}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
                      {currentYear - Number(selectedPatient.birthYear)} tuổi ({selectedPatient.birthYear} • {selectedPatient.gender === 'nam' ? 'Nam' : 'Nữ'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                      SĐT: {selectedPatient.phone || 'Chưa có'}
                    </span>
                    {onEditPatient && (
                      <button
                        type="button"
                        onClick={() => onEditPatient(selectedPatient)}
                        className="px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        title="Cập nhật thông tin hành chính, dị ứng hoặc bệnh nền của bệnh nhân"
                      >
                        <Edit3 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                        <span>Sửa hồ sơ</span>
                      </button>
                    )}
                    {latestPatientPrescription && (
                      <button
                        type="button"
                        onClick={() =>
                          loadPrescriptionIntoForm(
                            latestPatientPrescription,
                            'Tái khám - Đã nạp đơn gần nhất'
                          )
                        }
                        className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title={`Nạp lại đơn thuốc ngày ${latestPatientPrescription.examinationDate} (${latestPatientPrescription.medications.length} thuốc)`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Nạp Đơn Cũ (Tái Khám)</span>
                      </button>
                    )}
                  </div>
                </div>

                {selectedPatient.address && (
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Địa chỉ: {selectedPatient.address}
                    {selectedPatient.healthInsuranceNumber
                      ? ` • BHYT: ${selectedPatient.healthInsuranceNumber}`
                      : ''}
                  </p>
                )}

                {selectedPatient.chronicConditions && selectedPatient.chronicConditions.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/50 px-3 py-1.5 rounded border border-slate-200/70 dark:border-slate-700/70">
                    <span>
                      <strong>Bệnh nền / Tiền sử:</strong> {selectedPatient.chronicConditions.join(', ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const chronicText = selectedPatient.chronicConditions.join('; ');
                        setDiagnosis((prev) =>
                          prev ? `${prev}; ${chronicText}` : chronicText
                        );
                      }}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      + Đưa vào Chẩn đoán
                    </button>
                  </div>
                )}

                {/* Allergies Highlight */}
                {selectedPatient.allergies && selectedPatient.allergies.length > 0 && !selectedPatient.allergies[0].includes('Không có') && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md text-rose-900 dark:text-rose-200 font-bold text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
                    <span>CẢNH BÁO DỊ ỨNG: {selectedPatient.allergies.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phân hệ 1 & 3: Phác Đồ Mẫu 1-Click & Tiến Triển Bệnh Án */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-slate-900 dark:via-emerald-950/30 dark:to-slate-900 p-4 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-xs space-y-2.5 transition-colors">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                  Phác Đồ Mẫu &amp; Kê Toa 1-Click (BS. Trần Văn Diệu)
                </h3>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Nút xem tiến triển sinh hiệu & so sánh đơn */}
                <button
                  type="button"
                  onClick={() => setIsTrendModalOpen(true)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  title="Xem biểu đồ diễn tiến huyết áp/mạch và so sánh đơn thuốc cũ/mới"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Tiến Triển &amp; So Sánh Đơn</span>
                </button>

                {/* Nút lưu đơn hiện tại thành phác đồ */}
                <button
                  type="button"
                  onClick={handleSaveCurrentAsProtocol}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded text-xs font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  title="Lưu các thuốc đang kê thành một phác đồ mẫu riêng của phòng khám"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>+ Lưu Thành Phác Đồ</span>
                </button>
              </div>
            </div>

            {/* Danh sách các phác đồ mẫu 1-click (Hiển thị dạng thẻ bọc flex-wrap mượt mà, không thanh scroll) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {protocols.map((proto) => {
                // Đổi màu chấm nhận diện theo chuyên khoa
                const dotColor = proto.category.includes('Tim mạch')
                  ? 'bg-emerald-500'
                  : proto.category.includes('Tiểu đường')
                  ? 'bg-amber-500'
                  : proto.category.includes('Tiêu hóa')
                  ? 'bg-blue-500'
                  : proto.category.includes('Hô hấp')
                  ? 'bg-indigo-500'
                  : proto.category.includes('Não') || proto.category.includes('thần kinh')
                  ? 'bg-purple-500'
                  : proto.category.includes('Cơ xương khớp') || proto.category.includes('Gút')
                  ? 'bg-rose-500'
                  : 'bg-teal-500';

                return (
                  <button
                    key={proto.id}
                    type="button"
                    onClick={() => handleApplyProtocol(proto)}
                    className="px-2.5 py-1.5 bg-white hover:bg-emerald-700 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-2xs flex items-center gap-1.5 cursor-pointer hover:border-emerald-500"
                    title={`Nạp phác đồ "${proto.name}" (${proto.medications.length} thuốc) bao gồm thuốc, liều 4 cữ và lời dặn`}
                  >
                    <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                    <span className="font-medium">{proto.name}</span>
                    <span className="text-[10px] opacity-75 font-mono px-1 rounded bg-black/5 dark:bg-white/10 font-bold">
                      {proto.medications.length}T
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Examination & Vitals Card */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              Khám Lâm Sàng &amp; Chỉ Số Sinh Hiệu
            </h3>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 rounded-md border border-emerald-100 dark:border-emerald-900/40 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Huyết áp (Thu/Trương)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(e.target.value)}
                    placeholder="130"
                    className="w-14 px-2 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-center font-bold text-emerald-950 dark:text-emerald-200 text-sm focus:ring-2 focus:ring-emerald-600/30"
                  />
                  <span className="dark:text-slate-400">/</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(e.target.value)}
                    placeholder="80"
                    className="w-14 px-2 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-center font-bold text-emerald-950 dark:text-emerald-200 text-sm focus:ring-2 focus:ring-emerald-600/30"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">mmHg</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Nhịp tim</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="75"
                    className="w-16 px-2 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-center font-bold text-rose-700 dark:text-rose-400 text-sm focus:ring-2 focus:ring-emerald-600/30"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">bpm</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Thân nhiệt</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="36.8"
                    className="w-16 px-2 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-center font-bold text-amber-700 dark:text-amber-400 text-sm focus:ring-2 focus:ring-emerald-600/30"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">°C</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Cân nặng</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="65"
                    className="w-16 px-2 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-center font-bold text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-600/30"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">kg</span>
                </div>
              </div>
            </div>

            {/* Symptoms & Examination Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Triệu chứng / Lý do đến khám
                </label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="VD: Đau đầu, chóng mặt buổi sáng, ho có đờm, đau rát thượng vị..."
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ngày khám bệnh
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={examinationDate}
                    onChange={(e) => setExaminationDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis with quick chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Chẩn đoán bệnh của Bác Sĩ Diệu <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">Gợi ý chẩn đoán nhanh:</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {COMMON_DIAGNOSES.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => handleSelectQuickDiagnosis(d)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 dark:bg-slate-800 dark:hover:bg-emerald-900/50 text-slate-700 dark:text-slate-300 text-xs rounded-md transition-all border border-slate-200 dark:border-slate-700 active:scale-98"
                  >
                    + {d.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3 relative">
                  <input
                    ref={diagnosisInputRef}
                    type="text"
                    value={diagnosis}
                    onChange={(e) => {
                      setDiagnosis(e.target.value);
                      if (errors.diagnosis) setErrors({ ...errors, diagnosis: '' });
                    }}
                    placeholder="VD: Tăng huyết áp nguyên phát (I10) - Đái tháo đường type 2 (E11)"
                    className={`w-full pl-3.5 pr-12 py-2.5 rounded-md border ${
                      errors.diagnosis ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    } text-slate-900 dark:text-slate-100 font-bold text-sm focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all`}
                  />
                  <kbd className="absolute right-3 top-3 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-600 select-none pointer-events-none" title="Nhấn F4 để nhập chẩn đoán">
                    F4
                  </kbd>
                  {errors.diagnosis && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.diagnosis}</p>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    value={icd10Code}
                    onChange={(e) => setIcd10Code(e.target.value)}
                    placeholder="Mã ICD-10"
                    className="w-full px-3 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase font-mono text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ghi Chú Xét Nghiệm & Cận Lâm Sàng (VD: Trung Tâm 548 / Ngoại viện) */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasLabReferral || selectedLabTests.length > 0 || !!labDoctorNotes.trim() || !!labResultsSummary.trim()}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasLabReferral(checked);
                    if (!checked) {
                      setSelectedLabTests([]);
                      setLabDoctorNotes('');
                      setLabResultsSummary('');
                    } else if (selectedLabTests.length === 0) {
                      setLabDoctorNotes('Chỉ định xét nghiệm Trung Tâm 548 (nhịn ăn sáng)');
                    }
                  }}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Ghi Chú Xét Nghiệm &amp; Cận Lâm Sàng
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                    (Chỉ định làm ngoài như Trung Tâm 548 / Medic)
                  </span>
                </div>
              </label>

              {(hasLabReferral || selectedLabTests.length > 0 || !!labDoctorNotes.trim() || !!labResultsSummary.trim()) && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                    {selectedLabTests.length > 0 ? `${selectedLabTests.length} mục đã chọn` : 'Đang ghi nhận'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLabTests([]);
                      setLabDoctorNotes('');
                      setLabResultsSummary('');
                      setHasLabReferral(false);
                    }}
                    className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors px-1 cursor-pointer"
                  >
                    Xóa ghi chú
                  </button>
                </div>
              )}
            </div>

            {/* Nội dung ghi chú xét nghiệm khi được bật */}
            {(hasLabReferral || selectedLabTests.length > 0 || !!labDoctorNotes.trim() || !!labResultsSummary.trim()) && (
              <div className="space-y-3 pt-1 animate-in fade-in">
                {/* Chọn nhanh các mục xét nghiệm thông dụng */}
                <div>
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Nhấp để chọn nhanh các mục xét nghiệm:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'glucose_fasting', label: 'Đường huyết đói (Glucose)' },
                      { id: 'hba1c', label: 'HbA1c (Đường 3 tháng)' },
                      { id: 'sgpt', label: 'Men gan (AST/ALT)' },
                      { id: 'creatinine', label: 'Chức năng thận (Creatinine/eGFR)' },
                      { id: 'cholesterol_total', label: 'Bộ mỡ máu (Lipid)' },
                      { id: 'uric_acid', label: 'Acid Uric (Gút)' },
                      { id: 'urinalysis', label: 'Tổng phân tích nước tiểu' },
                      { id: 'cbc', label: 'Huyết học (CBC)' },
                      { id: 'ecg', label: 'Điện tim (ECG)' },
                      { id: 'ultrasound_abdomen', label: 'Siêu âm bụng' },
                      { id: 'xray_chest', label: 'X-quang phổi' },
                    ].map((item) => {
                      const isSelected = selectedLabTests.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedLabTests((prev) => {
                              const next = prev.includes(item.id)
                                ? prev.filter((id) => id !== item.id)
                                : [...prev, item.id];
                              return next;
                            });
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-700 shadow-2xs font-bold'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                          }`}
                        >
                          <span>{isSelected ? '✓ ' : '+ '}</span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Các nút nạp nhanh gói & mẫu */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Nạp nhanh:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const standardPackage = ['glucose_fasting', 'hba1c', 'sgpt', 'creatinine', 'cholesterol_total', 'uric_acid'];
                      setSelectedLabTests(standardPackage);
                      if (!labDoctorNotes) {
                        setLabDoctorNotes('Chỉ định Trung Tâm 548: Đường huyết đói, HbA1c, Men gan AST/ALT, Creatinine thận, Bộ mỡ, Acid Uric');
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[11px] font-semibold border border-blue-200 dark:border-blue-800 cursor-pointer"
                  >
                    + Bộ XN Thường Quy 548 (Đường, Mỡ, Gan, Thận, Gút)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const dmPackage = ['glucose_fasting', 'hba1c', 'creatinine', 'urinalysis'];
                      setSelectedLabTests(dmPackage);
                      if (!labDoctorNotes) {
                        setLabDoctorNotes('Chỉ định Trung Tâm 548: Đo đường huyết đói, HbA1c, Chức năng thận Creatinine, Nước tiểu 10 thông số');
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                  >
                    + Gói Đái Tháo Đường &amp; Thận
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLabResultsSummary('Glucose đói: ... mmol/L, HbA1c: ... %, Creatinine: ... umol/L, Men gan: Bình thường');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-semibold border border-slate-300 dark:border-slate-700 cursor-pointer ml-auto"
                  >
                    + Mẫu kết quả mang về
                  </button>
                </div>

                {/* Ô Textarea: Ghi chú xét nghiệm & kết quả */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mục xét nghiệm chỉ định / Lời dặn gửi nơi XN (VD: TT 548):
                    </label>
                    <textarea
                      rows={2}
                      value={labDoctorNotes}
                      onChange={(e) => setLabDoctorNotes(e.target.value)}
                      placeholder="VD: Chỉ định gửi TT 548: Glucose đói, HbA1c, Men gan, Creatinine. Dặn bệnh nhân nhịn ăn sáng..."
                      className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kết quả xét nghiệm bệnh nhân mang về (nếu có):
                    </label>
                    <textarea
                      rows={2}
                      value={labResultsSummary}
                      onChange={(e) => setLabResultsSummary(e.target.value)}
                      placeholder="VD: Glucose đói: 6.8 mmol/L, HbA1c: 6.5%, Creatinine: 82 umol/L, Men gan bình thường..."
                      className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prescribed Medications Card */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Đơn Thuốc Kê Cho Bệnh Nhân ({medications.length} thuốc)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chọn thuốc từ danh mục bên phải (F2) hoặc thêm thuốc mới (Alt+T)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {medications.length > 0 && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                      Số ngày:
                    </span>
                    {[5, 7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleSetAllDurationDays(d)}
                        className="px-2 py-1 rounded text-[11px] font-bold bg-white dark:bg-slate-900 hover:bg-emerald-700 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                        title={`Đặt tất cả thuốc trong đơn uống ${d} ngày`}
                      >
                        {d}N
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddNewCustomMed}
                  className="min-h-[38px] px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all border border-emerald-700/60 dark:border-emerald-600/60 active:scale-98 cursor-pointer"
                  title="Thêm dòng thuốc tự do (Phím tắt: Alt+T)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thuốc Tự Do</span>
                  <kbd className="hidden sm:inline px-1.5 py-0.2 text-[9px] font-mono bg-emerald-950/40 text-emerald-100 rounded font-bold">Alt+T</kbd>
                </button>
              </div>
            </div>

            {/* Mobile / Tablet Inline Quick Drug Picker (so iPhone users don't have to scroll down) */}
            <div className="lg:hidden p-3 rounded-md bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={catalogSearchTerm}
                  onChange={(e) => setCatalogSearchTerm(e.target.value)}
                  placeholder="Tìm & chạm để thêm thuốc nhanh trên điện thoại..."
                  className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
                {catalogSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearchTerm('')}
                    className="absolute right-2.5 top-2 text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {filteredCatalog.slice(0, 8).map((item: MedicationCatalogItem) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddFromCatalog(item)}
                    className="shrink-0 px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left text-xs hover:border-emerald-500 flex items-center gap-1.5"
                  >
                    <Plus className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.name}</span>
                    <span className="text-[10px] text-slate-500">({item.strength})</span>
                  </button>
                ))}
              </div>
            </div>

            {errors.medications && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-md border border-rose-200 dark:border-rose-800">
                {errors.medications}
              </p>
            )}

            {/* Zero-latency Clinical Interaction & Safety Alert Strip (0ms) */}
            {safetyAlerts.length > 0 && (
              <div className="p-3 rounded-md bg-amber-500/10 dark:bg-amber-950/40 border border-amber-400/80 dark:border-amber-700/80 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      Cảnh báo an toàn lâm sàng: Phát hiện {safetyAlerts.length} tương tác / lưu ý quan trọng
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSafetyAlertDetails((prev) => !prev)}
                    className="text-[11px] font-bold text-amber-900 dark:text-amber-300 hover:underline cursor-pointer"
                  >
                    {showSafetyAlertDetails ? 'Thu gọn ▲' : 'Xem chi tiết & khuyến nghị ▼'}
                  </button>
                </div>

                {showSafetyAlertDetails && (
                  <div className="space-y-2 pt-1 border-t border-amber-300/40 dark:border-amber-800/40">
                    {safetyAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-2.5 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 text-xs space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                              alert.severity === 'contraindicated'
                                ? 'bg-rose-600 text-white'
                                : alert.severity === 'major'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}>
                              {alert.severity === 'contraindicated' ? 'Chống chỉ định' : alert.severity === 'major' ? 'Tương tác nặng' : 'Lưu ý'}
                            </span>
                            <span>{alert.title}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {alert.involvedItems.join(' • ')}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {alert.description}
                        </p>
                        <p className="text-emerald-800 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded">
                          💡 <strong>Khuyến nghị BS:</strong> {alert.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {medications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-md">
                Chưa có thuốc trong đơn. Bấm vào các thuốc ở bảng bên phải (hoặc thanh tìm nhanh phía trên) để thêm vào toa.
              </div>
            ) : (
              <div className="space-y-3">
                {medications.map((med, index) => {
                  const medAllergyAlert = checkMedicationAllergyWarning(
                    med,
                    selectedPatient?.allergies
                  );
                  return (
                    <div
                      key={med.id}
                      className={`p-4 rounded-md border transition-all space-y-3 shadow-2xs ${
                        medAllergyAlert
                          ? 'border-rose-400 dark:border-rose-700 bg-rose-50/40 dark:bg-rose-950/30'
                          : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:border-emerald-500/60'
                      }`}
                    >
                      {medAllergyAlert && (
                        <div className="p-2 rounded bg-rose-600 text-white text-xs font-bold flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>CẢNH BÁO TƯƠNG TÁC DỊ ỨNG: {medAllergyAlert}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <span className="w-6 h-6 rounded-md bg-emerald-800 dark:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={med.name}
                            onChange={(e) => handleUpdateMed(index, 'name', e.target.value)}
                            placeholder="Tên thương mại"
                            className="flex-1 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                          />
                        </div>
                        <input
                          type="text"
                          value={med.activeIngredient || ''}
                          onChange={(e) => handleUpdateMed(index, 'activeIngredient', e.target.value)}
                          placeholder="Hoạt chất (INN)"
                          title="Tên chung quốc tế (INN) theo quy định Thông tư 52/2017/TT-BYT"
                          className="w-36 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                        />
                        <input
                          type="text"
                          value={med.strength || ''}
                          onChange={(e) => handleUpdateMed(index, 'strength', e.target.value)}
                          placeholder="Hàm lượng"
                          className="w-24 px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMed(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          aria-label="Xóa thuốc"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    {/* Dosage Slots with Touch-Friendly Steppers */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-md border border-slate-200 dark:border-slate-800">
                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-400 mb-0.5">
                          <Sunrise className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>Sáng</span>
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleUpdateDosage(index, 'morning', Math.max(0, +(med.dosage.morning - (med.dosage.morning <= 1 && med.dosage.morning > 0 ? 0.5 : 1)).toFixed(1)))}
                            className="w-5 h-7 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-l border border-r-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.5"
                            value={med.dosage.morning}
                            onChange={(e) =>
                              handleUpdateDosage(index, 'morning', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-1 py-1 text-center font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 text-xs focus:ring-1 focus:ring-emerald-600/30"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateDosage(index, 'morning', +(med.dosage.morning + (med.dosage.morning < 1 ? 0.5 : 1)).toFixed(1))}
                            className="w-5 h-7 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-r border border-l-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-orange-800 dark:text-orange-400 mb-0.5">
                          <Sun className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>Trưa</span>
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleUpdateDosage(index, 'noon', Math.max(0, +(med.dosage.noon - (med.dosage.noon <= 1 && med.dosage.noon > 0 ? 0.5 : 1)).toFixed(1)))}
                            className="w-5 h-7 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-l border border-r-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.5"
                            value={med.dosage.noon}
                            onChange={(e) =>
                              handleUpdateDosage(index, 'noon', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-1 py-1 text-center font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 text-xs focus:ring-1 focus:ring-emerald-600/30"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateDosage(index, 'noon', +(med.dosage.noon + (med.dosage.noon < 1 ? 0.5 : 1)).toFixed(1))}
                            className="w-5 h-7 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-r border border-l-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-indigo-800 dark:text-indigo-400 mb-0.5">
                          <Sunset className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>Chiều</span>
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleUpdateDosage(index, 'afternoon', Math.max(0, +(med.dosage.afternoon - (med.dosage.afternoon <= 1 && med.dosage.afternoon > 0 ? 0.5 : 1)).toFixed(1)))}
                            className="w-5 h-7 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-l border border-r-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.5"
                            value={med.dosage.afternoon}
                            onChange={(e) =>
                              handleUpdateDosage(index, 'afternoon', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-1 py-1 text-center font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 text-xs focus:ring-1 focus:ring-emerald-600/30"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateDosage(index, 'afternoon', +(med.dosage.afternoon + (med.dosage.afternoon < 1 ? 0.5 : 1)).toFixed(1))}
                            className="w-5 h-7 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-r border border-l-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-blue-900 dark:text-blue-400 mb-0.5">
                          <Moon className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>Tối</span>
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleUpdateDosage(index, 'evening', Math.max(0, +(med.dosage.evening - (med.dosage.evening <= 1 && med.dosage.evening > 0 ? 0.5 : 1)).toFixed(1)))}
                            className="w-5 h-7 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-l border border-r-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.5"
                            value={med.dosage.evening}
                            onChange={(e) =>
                              handleUpdateDosage(index, 'evening', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-1 py-1 text-center font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 text-xs focus:ring-1 focus:ring-emerald-600/30"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateDosage(index, 'evening', +(med.dosage.evening + (med.dosage.evening < 1 ? 0.5 : 1)).toFixed(1))}
                            className="w-5 h-7 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-r border border-l-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          Số ngày uống
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="1"
                          value={med.durationDays}
                          onChange={(e) =>
                            handleUpdateMed(index, 'durationDays', parseInt(e.target.value, 10) || 1)
                          }
                          className="w-full px-2 py-1 text-center font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs focus:ring-2 focus:ring-emerald-600/30"
                        />
                      </div>
                    </div>

                    {/* Timing & Instructions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Thời điểm:</label>
                        <select
                          value={med.dosage.timing}
                          onChange={(e) => {
                            const updated = [...medications];
                            updated[index].dosage = { ...updated[index].dosage, timing: e.target.value as MealTiming };
                            setMedications(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600/30"
                        >
                          {Object.entries(MEAL_TIMING_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tổng cấp:</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min="1"
                            value={med.totalQuantity}
                            onChange={(e) =>
                              handleUpdateMed(index, 'totalQuantity', parseInt(e.target.value, 10) || 1)
                            }
                            className="w-16 px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-600/30"
                          />
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">{med.unit}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Lưu ý khi dùng:</label>
                        <input
                          type="text"
                          value={med.warningOrNote || ''}
                          onChange={(e) => handleUpdateMed(index, 'warningOrNote', e.target.value)}
                          placeholder="VD: Uống sau ăn no, uống nhiều nước..."
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600/30"
                        />
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Advice & Follow-Up Date */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Lời dặn dò của Bác Sĩ Diệu
                </label>
                <textarea
                  rows={3}
                  value={doctorAdvice}
                  onChange={(e) => setDoctorAdvice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Ngày hẹn tái khám
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Ngày hẹn tái khám sẽ in trực tiếp lên toa thuốc cho bệnh nhân.
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap justify-end items-center gap-3">
              {/* Nút Mã QR Ngân Hàng */}
              <button
                type="button"
                onClick={() => setIsBankQrModalOpen(true)}
                className="min-h-[44px] px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold rounded-md text-xs flex items-center gap-2 shadow-xs transition-all border border-blue-600/50 dark:border-blue-500/50 active:scale-98 cursor-pointer"
                title="Mở mã QR ngân hàng để bệnh nhân quét chuyển khoản (hỗ trợ tải ảnh và cắt theo tỉ lệ 3:4)"
              >
                <QrCode className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Mã QR Ngân Hàng</span>
              </button>

              <button
                type="button"
                onClick={handleOpenReview}
                className="min-h-[44px] px-4 sm:px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold rounded-md text-xs flex items-center gap-2 shadow-xs transition-all border border-emerald-600/50 dark:border-emerald-500/50 active:scale-98 cursor-pointer"
                title="Xem trước định dạng in của toa thuốc và bảng nhắc uống thuốc (Phím tắt: F8)"
              >
                <Eye className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Xem Trước Toa</span>
                <kbd className="hidden sm:inline px-1.5 py-0.2 text-[9px] font-mono bg-emerald-200/70 dark:bg-emerald-900 rounded font-bold">F8</kbd>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                className="min-h-[44px] px-5 sm:px-6 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-md text-xs flex items-center gap-2 shadow-xs transition-all border border-slate-700 active:scale-98 cursor-pointer"
                title="Lưu đơn thuốc vào hồ sơ (Phím tắt: Ctrl+S)"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Đơn Thuốc</span>
                <kbd className="hidden sm:inline px-1.5 py-0.2 text-[9px] font-mono bg-slate-700 dark:bg-slate-900 text-slate-200 rounded font-bold border border-slate-600">Ctrl+S</kbd>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="min-h-[44px] px-5 sm:px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-md text-xs flex items-center gap-2 shadow-xs transition-all border border-emerald-700/60 active:scale-98 cursor-pointer"
                title="Lưu hồ sơ và in toa ngay cho bệnh nhân (Phím tắt: Ctrl+Enter)"
              >
                <Printer className="w-4 h-4" />
                <span>Lưu &amp; In Toa Ngay</span>
                <kbd className="hidden sm:inline px-1.5 py-0.2 text-[9px] font-mono bg-emerald-950/60 text-emerald-200 rounded font-bold border border-emerald-600/50">Ctrl+↵</kbd>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Pharmacy Catalog & Quick Pick (Ẩn ở chế độ focus-prescribing để nhường toàn màn hình, mở qua ngăn kéo thông minh) */}
        {!isFocusMode && (
          <div className="col-span-12 xl:col-span-4 space-y-4">
            <div className={`bg-white dark:bg-slate-900 ${isCompactMode ? 'p-3.5 sm:p-4' : 'p-5 lg:p-6'} rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 sticky top-20 transition-colors`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Kho Thuốc Phòng Khám
                  </h3>
                </div>
                <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-md font-mono border border-emerald-200/60 dark:border-emerald-700/60">
                  {catalog.length} thuốc
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex items-center justify-between">
                <span>Bấm <kbd className="px-1 py-0.2 text-[9px] font-mono bg-slate-100 dark:bg-slate-800 border rounded font-bold">F2</kbd> gõ tìm thuốc, <kbd className="px-1 py-0.2 text-[9px] font-mono bg-slate-100 dark:bg-slate-800 border rounded font-bold">↓/↑</kbd> để chọn &amp; <kbd className="px-1 py-0.2 text-[9px] font-mono bg-slate-100 dark:bg-slate-800 border rounded font-bold">Enter</kbd> thêm vào toa</span>
              </p>

              {/* Catalog Search with F2 Hotkey */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  ref={catalogSearchInputRef}
                  type="text"
                  value={catalogSearchTerm}
                  onChange={(e) => setCatalogSearchTerm(e.target.value)}
                  onKeyDown={handleCatalogKeyDown}
                  placeholder="Tìm thuốc nhanh (nhấn ↓/↑ rồi Enter)..."
                  className="w-full pl-8.5 pr-14 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all font-medium"
                />
                <div className="absolute right-2.5 top-2 flex items-center gap-1">
                  {catalogSearchTerm ? (
                    <button
                      type="button"
                      onClick={() => setCatalogSearchTerm('')}
                      aria-label="Xóa từ khóa tìm kiếm"
                      className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                  <kbd
                    className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-600 select-none pointer-events-none"
                    title="Nhấn F2 để nhảy vào tìm thuốc"
                  >
                    F2
                  </kbd>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat: string) => (
                  <button
                    key={cat}
                    onClick={() => setCatalogFilter(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                      catalogFilter === cat
                        ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-800 dark:border-emerald-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cat === 'all' ? 'Tất cả' : cat}
                  </button>
                ))}
              </div>

              {/* Catalog List with keyboard cursor selection */}
              <div
                ref={catalogListRef}
                className="space-y-2 max-h-[520px] overflow-y-auto pr-1.5 custom-scrollbar"
              >
                {catalogPagination.paginatedItems.map((item, pageLocalIndex) => {
                  const globalIndex = (catalogPagination.currentPage - 1) * catalogPagination.pageSize + pageLocalIndex;
                  const isActive = globalIndex === catalogSelectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleAddFromCatalog(item)}
                      onMouseEnter={(e) => handleDrugMouseEnter(item, e)}
                      onMouseLeave={handleDrugMouseLeave}
                      className={`p-3 rounded-md border transition-all cursor-pointer group shadow-2xs relative ${
                        isActive
                          ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-100/70 dark:bg-emerald-950/70 ring-2 ring-emerald-500/40 shadow-xs'
                          : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 hover:border-emerald-400 dark:hover:border-emerald-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold text-xs truncate ${isActive ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-900 dark:text-slate-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300'}`}>
                              {item.name}
                            </span>
                            {isActive && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-800 text-white font-mono font-bold">
                                Chọn [Enter]
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.strength} • {item.form}
                          </div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5 truncate">
                            {item.warningNote || item.defaultInstructions}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={getGoogleSearchUrl(item.name, item.activeIngredient)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            title={`Tìm thông tin "${item.name}" trên Google (Tab mới)`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            className={`p-1.5 rounded-md transition-all shadow-2xs active:scale-95 shrink-0 ${
                              isActive
                                ? 'bg-emerald-900 dark:bg-emerald-600 text-white ring-2 ring-emerald-400/50'
                                : 'bg-emerald-800 dark:bg-emerald-700 text-white group-hover:bg-emerald-900'
                            }`}
                            aria-label="Thêm thuốc này"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Thanh phân trang thông minh cho Kho Thuốc bên phải */}
              <ClinicPaginationBar
                pagination={catalogPagination}
                pageSizeOptions={[12, 15, 25, 50]}
                itemLabel="thuốc"
                isCompact={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Focus Prescribing Mode: Trigger button & Slide-over Drawer */}
      {isFocusMode && (
        <>
          <button
            type="button"
            onClick={() => setIsPharmacyDrawerOpen((prev) => !prev)}
            className="no-print fixed bottom-24 right-5 z-40 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-2xl border border-emerald-400/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            title="Mở ngăn kéo kho thuốc phòng khám (F2)"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Kho Thuốc ({catalog.length})</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-900/60 rounded border border-emerald-400/40">F2</kbd>
          </button>

          {isPharmacyDrawerOpen && (
            <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
              <div
                className="fixed inset-0"
                onClick={() => setIsPharmacyDrawerOpen(false)}
                aria-hidden="true"
              />
              <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl h-full border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-right duration-200">
                <div className="p-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                    <div>
                      <h3 className="font-bold text-sm">Kho Thuốc Phòng Khám (Drawer)</h3>
                      <p className="text-[11px] text-emerald-200">Kê đơn tập trung toàn màn hình</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPharmacyDrawerOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  {/* Catalog Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={catalogSearchTerm}
                      onChange={(e) => setCatalogSearchTerm(e.target.value)}
                      placeholder="Tìm thuốc nhanh..."
                      className="w-full pl-8.5 pr-8 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-600/30"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat: string) => (
                      <button
                        key={cat}
                        onClick={() => setCatalogFilter(cat)}
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${
                          catalogFilter === cat
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {cat === 'all' ? 'Tất cả' : cat}
                      </button>
                    ))}
                  </div>

                  {/* Catalog list in drawer */}
                  <div className="space-y-2">
                    {catalogPagination.paginatedItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          handleAddFromCatalog(item);
                        }}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.strength} • {item.form}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-emerald-700 text-white rounded text-xs font-bold shrink-0 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Thêm
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Phân trang trong Drawer */}
                  <ClinicPaginationBar
                    pagination={catalogPagination}
                    pageSizeOptions={[12, 15, 25, 50]}
                    itemLabel="thuốc"
                    isCompact={true}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-emerald-950/95 text-white border border-emerald-500/60 px-4 py-2.5 rounded-md shadow-2xl backdrop-blur-xs flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Prescription Review Modal */}
      <PrescriptionReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        prescription={draftPrescription}
        clinicInfo={clinicInfo}
        onSaveOnly={() => handleSubmit(false)}
        onSaveAndPrint={() => handleSubmit(true)}
        isDraft={true}
      />

      {/* Floating Interactive Drug Detail Popover */}
      <DrugDetailPopover
        isOpen={!!hoveredDrug}
        item={hoveredDrug?.item || null}
        anchorRect={hoveredDrug?.rect || null}
        onClose={() => setHoveredDrug(null)}
        onMouseEnterPopover={handlePopoverMouseEnter}
        onMouseLeavePopover={handlePopoverMouseLeave}
        onAddMedication={handleAddFromCatalog}
      />

      {/* Phân hệ 3: Biểu Đồ Diễn Tiến Sinh Hiệu & So Sánh Đơn Thuốc */}
      <PatientTrendChartModal
        isOpen={isTrendModalOpen}
        onClose={() => setIsTrendModalOpen(false)}
        patient={selectedPatient}
        prescriptions={prescriptions}
        currentDraftMedications={medications}
      />

      {/* Modal hiển thị Mã QR Ngân Hàng & Tải ảnh cắt tỉ lệ 3:4 */}
      <BankQrModal
        isOpen={isBankQrModalOpen}
        onClose={() => setIsBankQrModalOpen(false)}
        clinicInfo={clinicInfo}
        onUpdateClinicSettings={onUpdateClinicSettings}
        patientName={selectedPatient?.fullName || 'Bệnh nhân'}
        prescriptionCode={draftPrescription?.prescriptionCode || generatePrescriptionCode()}
      />
    </div>
  );
};