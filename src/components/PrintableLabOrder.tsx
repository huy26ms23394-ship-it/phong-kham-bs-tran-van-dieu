import React from 'react';
import {
  ClinicSettings,
  Patient,
  LabOrder,
} from '../types/medical';
import { LAB_TEST_CATALOG, DEFAULT_LAB_CENTERS } from '../data/labTestCatalog';
import { Printer, X, Download, ShieldCheck, MapPin, Phone, Building2 } from 'lucide-react';

interface PrintableLabOrderProps {
  labOrder: LabOrder;
  patient?: Patient | null;
  clinicInfo: ClinicSettings;
  onClose?: () => void;
}

export const PrintableLabOrder: React.FC<PrintableLabOrderProps> = ({
  labOrder,
  patient,
  clinicInfo,
  onClose,
}) => {
  const currentYear = new Date().getFullYear();
  const patientAge = patient?.birthYear ? currentYear - Number(patient.birthYear) : '';

  // Nhóm các xét nghiệm đã chọn theo danh mục
  const selectedTests = LAB_TEST_CATALOG.filter((item) =>
    labOrder.selectedTestIds.includes(item.id)
  );

  const handlePrint = () => {
    window.print();
  };

  const referralCenter = labOrder.referralCenter || DEFAULT_LAB_CENTERS[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          body {
            margin: 0 !important;
            padding: 8mm 12mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      {/* Container A4 / A5 Preview */}
      <div className="bg-white text-slate-900 rounded-lg max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:my-0 print:max-w-none print:rounded-none">
        {/* Top Control Bar (No Print) */}
        <div className="no-print bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">
              Phiếu Chỉ Định Cận Lâm Sàng &amp; Xét Nghiệm Ngoại Viện (548)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu Ngay</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Paper Area (Strict White, Standard Times New Roman Font) */}
        <div className="p-8 sm:p-10 font-serif text-slate-950 overflow-y-auto print:p-4 print:overflow-visible bg-white">
          {/* Header Phòng Khám */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                SỞ Y TẾ THÀNH PHỐ HỒ CHÍ MINH
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase">
                {clinicInfo.clinicName || 'PHÒNG KHÁM BÁC SĨ TRẦN VĂN DIỆU'}
              </h1>
              <div className="text-xs font-bold text-slate-800">
                {clinicInfo.doctorTitle || 'Bác Sĩ Chuyên Khoa Nội'} {clinicInfo.doctorName || 'Trần Văn Diệu'}
              </div>
              <div className="text-[11px] text-slate-700 mt-0.5">
                <span>CCHN: <strong>{clinicInfo.practicingCertificate || '04512/HCM-CCHN'}</strong></span>
                <span className="mx-1.5">•</span>
                <span>GPHĐ: <strong>{clinicInfo.licenseNumber || '08362/SYT-GPHĐ'}</strong></span>
              </div>
              <div className="text-[11px] text-slate-600">
                Đ/c: {clinicInfo.address || '158 Nguyễn Trãi, P. Bến Thành, Q.1, TP.HCM'} • ĐT: {clinicInfo.phone || '0913 678 999'}
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-mono font-bold text-slate-800">
                Mã phiếu: {labOrder.orderCode || 'XN-20261103-001'}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Ngày: {labOrder.orderDate ? new Date(labOrder.orderDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          {/* Destination Box: Kính gửi Trung tâm 548 */}
          <div className="my-3 p-3 rounded border border-slate-400 bg-slate-50/60 print:bg-white text-xs">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 uppercase">
              <span>Kính gửi:</span>
              <span className="underline decoration-1 underline-offset-2">{referralCenter.name}</span>
            </div>
            <div className="text-slate-700 text-[11px] mt-0.5">
              Địa chỉ: {referralCenter.address} • Hotline: {referralCenter.phone}
            </div>
          </div>

          {/* Title */}
          <div className="text-center my-4">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-950">
              PHIẾU CHỈ ĐỊNH XÉT NGHIỆM &amp; CẬN LÂM SÀNG
            </h2>
            <p className="text-xs italic text-slate-700 mt-0.5">
              (Giới thiệu bệnh nhân thực hiện dịch vụ cận lâm sàng ngoại viện)
            </p>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs border-b border-slate-300 pb-3 mb-4">
            <div>
              <span className="text-slate-600">Họ và tên người bệnh: </span>
              <strong className="text-sm font-bold uppercase">{patient?.fullName || 'Bệnh nhân'}</strong>
            </div>

            <div>
              <span className="text-slate-600">Năm sinh / Tuổi: </span>
              <strong>{patient?.birthYear || '---'} {patientAge ? `(${patientAge} tuổi)` : ''}</strong>
              <span className="mx-2 text-slate-400">|</span>
              <span className="text-slate-600">Giới tính: </span>
              <strong>{patient?.gender === 'nam' ? 'Nam' : 'Nữ'}</strong>
            </div>

            <div>
              <span className="text-slate-600">Địa chỉ: </span>
              <span>{patient?.address || 'TP. Hồ Chí Minh'}</span>
            </div>

            <div>
              <span className="text-slate-600">Số điện thoại: </span>
              <span className="font-mono">{patient?.phone || '---'}</span>
              {patient?.healthInsuranceNumber && (
                <>
                  <span className="mx-2 text-slate-400">|</span>
                  <span className="text-slate-600">BHYT: </span>
                  <span className="font-mono">{patient.healthInsuranceNumber}</span>
                </>
              )}
            </div>

            <div className="sm:col-span-2 pt-1">
              <span className="text-slate-600">Chẩn đoán sơ bộ / Lý do chỉ định: </span>
              <strong className="text-slate-900 text-[13px]">
                {labOrder.clinicalDiagnosis || 'Khám nội khoa tổng quát & kiểm tra định kỳ'}
              </strong>
            </div>
          </div>

          {/* Ordered Tests List (2 Columns with Checkboxes) */}
          <div className="mb-5">
            <div className="font-bold text-xs uppercase tracking-wide text-slate-900 border-b border-slate-900 pb-1 mb-2">
              NỘI DUNG YÊU CẦU XÉT NGHIỆM &amp; THĂM DÒ CHỨC NĂNG ({selectedTests.length} MỤC)
            </div>

            {selectedTests.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 italic">
                Chưa có xét nghiệm nào được chọn. Vui lòng tích chọn danh mục xét nghiệm.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {selectedTests.map((test, index) => (
                  <div key={test.id} className="flex items-start gap-2 py-1 border-b border-slate-100">
                    <span className="w-4 h-4 rounded border-2 border-slate-900 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div>
                      <span className="font-bold text-slate-900">
                        {index + 1}. {test.name}
                      </span>
                      {test.shortDesc && (
                        <div className="text-[10px] text-slate-600 italic">
                          ({test.shortDesc})
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Preparation Instructions (Notice) */}
          <div className="p-3 rounded border border-slate-300 bg-slate-50/60 print:bg-white text-xs mb-6 space-y-1">
            <div className="font-bold text-slate-900 uppercase text-[11px]">
              HƯỚNG DẪN NGƯỜI BỆNH TRƯỚC KHI ĐẾN TRUNG TÂM 548:
            </div>
            <ul className="list-disc list-inside text-slate-800 text-[11px] space-y-0.5 leading-relaxed">
              <li>
                <strong>Nhịn ăn sáng:</strong> Nhịn ăn từ 8 - 10 giờ trước khi lấy máu để các chỉ số Đường huyết, Mỡ máu và Siêu âm bụng đạt độ chính xác cao nhất (được uống nước lọc).
              </li>
              <li>
                {labOrder.doctorNotes || referralCenter.notes}
              </li>
              <li>
                <strong>Sau khi có kết quả:</strong> Bệnh nhân mang toàn bộ phiếu kết quả xét nghiệm, siêu âm, ECG quay về Phòng Khám để Bác Sĩ Trần Văn Diệu đọc kết quả và kê đơn thuốc điều trị.
              </li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 text-center text-xs pt-2">
            <div>
              <div className="font-bold text-slate-700">NGƯỜI BỆNH / NGƯỜI NHÀ</div>
              <div className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
              <div className="h-16" />
              <div className="font-bold">{patient?.fullName || ''}</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-600">
                TP. Hồ Chí Minh, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </div>
              <div className="font-bold text-slate-900 mt-0.5 uppercase">
                BÁC SĨ CHỈ ĐỊNH
              </div>
              <div className="text-[10px] text-slate-500 italic">(Ký, đóng dấu hoặc ghi rõ họ tên)</div>
              <div className="h-14 flex items-center justify-center">
                <span className="font-serif italic text-emerald-800 text-sm print:text-black">
                  BS. Trần Văn Diệu
                </span>
              </div>
              <div className="font-bold text-slate-950 text-xs">
                {clinicInfo.doctorTitle || 'Bác Sĩ Chuyên Khoa Nội'} {clinicInfo.doctorName || 'Trần Văn Diệu'}
              </div>
              <div className="text-[10px] font-mono text-slate-600">
                CCHN: {clinicInfo.practicingCertificate || '04512/HCM-CCHN'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer (No print) */}
        <div className="no-print bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Liên kết xét nghiệm chuyên nghiệp với Trung Tâm Chẩn Đoán Y Khoa 548.</span>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Phiếu (A4/A5)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
