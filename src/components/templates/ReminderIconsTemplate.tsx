import React from 'react';
import { Prescription, ClinicSettings } from '../../types/medical';
import { formatMealTiming } from '../../utils/medicationSchedule';
import { Sun, CloudSun, Sunset, Moon, Phone, AlertCircle, Heart } from 'lucide-react';

interface ReminderIconsTemplateProps {
  prescription: Prescription;
  clinicInfo: ClinicSettings;
}

export const ReminderIconsTemplate: React.FC<ReminderIconsTemplateProps> = ({
  prescription,
  clinicInfo,
}) => {
  const patientAge = prescription.patientBirthYear
    ? new Date().getFullYear() - Number(prescription.patientBirthYear)
    : '';

  return (
    <div
      className="reminder-icons-sheet bg-white text-black font-times relative mx-auto"
      style={{
        width: '148mm',
        minHeight: '210mm',
        padding: '7mm 8mm 6mm 8mm',
        boxSizing: 'border-box',
        fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
        color: '#000000',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-emerald-800 pb-1.5 mb-1.5">
        <div>
          <div className="text-[11pt] font-black uppercase tracking-tight text-emerald-950">
            {clinicInfo.clinicName || 'PHÒNG KHÁM BS. TRẦN VĂN DIỆU'}
          </div>
          <div className="text-[8pt] text-slate-700">
            {clinicInfo.address || '293/14 Tùng Thiện Vương, P.11, Q.8'} • ĐT: {clinicInfo.phone || '090.4492423'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8pt] font-mono font-bold text-slate-800">
            Mã: {prescription.prescriptionCode}
          </div>
          <div className="text-[7.5pt] text-slate-600">
            Ngày: {prescription.examinationDate}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-1.5">
        <h2 className="text-[15pt] font-black uppercase text-amber-900 tracking-wide">
          BẢNG LỊCH UỐNG THUỐC THEO BUỔI
        </h2>
        <p className="text-[8pt] italic text-slate-600">
          (Dành cho Người cao tuổi & Người nhà theo dõi - Hãy dán lên tủ lạnh hoặc nơi dễ thấy)
        </p>
      </div>

      {/* Patient info */}
      <div className="bg-amber-50/70 border border-amber-300 rounded p-1.5 mb-2 text-[8.5pt] flex justify-between items-center">
        <div>
          Bệnh nhân: <strong className="uppercase text-[9pt]">{prescription.patientName}</strong>
          {patientAge && <span> • <strong>{patientAge}</strong> tuổi</span>}
        </div>
        <div className="font-semibold text-slate-800 truncate max-w-[50%]">
          Chẩn đoán: {prescription.diagnosis}
        </div>
      </div>

      {/* 4 Dose Slots Table with Icons */}
      <div className="border border-slate-700 rounded overflow-hidden mb-2">
        <table className="w-full text-center border-collapse text-[8pt]">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-700 font-bold text-black text-[8.5pt]">
              <th className="p-1 border-r border-slate-400 w-[6%]">STT</th>
              <th className="p-1 border-r border-slate-400 text-left w-[36%]">Tên Thuốc & Hàm Lượng</th>
              <th className="p-1 border-r border-slate-400 w-[14%] bg-amber-100/70 text-amber-950">
                <div className="flex items-center justify-center gap-1 font-bold">
                  <span>☀️ Sáng</span>
                </div>
              </th>
              <th className="p-1 border-r border-slate-400 w-[14%] bg-orange-100/70 text-orange-950">
                <div className="flex items-center justify-center gap-1 font-bold">
                  <span>🌤️ Trưa</span>
                </div>
              </th>
              <th className="p-1 border-r border-slate-400 w-[14%] bg-indigo-100/70 text-indigo-950">
                <div className="flex items-center justify-center gap-1 font-bold">
                  <span>🌇 Chiều</span>
                </div>
              </th>
              <th className="p-1 w-[16%] bg-blue-100/70 text-blue-950">
                <div className="flex items-center justify-center gap-1 font-bold">
                  <span>🌙 Tối</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {prescription.medications.map((med, idx) => {
              const m = med.dosage?.morning ?? 0;
              const n = med.dosage?.noon ?? 0;
              const a = med.dosage?.afternoon ?? 0;
              const e = med.dosage?.evening ?? 0;

              return (
                <tr
                  key={med.id || idx}
                  className={`border-b border-slate-300 ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
                >
                  <td className="p-1 border-r border-slate-300 font-bold">{idx + 1}</td>
                  <td className="p-1 border-r border-slate-300 text-left">
                    <div className="font-bold text-[8.5pt] text-slate-950">
                      {med.name} {med.strength}
                    </div>
                    <div className="text-[7pt] text-emerald-800 font-semibold italic">
                      {formatMealTiming(med.dosage?.timing, med.dosage?.customTimingNote)}
                    </div>
                  </td>
                  {/* Sáng */}
                  <td className="p-1 border-r border-slate-300 font-bold bg-amber-50/40">
                    {m > 0 ? (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 font-black text-[9pt] border border-amber-300">
                        {m} {med.unit || 'v'}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-normal">-</span>
                    )}
                  </td>
                  {/* Trưa */}
                  <td className="p-1 border-r border-slate-300 font-bold bg-orange-50/40">
                    {n > 0 ? (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-orange-200 text-orange-950 font-black text-[9pt] border border-orange-300">
                        {n} {med.unit || 'v'}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-normal">-</span>
                    )}
                  </td>
                  {/* Chiều */}
                  <td className="p-1 border-r border-slate-300 font-bold bg-indigo-50/40">
                    {a > 0 ? (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-950 font-black text-[9pt] border border-indigo-300">
                        {a} {med.unit || 'v'}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-normal">-</span>
                    )}
                  </td>
                  {/* Tối */}
                  <td className="p-1 font-bold bg-blue-50/40">
                    {e > 0 ? (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-blue-200 text-blue-950 font-black text-[9pt] border border-blue-300">
                        {e} {med.unit || 'v'}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-normal">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Safety notes & Doctor's Advice */}
      <div className="grid grid-cols-2 gap-2 text-[7.5pt] leading-tight mb-2">
        <div className="border border-slate-300 rounded p-1.5 bg-slate-50">
          <div className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">
            <span>⚠️ 3 NGUYÊN TẮC UỐNG THUỐC:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-800">
            <li><strong>ĐÚNG GIỜ:</strong> Uống theo khung giờ cố định mỗi ngày.</li>
            <li><strong>ĐỦ NƯỚC:</strong> Uống với 1 cốc nước ấm đầy (200ml).</li>
            <li><strong>KHÔNG TỰ TĂNG LIỀU:</strong> Không uống bù gấp đôi khi quên.</li>
          </ul>
        </div>

        <div className="border border-slate-300 rounded p-1.5 bg-slate-50">
          <div className="font-bold text-slate-900 mb-0.5">
            LỜI DẶN BÁC SĨ:
          </div>
          <div className="italic text-slate-800">
            {prescription.doctorAdvice || 'Ăn nhạt, vận động nhẹ nhàng, kiêng thức ăn nhiều muối mỡ.'}
          </div>
          {prescription.followUpDate && (
            <div className="font-bold text-emerald-900 mt-1">
              Hẹn tái khám: {prescription.followUpDate}
            </div>
          )}
        </div>
      </div>

      {/* Footer Signatures & Emergency Contact */}
      <div className="flex justify-between items-end pt-1 border-t border-slate-400 text-[8pt]">
        <div>
          <div className="font-semibold text-rose-800 flex items-center gap-1">
            <Phone className="w-3 h-3 text-rose-600 inline" />
            <span>Hotline tư vấn khẩn cấp: {clinicInfo.phone || '090.4492423'}</span>
          </div>
          <div className="text-[7pt] text-slate-600">
            (Khi có triệu chứng bất thường, hãy liên hệ phòng khám ngay)
          </div>
        </div>

        <div className="text-center min-w-[130px]">
          <div className="text-[7.5pt] italic">
            BS. Điều trị
          </div>
          <div className="h-6"></div>
          <div className="font-bold text-[8.5pt] uppercase text-emerald-950">
            {clinicInfo.doctorName || 'BS. Trần Văn Diệu'}
          </div>
        </div>
      </div>
    </div>
  );
};
