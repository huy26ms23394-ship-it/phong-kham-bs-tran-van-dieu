import React from 'react';
import { Prescription, ClinicSettings, PrescriptionTemplateSettings } from '../../types/medical';
import { formatMealTiming } from '../../utils/medicationSchedule';
import { generateVietQrUrl } from '../../utils/vietQr';

interface ModernBytTemplateProps {
  prescription: Prescription;
  clinicInfo: ClinicSettings;
  template?: PrescriptionTemplateSettings;
  paperSize?: 'A5' | 'A4';
}

export const ModernBytTemplate: React.FC<ModernBytTemplateProps> = ({
  prescription,
  clinicInfo,
  template,
  paperSize = 'A5',
}) => {
  const isA5 = paperSize === 'A5';
  const patientAge = prescription.patientBirthYear
    ? new Date().getFullYear() - Number(prescription.patientBirthYear)
    : '';

  const parsedDate = prescription.examinationDate
    ? new Date(prescription.examinationDate)
    : new Date();
  const day = String(parsedDate.getDate()).padStart(2, '0');
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const year = parsedDate.getFullYear();

  const qrUrl =
    template?.showPaymentQr && clinicInfo.bankAccountNo && clinicInfo.bankId
      ? generateVietQrUrl({
          bankId: clinicInfo.bankId,
          accountNo: clinicInfo.bankAccountNo,
          accountName: clinicInfo.bankAccountName || clinicInfo.doctorName,
          amount: clinicInfo.consultationFee,
          memo: `KHAM ${prescription.prescriptionCode}`,
        })
      : null;

  return (
    <div
      className="modern-byt-sheet bg-white text-black font-times relative mx-auto"
      style={{
        width: isA5 ? '148mm' : '210mm',
        minHeight: isA5 ? '210mm' : '297mm',
        padding: isA5 ? '7mm 8mm 6mm 8mm' : '12mm 14mm 10mm 14mm',
        boxSizing: 'border-box',
        fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
        color: '#000000',
        backgroundColor: '#ffffff',
      }}
    >
      {/* 1. Header BYT */}
      <div className={`flex justify-between items-start border-b-2 border-emerald-900 ${isA5 ? 'pb-1.5 mb-1.5' : 'pb-3 mb-3'}`}>
        <div className="max-w-[70%]">
          <div className={`${isA5 ? 'text-[7.5pt]' : 'text-[9.5pt]'} uppercase font-bold text-slate-700`}>
            {template?.departmentName || 'SỞ Y TẾ TP. HỒ CHÍ MINH'}
          </div>
          <h1 className={`${isA5 ? 'text-[11pt]' : 'text-[15pt]'} font-bold uppercase tracking-tight text-emerald-950`}>
            {clinicInfo.clinicName || 'PHÒNG KHÁM BS. TRẦN VĂN DIỆU'}
          </h1>
          <p className={`${isA5 ? 'text-[7.5pt]' : 'text-[9pt]'} text-slate-800 leading-tight`}>
            {clinicInfo.address || '293/14 Tùng Thiện Vương, P.11, Q.8, TP.HCM'} • Hotline: {clinicInfo.phone || '090.4492423'}
          </p>
          {clinicInfo.licenseNumber && (
            <p className={`${isA5 ? 'text-[7pt]' : 'text-[8.5pt]'} text-slate-600`}>
              GPHĐ: {clinicInfo.licenseNumber}
            </p>
          )}
        </div>

        <div className="text-right">
          <div className={`${isA5 ? 'text-[8pt]' : 'text-[10pt]'} font-mono font-bold text-slate-900 border border-slate-300 rounded px-2 py-0.5 inline-block`}>
            Mã: {prescription.prescriptionCode}
          </div>
          <div className={`${isA5 ? 'text-[7pt]' : 'text-[8.5pt]'} text-slate-600 mt-0.5`}>
            Ngày: {prescription.examinationDate}
          </div>
        </div>
      </div>

      {/* 2. Tiêu đề Toa */}
      <div className={`text-center ${isA5 ? 'my-1' : 'my-2'}`}>
        <h2 className={`${isA5 ? 'text-[15pt]' : 'text-[20pt]'} font-black uppercase text-emerald-900 tracking-wider`}>
          {template?.prescriptionTitle || 'ĐƠN THUỐC NGOẠI TRÚ'}
        </h2>
        <p className={`${isA5 ? 'text-[7pt]' : 'text-[8.5pt]'} italic text-slate-600`}>
          (Khám và điều trị ngoại trú theo chuẩn Bộ Y Tế)
        </p>
      </div>

      {/* 3. Thông tin hành chính & Chẩn đoán */}
      <div className={`border border-slate-300 rounded p-1.5 ${isA5 ? 'text-[8pt] space-y-0.5 mb-2' : 'text-[10pt] space-y-1 mb-3'} bg-slate-50/50`}>
        <div className="flex justify-between items-baseline">
          <div className="flex-1">
            Họ và tên: <strong className="uppercase text-[9pt]">{prescription.patientName}</strong>
          </div>
          <div className="w-[20%] text-center">
            Tuổi: <strong>{patientAge || '—'}</strong> ({prescription.patientGender || 'Nam'})
          </div>
          <div className="w-[30%] text-right font-mono">
            SĐT: {prescription.patientPhone || '—'}
          </div>
        </div>

        <div className="flex justify-between items-baseline">
          <div className="flex-1 truncate">
            Địa chỉ: {prescription.patientAddress || 'TP. Hồ Chí Minh'}
          </div>
          {prescription.vitalSigns && (
            <div className="font-mono text-slate-800 pl-2 shrink-0">
              HA: <strong>{prescription.vitalSigns.bloodPressure || `${prescription.vitalSigns.bloodPressureSystolic || 120}/${prescription.vitalSigns.bloodPressureDiastolic || 80}`} mmHg</strong> • Mạch: <strong>{prescription.vitalSigns.heartRate || 75} l/p</strong>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-0.5">
          Chẩn đoán lâm sàng: <strong className="text-emerald-950">{prescription.diagnosis}</strong>
        </div>
      </div>

      {/* 4. Bảng danh sách thuốc (Khoa học & Đầy đủ liều) */}
      <div className="border border-slate-300 rounded overflow-hidden mb-2">
        <table className="w-full text-center border-collapse text-[7.5pt]">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-400 font-bold text-black text-[8pt]">
              <th className="p-1 border-r border-slate-300 w-[5%]">STT</th>
              <th className="p-1 border-r border-slate-300 text-left w-[42%]">Tên Biệt Dược, Hoạt Chất & Cách Dùng</th>
              <th className="p-1 border-r border-slate-300 w-[9%] bg-amber-50">Sáng</th>
              <th className="p-1 border-r border-slate-300 w-[9%] bg-orange-50">Trưa</th>
              <th className="p-1 border-r border-slate-300 w-[9%] bg-indigo-50">Chiều</th>
              <th className="p-1 border-r border-slate-300 w-[9%] bg-blue-50">Tối</th>
              <th className="p-1 border-r border-slate-300 w-[10%]">SL</th>
              <th className="p-1 w-[7%]">ĐVT</th>
            </tr>
          </thead>
          <tbody>
            {prescription.medications.map((med, idx) => {
              const m = med.dosage?.morning ?? 0;
              const n = med.dosage?.noon ?? 0;
              const a = med.dosage?.afternoon ?? 0;
              const e = med.dosage?.evening ?? 0;

              return (
                <tr key={med.id || idx} className={`border-b border-slate-200 ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}>
                  <td className="p-1 border-r border-slate-200 font-bold">{idx + 1}</td>
                  <td className="p-1 border-r border-slate-200 text-left">
                    <div className="font-bold text-[8.5pt] text-slate-950">
                      {med.name} {med.strength}
                    </div>
                    {med.activeIngredient && (
                      <div className="text-[7pt] text-slate-600 italic">
                        ({med.activeIngredient})
                      </div>
                    )}
                    <div className="text-[7.5pt] text-emerald-900 font-medium">
                      {formatMealTiming(med.dosage?.timing, med.dosage?.customTimingNote)}
                    </div>
                  </td>
                  <td className="p-1 border-r border-slate-200 font-bold bg-amber-50/30">
                    {m > 0 ? `${m}` : '-'}
                  </td>
                  <td className="p-1 border-r border-slate-200 font-bold bg-orange-50/30">
                    {n > 0 ? `${n}` : '-'}
                  </td>
                  <td className="p-1 border-r border-slate-200 font-bold bg-indigo-50/30">
                    {a > 0 ? `${a}` : '-'}
                  </td>
                  <td className="p-1 border-r border-slate-200 font-bold bg-blue-50/30">
                    {e > 0 ? `${e}` : '-'}
                  </td>
                  <td className="p-1 border-r border-slate-200 font-bold text-[8.5pt]">
                    {med.quantity}
                  </td>
                  <td className="p-1 text-slate-700">
                    {med.unit || 'Viên'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Lời dặn Bác sĩ & Mã VietQR */}
      <div className="flex justify-between items-start gap-3 my-2 text-[8pt]">
        <div className="flex-1 border border-slate-200 rounded p-1.5 bg-slate-50/60 leading-tight">
          <div className="font-bold uppercase text-emerald-950 mb-0.5">
            LỜI DẶN CỦA BÁC SĨ:
          </div>
          <div className="italic text-slate-800">
            {prescription.doctorAdvice || 'Tái khám theo hẹn hoặc khi có dấu hiệu bất thường. Uống thuốc đúng giờ.'}
          </div>
          {prescription.followUpDate && (
            <div className="font-bold text-slate-900 mt-1">
              Hẹn tái khám ngày: {prescription.followUpDate}
            </div>
          )}
        </div>

        {qrUrl && (
          <div className="border border-blue-200 rounded p-1 text-center bg-blue-50/40 shrink-0">
            <img src={qrUrl} alt="VietQR" className="w-16 h-16 mx-auto object-contain" />
            <div className="text-[6.5pt] font-mono font-bold text-blue-900 mt-0.5">
              VietQR Thanh Toán
            </div>
          </div>
        )}
      </div>

      {/* 6. Chân trang & Chữ ký */}
      <div className="flex justify-between items-end pt-1.5 text-[8pt]">
        <div className="text-center w-[40%]">
          <div className="text-[7.5pt] italic text-slate-600">Bệnh nhân / Người nhà ký nhận</div>
          <div className="h-10"></div>
          <div className="font-semibold text-slate-700">{prescription.patientName}</div>
        </div>

        <div className="text-center w-[45%]">
          <div className="italic text-[7.5pt]">
            TP.HCM, Ngày {day} tháng {month} năm {year}
          </div>
          <div className="font-bold text-[8pt] uppercase mt-0.5">
            BÁC SĨ KHÁM BỆNH
          </div>
          <div className="h-9"></div>
          <div className="font-bold text-[9pt] uppercase text-emerald-950">
            {clinicInfo.doctorName || 'BS. Trần Văn Diệu'}
          </div>
        </div>
      </div>

      {/* Ghi chú pháp lý cuối trang */}
      <div className="mt-2 pt-1 border-t border-slate-300 text-[6.5pt] text-slate-500 flex justify-between items-center">
        <span>Toa thuốc có giá trị mua và sử dụng theo đúng chỉ định y khoa.</span>
        <span>Phòng Khám BS. Trần Văn Diệu • Lưu trữ điện tử an toàn</span>
      </div>
    </div>
  );
};
