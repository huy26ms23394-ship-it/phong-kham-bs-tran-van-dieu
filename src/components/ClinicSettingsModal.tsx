import React, { useState, useEffect } from 'react';
import { ClinicSettings } from '../types/medical';
import { Building, X, CreditCard, DollarSign } from 'lucide-react';
import { POPULAR_VIETNAMESE_BANKS } from '../utils/vietQr';

interface ClinicSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicSettings;
  onSave: (settings: ClinicSettings) => void;
}

export const ClinicSettingsModal: React.FC<ClinicSettingsModalProps> = ({
  isOpen,
  onClose,
  clinicInfo,
  onSave,
}) => {
  const [clinicName, setClinicName] = useState(clinicInfo.clinicName);
  const [doctorName, setDoctorName] = useState(clinicInfo.doctorName);
  const [doctorTitle, setDoctorTitle] = useState(clinicInfo.doctorTitle);
  const [specialty, setSpecialty] = useState(clinicInfo.specialty);
  const [licenseNumber, setLicenseNumber] = useState(clinicInfo.licenseNumber);
  const [practicingCertificate, setPracticingCertificate] = useState(
    clinicInfo.practicingCertificate || '04512/HCM-CCHN'
  );
  const [address, setAddress] = useState(clinicInfo.address);
  const [phone, setPhone] = useState(clinicInfo.phone);
  const [consultingHours, setConsultingHours] = useState(clinicInfo.consultingHours);
  // Ngân hàng & Phí khám
  const [bankId, setBankId] = useState(clinicInfo.bankId || 'VCB');
  const [bankAccountNo, setBankAccountNo] = useState(clinicInfo.bankAccountNo || '0071000987654');
  const [bankAccountName, setBankAccountName] = useState(clinicInfo.bankAccountName || 'TRAN VAN DIEU');
  const [consultationFee, setConsultationFee] = useState<number>(clinicInfo.consultationFee ?? 120000);

  useEffect(() => {
    if (!isOpen) return;
    setClinicName(clinicInfo.clinicName);
    setDoctorName(clinicInfo.doctorName);
    setDoctorTitle(clinicInfo.doctorTitle);
    setSpecialty(clinicInfo.specialty);
    setLicenseNumber(clinicInfo.licenseNumber);
    setPracticingCertificate(clinicInfo.practicingCertificate || '04512/HCM-CCHN');
    setAddress(clinicInfo.address);
    setPhone(clinicInfo.phone);
    setConsultingHours(clinicInfo.consultingHours);
    setBankId(clinicInfo.bankId || 'VCB');
    setBankAccountNo(clinicInfo.bankAccountNo || '0071000987654');
    setBankAccountName(clinicInfo.bankAccountName || 'TRAN VAN DIEU');
    setConsultationFee(clinicInfo.consultationFee ?? 120000);
  }, [isOpen, clinicInfo]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bankObj = POPULAR_VIETNAMESE_BANKS.find((b) => b.id === bankId);
    onSave({
      clinicName: clinicName.trim() || 'PHÒNG KHÁM BÁC SĨ TRẦN VĂN DIỆU',
      doctorName: doctorName.trim() || 'Bác Sĩ Trần Văn Diệu',
      doctorTitle: doctorTitle.trim() || 'Bác Sĩ Chuyên Khoa',
      specialty: specialty.trim() || 'Đa Khoa Gia Đình',
      licenseNumber: licenseNumber.trim() || '08362/SYT-GPHĐ',
      practicingCertificate: practicingCertificate.trim() || '04512/HCM-CCHN',
      address: address.trim(),
      phone: phone.trim(),
      consultingHours: consultingHours.trim(),
      bankId,
      bankName: bankObj?.name || 'Ngân hàng',
      bankAccountNo: bankAccountNo.trim(),
      bankAccountName: bankAccountName.trim().toUpperCase(),
      consultationFee: Number(consultationFee) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-md max-w-xl w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-6 transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white p-5 flex items-center justify-between border-b border-emerald-700 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/15 flex items-center justify-center border border-white/20">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Cấu Hình Thông Tin Phòng Khám</h2>
              <p className="text-xs text-emerald-100">
                Thông tin pháp lý in trên tiêu đề &amp; chữ ký đơn thuốc (Đồng bộ LAN)
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tên cơ sở phòng khám (In tiêu đề đơn thuốc)
            </label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 uppercase"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tên Bác Sĩ phụ trách
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-emerald-900 dark:text-emerald-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Học vị / Chức danh
              </label>
              <input
                type="text"
                value={doctorTitle}
                onChange={(e) => setDoctorTitle(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Chuyên khoa khám bệnh
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Số Giấy phép hoạt động (GPHĐ Cơ sở)
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="VD: 08362/SYT-GPHĐ"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Số Chứng chỉ hành nghề (CCHN Bác sĩ)
              </label>
              <input
                type="text"
                value={practicingCertificate}
                onChange={(e) => setPracticingCertificate(e.target.value)}
                placeholder="VD: 04512/HCM-CCHN"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Số Hotline / Điện thoại
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Thời gian làm việc / Giờ khám bệnh
              </label>
              <input
                type="text"
                value={consultingHours}
                onChange={(e) => setConsultingHours(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Địa chỉ phòng khám / Địa chỉ nhà
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Cấu hình Ngân hàng & Thu phí khám */}
          <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-3">
            <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cấu Hình Thu Phí &amp; Tài Khoản VietQR</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ngân hàng nhận thanh toán
                </label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                >
                  {POPULAR_VIETNAMESE_BANKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shortName} ({b.id}) - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số tài khoản ngân hàng
                </label>
                <input
                  type="text"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  placeholder="0071000987654"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên chủ tài khoản (In hoa không dấu)
                </label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="TRAN VAN DIEU"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tiền công khám mặc định (VNĐ)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value) || 0)}
                  placeholder="120000"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-md font-semibold text-xs transition-colors border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="min-h-[42px] px-5 py-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-md font-bold text-xs shadow-xs transition-colors border border-emerald-700 dark:border-emerald-600 cursor-pointer"
            >
              Lưu Cấu Hình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
