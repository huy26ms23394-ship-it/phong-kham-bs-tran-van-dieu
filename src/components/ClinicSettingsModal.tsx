import React, { useState, useEffect, useRef } from 'react';
import { ClinicSettings } from '../types/medical';
import { Building, X, CreditCard, DollarSign, Upload, QrCode, Trash2, Crop, Sparkles } from 'lucide-react';
import { POPULAR_VIETNAMESE_BANKS, generateVietQrUrl } from '../utils/vietQr';
import { ImageCropperModal } from './ImageCropperModal';

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
  // Ngân hàng & Mã QR
  const [bankId, setBankId] = useState(clinicInfo.bankId || 'VCB');
  const [bankAccountNo, setBankAccountNo] = useState(clinicInfo.bankAccountNo || '0071000987654');
  const [bankAccountName, setBankAccountName] = useState(clinicInfo.bankAccountName || 'TRAN VAN DIEU');
  const [consultationFee, setConsultationFee] = useState<number>(clinicInfo.consultationFee ?? 120000);
  const [bankQrImage, setBankQrImage] = useState<string | undefined>(clinicInfo.bankQrImage);

  // Cắt ảnh
  const [selectedRawImage, setSelectedRawImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setBankQrImage(clinicInfo.bankQrImage);
  }, [isOpen, clinicInfo]);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setSelectedRawImage(event.target.result);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedBase64: string) => {
    setBankQrImage(croppedBase64);
    setSelectedRawImage(null);
  };

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
      bankQrImage,
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

          {/* Cấu hình Ngân hàng & Mã QR */}
          <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-3">
            <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cấu Hình Tài Khoản Ngân Hàng &amp; Mã QR</span>
            </h3>

            {/* Input file ẩn để tải ảnh mã QR */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSelectFile}
            />

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

              <div className="sm:col-span-2">
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
            </div>

            {/* Mục Tải ảnh mã QR & cắt theo tỉ lệ 3:4 */}
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex flex-col sm:flex-row items-center gap-3 bg-white/60 dark:bg-slate-850 p-2.5 rounded-md">
              <div className="w-16 h-21 sm:w-20 sm:h-27 aspect-3/4 rounded border border-slate-300 dark:border-slate-700 overflow-hidden bg-white shrink-0 flex items-center justify-center shadow-xs">
                {bankQrImage ? (
                  <img
                    src={bankQrImage}
                    alt="Ảnh mã QR tỉ lệ 3:4"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={generateVietQrUrl({
                      bankId,
                      accountNo: bankAccountNo,
                      accountName: bankAccountName,
                      amount: 0,
                      content: 'PHONG KHAM',
                      template: 'qr_only',
                    })}
                    alt="VietQR mặc định"
                    className="w-full h-full object-contain p-1"
                  />
                )}
              </div>

              <div className="flex-1 space-y-1.5 text-center sm:text-left w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ảnh mã QR ngân hàng (Tỉ lệ chuẩn 3:4)</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-bold">
                    3:4
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {bankQrImage
                    ? 'Đã tải lên ảnh mã QR tùy chỉnh 3:4. Ảnh này sẽ hiển thị cho bệnh nhân quét và in trên toa thuốc.'
                    : 'Chưa tải ảnh riêng. Hệ thống đang dùng mã VietQR mặc định. Bấm nút dưới để tải ảnh poster/standee ngân hàng và cắt theo tỉ lệ 3:4.'}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{bankQrImage ? 'Đổi Ảnh Mã QR' : 'Tải File Ảnh Lên (Cắt 3:4)'}</span>
                  </button>

                  {bankQrImage && (
                    <button
                      type="button"
                      onClick={() => setBankQrImage(undefined)}
                      className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors border border-rose-200 dark:border-rose-800"
                      title="Xóa ảnh tùy chỉnh, dùng VietQR mặc định"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Ảnh</span>
                    </button>
                  )}
                </div>
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

      {/* Modal cắt ảnh mã QR chuẩn 3:4 */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={selectedRawImage}
        onClose={() => {
          setIsCropperOpen(false);
          setSelectedRawImage(null);
        }}
        onCropComplete={handleCropComplete}
        aspectRatio={3 / 4}
      />
    </div>
  );
};
