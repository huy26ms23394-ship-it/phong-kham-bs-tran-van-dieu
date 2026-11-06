import React, { useState, useEffect, useRef } from 'react';
import { Patient } from '../types/medical';
import {
  validatePatientForm,
  generatePatientCode,
  formatVietnameseFullName,
} from '../utils/medicationSchedule';
import { User, Phone, MapPin, Heart, ShieldAlert, X, Plus, Users } from 'lucide-react';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  patientToEdit?: Patient | null;
  existingCount?: number;
}

const COMMON_CHRONIC_CONDITIONS = [
  'Tăng huyết áp',
  'Đái tháo đường Type 2',
  'Rối loạn lipid máu (mỡ máu)',
  'Viêm loét dạ dày - tá tràng',
  'Trào ngược dạ dày thực quản (GERD)',
  'Thoái hóa khớp',
  'Bệnh mạch vành',
  'Gút (Gout)',
  'Hen phế quản / COPD',
  'Viêm xoang dị ứng',
];

const QUICK_ALLERGY_OPTIONS = [
  'Dị ứng Penicillin / Amoxicillin',
  'Dị ứng Aspirin / Kháng viêm NSAID',
  'Dị ứng Cephalosporin',
  'Dị ứng Paracetamol',
  'Dị ứng Sulfonamide',
  'Dị ứng Hải sản / Thời tiết',
];

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  patientToEdit,
  existingCount = 0,
}) => {
  const currentYear = new Date().getFullYear();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(patientToEdit?.fullName || '');
  const [birthYear, setBirthYear] = useState<string | number>(
    patientToEdit?.birthYear || currentYear - 58
  );
  const [ageInput, setAgeInput] = useState<string>(
    String(currentYear - Number(patientToEdit?.birthYear || currentYear - 58))
  );
  const [gender, setGender] = useState<'nam' | 'nu' | 'khac'>(patientToEdit?.gender || 'nam');
  const [phone, setPhone] = useState(patientToEdit?.phone || '');
  const [address, setAddress] = useState(patientToEdit?.address || '');
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState(
    patientToEdit?.healthInsuranceNumber || ''
  );
  const [bloodType, setBloodType] = useState(patientToEdit?.bloodType || 'Chưa rõ');
  const [allergies, setAllergies] = useState<string[]>(
    patientToEdit?.allergies || ['Không có tiền sử dị ứng đã biết']
  );
  const [newAllergy, setNewAllergy] = useState('');
  const [chronicConditions, setChronicConditions] = useState<string[]>(
    patientToEdit?.chronicConditions || []
  );
  const [emergencyName, setEmergencyName] = useState(
    patientToEdit?.emergencyContactName || ''
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    patientToEdit?.emergencyContactPhone || ''
  );
  const [notes, setNotes] = useState(patientToEdit?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form state whenever modal opens or patientToEdit changes
  useEffect(() => {
    if (!isOpen) return;
    const defaultYear = patientToEdit?.birthYear ? Number(patientToEdit.birthYear) : currentYear - 58;
    setFullName(patientToEdit?.fullName || '');
    setBirthYear(defaultYear);
    setAgeInput(String(Math.max(0, currentYear - defaultYear)));
    setGender(patientToEdit?.gender || 'nam');
    setPhone(patientToEdit?.phone || '');
    setAddress(patientToEdit?.address || '');
    setHealthInsuranceNumber(patientToEdit?.healthInsuranceNumber || '');
    setBloodType(patientToEdit?.bloodType || 'Chưa rõ');
    setAllergies(
      patientToEdit?.allergies && patientToEdit.allergies.length > 0
        ? patientToEdit.allergies
        : ['Không có tiền sử dị ứng đã biết']
    );
    setNewAllergy('');
    setChronicConditions(patientToEdit?.chronicConditions || []);
    setEmergencyName(patientToEdit?.emergencyContactName || '');
    setEmergencyPhone(patientToEdit?.emergencyContactPhone || '');
    setNotes(patientToEdit?.notes || '');
    setErrors({});

    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen, patientToEdit, currentYear]);

  const handleBirthYearChange = (val: string) => {
    setBirthYear(val);
    const num = Number(val);
    if (!isNaN(num) && num >= 1900 && num <= currentYear) {
      setAgeInput(String(currentYear - num));
    }
    if (errors.birthYear) setErrors((prev) => ({ ...prev, birthYear: '' }));
  };

  const handleAgeChange = (val: string) => {
    setAgeInput(val);
    const ageNum = Number(val);
    if (val !== '' && !isNaN(ageNum) && ageNum >= 0 && ageNum <= 125) {
      setBirthYear(currentYear - ageNum);
      if (errors.birthYear) setErrors((prev) => ({ ...prev, birthYear: '' }));
    }
  };

  const handleAddAllergy = (customText?: string) => {
    const textToAdd = (customText ?? newAllergy).trim();
    if (textToAdd) {
      const filtered = allergies.filter((a) => !a.toLowerCase().includes('không có'));
      if (!filtered.includes(textToAdd)) {
        setAllergies([...filtered, textToAdd]);
      }
      if (customText === undefined) {
        setNewAllergy('');
      }
    }
  };

  const handleRemoveAllergy = (index: number) => {
    const next = allergies.filter((_, i) => i !== index);
    setAllergies(next.length > 0 ? next : ['Không có tiền sử dị ứng đã biết']);
  };

  const toggleCondition = (cond: string) => {
    if (chronicConditions.includes(cond)) {
      setChronicConditions(chronicConditions.filter((c) => c !== cond));
    } else {
      setChronicConditions([...chronicConditions, cond]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const formattedName = formatVietnameseFullName(fullName);
    const partialData: Partial<Patient> = {
      fullName: formattedName,
      birthYear: Number(birthYear),
    };

    const validation = validatePatientForm(partialData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const savedPatient: Patient = {
      id: patientToEdit?.id || `pat-${Date.now()}`,
      patientCode:
        patientToEdit?.patientCode || generatePatientCode(existingCount),
      fullName: formattedName,
      birthYear: Number(birthYear),
      gender,
      phone: phone.trim(),
      address: address.trim(),
      healthInsuranceNumber: healthInsuranceNumber.trim(),
      bloodType,
      allergies: allergies.length > 0 ? allergies : ['Không có tiền sử dị ứng'],
      chronicConditions,
      emergencyContactName: emergencyName.trim(),
      emergencyContactPhone: emergencyPhone.trim(),
      notes: notes.trim(),
      createdAt: patientToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(savedPatient);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    fullName,
    birthYear,
    gender,
    phone,
    address,
    healthInsuranceNumber,
    bloodType,
    allergies,
    chronicConditions,
    emergencyName,
    emergencyPhone,
    notes,
  ]);

  if (!isOpen) return null;

  const calculatedAge = Math.max(0, currentYear - Number(birthYear || 1970));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-md max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-emerald-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {patientToEdit ? 'Chỉnh Sửa Hồ Sơ Bệnh Nhân' : 'Tiếp Nhận & Lưu Tên Bệnh Nhân Mới'}
              </h2>
              <p className="text-xs text-emerald-100">
                Nhập nhanh Họ tên + Tuổi (hoặc Năm sinh), Tiền sử bệnh nền &amp; Cảnh báo dị ứng thuốc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto custom-scrollbar">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Họ và tên bệnh nhân <span className="text-rose-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors({ ...errors, fullName: '' });
                }}
                onBlur={() => {
                  if (fullName.trim()) setFullName(formatVietnameseFullName(fullName));
                }}
                placeholder="VD: Nguyễn Văn An, Lê Thị Mỹ Hoa..."
                className={`w-full min-h-[42px] px-3.5 py-2 rounded-md border ${
                  errors.fullName ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                } focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:outline-hidden text-slate-900 dark:text-slate-100 font-bold text-sm sm:text-base transition-all`}
              />
              {errors.fullName && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.fullName}</p>
              )}
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Giới tính
              </label>
              <div className="grid grid-cols-3 gap-1.5 min-h-[42px]">
                {(
                  [
                    { value: 'nam', label: 'Nam' },
                    { value: 'nu', label: 'Nữ' },
                    { value: 'khac', label: 'Khác' },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={`rounded-md text-xs font-bold border transition-all cursor-pointer ${
                      gender === g.value
                        ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-800 dark:border-emerald-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Two-way Birth Year <-> Age */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nhập Tuổi hoặc Năm sinh <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="125"
                    value={ageInput}
                    onChange={(e) => handleAgeChange(e.target.value)}
                    placeholder="Tuổi (VD: 65)"
                    className="w-full min-h-[42px] pl-3 pr-10 py-2 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/30 text-slate-900 dark:text-slate-100 font-bold text-sm focus:ring-2 focus:ring-emerald-600/30 focus:outline-hidden"
                  />
                  <span className="absolute right-2.5 top-3 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 pointer-events-none">
                    tuổi
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="1900"
                    max={currentYear}
                    value={birthYear}
                    onChange={(e) => handleBirthYearChange(e.target.value)}
                    placeholder="Năm sinh"
                    className={`w-full min-h-[42px] pl-3 pr-10 py-2 rounded-md border ${
                      errors.birthYear ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    } text-slate-900 dark:text-slate-100 font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-600/30 focus:outline-hidden`}
                  />
                  <span className="absolute right-2 top-3 text-[10px] font-mono text-slate-400 pointer-events-none">
                    năm
                  </span>
                </div>
              </div>
              {errors.birthYear && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.birthYear}</p>
              )}
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0918 xxx xxx"
                  className="w-full min-h-[42px] pl-9 pr-3.5 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:outline-hidden font-mono text-sm transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Địa chỉ cư trú
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                  className="w-full min-h-[42px] pl-9 pr-3.5 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:outline-hidden text-sm transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Số thẻ BHYT (nếu có)
              </label>
              <input
                type="text"
                value={healthInsuranceNumber}
                onChange={(e) => setHealthInsuranceNumber(e.target.value.toUpperCase())}
                placeholder="GD-4-79-..."
                className="w-full min-h-[42px] px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:outline-hidden uppercase font-mono text-xs transition-all"
              />
            </div>

            {/* Guardian / Family Contact (Required by TT 52/2017/TT-BYT for children < 6yo and helpful for elderly) */}
            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>Người nhà / Người giám hộ {calculatedAge < 6 ? '(Bắt buộc với trẻ < 6 tuổi)' : '(Tùy chọn)'}</span>
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="VD: Nguyễn Thị Hoa (Con gái / Mẹ bé)"
                className="w-full min-h-[38px] px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-600/30 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                SĐT người nhà
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="0903 xxx xxx"
                className="w-full min-h-[38px] px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-emerald-600/30 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Chronic Conditions */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-md border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tiền sử bệnh nền (bấm chọn nhanh):
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CHRONIC_CONDITIONS.map((cond) => {
                const isSelected = chronicConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-800 dark:border-emerald-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergies (Vital for clinic prescription) */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-md border border-amber-200/80 dark:border-amber-800/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <label className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  Tiền sử dị ứng thuốc &amp; thực phẩm (Tự động cảnh báo khi kê đơn):
                </label>
              </div>
              <button
                type="button"
                onClick={() => setAllergies(['Không có tiền sử dị ứng đã biết'])}
                className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
              >
                Đặt lại: Không dị ứng
              </button>
            </div>

            {/* Active allergy chips */}
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((allergy, i) => {
                const isNone = allergy.toLowerCase().includes('không có');
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                      isNone
                        ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                    }`}
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(i)}
                      className="hover:text-rose-600 transition-colors cursor-pointer"
                      aria-label={`Xóa ${allergy}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Quick allergy presets */}
            <div className="flex flex-wrap gap-1">
              {QUICK_ALLERGY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleAddAllergy(opt)}
                  className="px-2 py-0.5 bg-white/90 dark:bg-slate-800 hover:bg-amber-200/70 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 rounded border border-amber-300/80 dark:border-amber-700 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  + {opt.replace('Dị ứng ', '')}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAllergy();
                  }
                }}
                placeholder="Gõ tên thuốc dị ứng khác rồi nhấn Enter (VD: Dị ứng Ciprofloxacin...)"
                className="flex-1 min-h-[38px] px-3 py-1.5 text-xs rounded-md border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => handleAddAllergy()}
                className="min-h-[38px] px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-md flex items-center gap-1 shadow-2xs border border-amber-600 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ghi chú bệnh án / Lưu ý riêng của Bác Sĩ Diệu
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Bệnh nhân tái khám định kỳ, đo huyết áp tại nhà, theo dõi chức năng thận..."
              className="w-full px-3.5 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:outline-hidden text-xs sm:text-sm transition-all"
            />
          </div>

          {/* Tuân thủ Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 & NĐ 356/2025/NĐ-CP */}
          <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <ShieldAlert className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-900 dark:text-emerald-300">Cam kết bảo mật dữ liệu y tế (Luật 91/2025/QH15):</strong> Hồ sơ bệnh án, tiền sử dị ứng và đơn thuốc được bảo vệ theo chế độ dữ liệu cá nhân nhạy cảm, lưu trữ an toàn nội bộ phục vụ mục đích khám chữa bệnh của Phòng khám BS. Trần Văn Diệu.
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 items-center">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline mr-auto">
              Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-mono">Esc</kbd> để đóng, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-mono">Ctrl+Enter</kbd> lưu &amp; khám ngay
            </span>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="min-h-[42px] px-5 py-2 rounded-md bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 border border-emerald-700/60 cursor-pointer"
            >
              <span>{patientToEdit ? 'Cập Nhật Hồ Sơ BN' : 'Lưu & Chọn Khám Ngay'}</span>
              <kbd className="hidden sm:inline px-1.5 py-0.2 text-[10px] font-mono bg-emerald-950/60 rounded border border-emerald-600/60">Ctrl+↵</kbd>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
