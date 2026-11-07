import React from 'react';
import { Prescription, ClinicSettings } from '../../types/medical';
import { formatTraditionalDoseSchedule } from '../../utils/prescriptionTemplateFormats';

interface TraditionalA5TemplateProps {
  prescription: Prescription;
  clinicInfo: ClinicSettings;
  isOverlay?: boolean; // Mẫu 4: Chế độ in đè lên phôi giấy có sẵn (ẩn chữ tĩnh, chỉ in dữ liệu)
  autoCollapseEmptyLines?: boolean;
}

export const TraditionalA5Template: React.FC<TraditionalA5TemplateProps> = ({
  prescription,
  clinicInfo,
  isOverlay = false,
  autoCollapseEmptyLines = false,
}) => {
  const patientAge =
    prescription.patientBirthYear
      ? new Date().getFullYear() - Number(prescription.patientBirthYear)
      : '';

  const parsedDate = prescription.examinationDate
    ? new Date(prescription.examinationDate)
    : new Date();
  const day = String(parsedDate.getDate()).padStart(2, '0');
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const year = String(parsedDate.getFullYear()).slice(-2);

  const vitals = prescription.vitalSigns;
  const bpText = vitals?.bloodPressure
    ? vitals.bloodPressure
    : vitals?.bloodPressureSystolic && vitals?.bloodPressureDiastolic
    ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}`
    : '';
  const hrText = vitals?.heartRate ? `${vitals.heartRate}` : '';

  // Danh sách thuốc: Chuẩn 6 dòng như trên tờ toa giấy thực tế của Bác sĩ Diệu
  const medCount = prescription.medications.length;
  const totalSlots = autoCollapseEmptyLines && medCount > 6 ? medCount : Math.max(6, medCount);
  const slots = Array.from({ length: totalSlots }, (_, i) => prescription.medications[i] || null);

  // Helper class để ẩn nhãn tĩnh khi ở chế độ Mẫu 4 (in đè phôi giấy)
  const staticClass = isOverlay ? 'opacity-0 select-none' : '';
  const staticBorder = isOverlay ? 'border-transparent' : 'border-black';

  return (
    <div
      className="traditional-a5-sheet bg-white text-black font-times relative mx-auto select-none"
      style={{
        width: '148mm',
        minHeight: '210mm',
        padding: '7mm 9mm 6mm 9mm',
        boxSizing: 'border-box',
        fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
        color: '#000000',
        backgroundColor: '#ffffff',
      }}
    >
      {/* 1. HEADER (2 Cột cân đối theo mẫu gốc) */}
      <div className="flex justify-between items-start pb-1">
        {/* Cột trái: Thông tin Bác sĩ & Phòng khám */}
        <div className="w-[58%] text-center">
          <h1
            className={`font-bold tracking-tight text-[13.5pt] uppercase leading-none pb-0.5 ${staticClass}`}
            style={{ color: isOverlay ? 'transparent' : '#000000' }}
          >
            {clinicInfo.doctorName || 'BS. Trần Văn Diệu'}
          </h1>
          <p className={`text-[8.5pt] leading-tight text-slate-800 ${staticClass}`}>
            {clinicInfo.address || '293/14, Tùng Thiện Vương - P.11 - Q.8'}
          </p>
          <p className={`text-[8.5pt] leading-tight text-slate-800 ${staticClass}`}>
            {clinicInfo.phone ? `ĐT: ${clinicInfo.phone}` : 'ĐT: 3.9500949 - DĐ: 090.4492423'}
          </p>
        </div>

        {/* Cột phải: Số HS & Giờ khám */}
        <div className="w-[40%] text-left pl-2 text-[8.5pt] leading-tight">
          <div className="flex items-baseline gap-1">
            <span className={`font-semibold ${staticClass}`}>Số HS:</span>
            <span className="font-mono font-bold text-[9pt] border-b border-dotted border-black flex-1 pl-1">
              {prescription.prescriptionCode || prescription.patientId || ''}
            </span>
          </div>
          <div className={`mt-0.5 text-slate-800 ${staticClass}`}>
            <span>Ngày thường: 15h – 19h</span>
          </div>
          <div className={`text-slate-800 ${staticClass}`}>
            <span>Chủ Nhật: 5h30 – 9h</span>
          </div>
        </div>
      </div>

      {/* 2. TIÊU ĐỀ TOA THUỐC */}
      <div className="text-center my-1.5">
        <h2
          className={`text-[19pt] font-black uppercase tracking-wider ${staticClass}`}
          style={{ color: isOverlay ? 'transparent' : '#046c4e' }}
        >
          TOA THUỐC
        </h2>
      </div>

      {/* 3. KHỐI HÀNH CHÍNH & SINH HIỆU */}
      <div className="text-[9pt] leading-[1.35] space-y-0.5 mb-1.5">
        {/* Dòng 1: Họ tên (75%) + Tuổi (25%) */}
        <div className="flex items-baseline">
          <div className="flex-1 flex items-baseline">
            <span className={`font-semibold shrink-0 ${staticClass}`}>- Họ và tên :&nbsp;</span>
            <span className="font-bold uppercase text-[9.5pt] border-b border-dotted border-black flex-1 pl-1 truncate">
              {prescription.patientName}
            </span>
          </div>
          <div className="w-[25%] flex items-baseline pl-2">
            <span className={`font-semibold shrink-0 ${staticClass}`}>Tuổi :&nbsp;</span>
            <span className="font-bold border-b border-dotted border-black flex-1 text-center">
              {patientAge ? `${patientAge}` : ''}
            </span>
          </div>
        </div>

        {/* Dòng 2: Địa chỉ */}
        <div className="flex items-baseline">
          <span className={`font-semibold shrink-0 ${staticClass}`}>- Địa chỉ :&nbsp;</span>
          <span className="border-b border-dotted border-black flex-1 pl-1 text-[8.5pt] truncate">
            {prescription.patientAddress || 'TP. Hồ Chí Minh'}
          </span>
        </div>

        {/* Dòng 3: Định bệnh */}
        <div className="flex items-baseline">
          <span className={`font-semibold shrink-0 ${staticClass}`}>- Định bệnh :&nbsp;</span>
          <span className="font-semibold border-b border-dotted border-black flex-1 pl-1 text-[8.5pt] truncate">
            {prescription.diagnosis}
          </span>
        </div>

        {/* Dòng 4: Đường chấm bên trái + Huyết áp & Tần số tim căn sang phải */}
        <div className="flex items-baseline text-[8.5pt] pt-0.5">
          <div className={`border-b border-dotted border-black flex-1 h-3 mr-4 ${staticBorder}`} />
          <div className="flex items-baseline gap-4 shrink-0">
            <div className="flex items-baseline">
              <span className={`font-semibold ${staticClass}`}>H.A:&nbsp;</span>
              <span className="font-mono font-bold border-b border-dotted border-black min-w-[70px] text-center">
                {bpText ? `${bpText} mmHg` : '......................'}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className={`font-semibold ${staticClass}`}>Tần số tim:&nbsp;</span>
              <span className="font-mono font-bold border-b border-dotted border-black min-w-[55px] text-center">
                {hrText ? `${hrText} l/p` : '................'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. KHỐI DANH SÁCH THUỐC (Chuẩn 6 mục 1- -> 6-) */}
      <div className="space-y-1 mb-2">
        {slots.map((med, index) => {
          const itemNumber = `${index + 1}-`;

          if (!med) {
            // Mục trống (giữ nguyên layout dòng chấm của phôi toa)
            return (
              <div key={`empty-slot-${index}`} className="text-[8.5pt] leading-tight">
                <div className="flex items-baseline">
                  <span className={`font-bold w-6 shrink-0 ${staticClass}`}>{itemNumber}</span>
                  <div className={`border-b border-dotted border-slate-400 flex-1 h-3 ${staticBorder}`} />
                </div>
                <div className={`pl-6 italic text-slate-700 mt-0.5 flex items-baseline justify-between ${staticClass}`}>
                  <span>Ngày uống .......... lần, mỗi lần: ....................</span>
                  <span>Trước, sau ăn</span>
                </div>
              </div>
            );
          }

          // Mục có thuốc thực tế
          const schedule = formatTraditionalDoseSchedule(med);
          const isAfterMeal = schedule.timing === 'sau_an' || schedule.timing === 'trong_an';
          const isBeforeMeal = schedule.timing === 'truoc_an';

          return (
            <div key={med.id || `med-${index}`} className="text-[8.5pt] leading-tight">
              {/* Dòng 1: Tên thuốc + Hàm lượng + Hoạt chất + Số lượng */}
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline flex-1 min-w-0 pr-2">
                  <span className={`font-bold w-6 shrink-0 ${staticClass}`}>{itemNumber}</span>
                  <span className="font-bold text-[9pt]">
                    {med.name} {med.strength && <span className="font-bold">{med.strength}</span>}
                  </span>
                  {med.activeIngredient && (
                    <span className="text-[8pt] text-slate-800 ml-1 italic truncate">
                      ({med.activeIngredient})
                    </span>
                  )}
                  {/* Đường kẻ chấm nối sang số lượng */}
                  <span className={`border-b border-dotted border-slate-300 flex-1 mx-1.5 h-2 ${isOverlay ? 'border-transparent' : ''}`} />
                </div>
                <div className="shrink-0 font-bold text-[8.5pt]">
                  {isOverlay ? (
                    <span>{med.totalQuantity ?? med.quantity} {med.unit || 'viên'}</span>
                  ) : (
                    <span>Số lượng: {med.totalQuantity ?? med.quantity} {med.unit || 'viên'}</span>
                  )}
                </div>
              </div>

              {/* Dòng 2: Cách dùng quy đổi (thụt lề, in nghiêng) */}
              <div className="pl-6 text-[8pt] flex items-baseline justify-between mt-0.5">
                <div className="italic text-slate-900">
                  <span className={staticClass}>Ngày uống&nbsp;</span>
                  <strong className="not-italic font-bold underline px-0.5">
                    {schedule.timesPerDay || 1}
                  </strong>
                  <span className={staticClass}>&nbsp;lần, mỗi lần:&nbsp;</span>
                  <strong className="not-italic font-bold">
                    {schedule.perDoseText}
                  </strong>
                </div>

                {/* Khoanh tròn Trước / Sau ăn theo thói quen bút ký của Bác sĩ */}
                <div className="text-[7.5pt] shrink-0 pl-2">
                  {isOverlay ? (
                    // Ở chế độ in đè phôi, chỉ in đúng khoanh tròn chữ Bác sĩ cần đánh dấu
                    <span className="font-bold not-italic">
                      {isBeforeMeal && <span className="border-2 border-black rounded-full px-1.5 py-0.2">Trước</span>}
                      {isAfterMeal && <span className="border-2 border-black rounded-full px-1.5 py-0.2">sau ăn</span>}
                    </span>
                  ) : (
                    // Ở chế độ in trọn tờ giấy, hiển thị cả cụm và khoanh tròn/gạch chân đúng vị trí
                    <span>
                      {isBeforeMeal ? (
                        <>
                          <span className="inline-block border-2 border-emerald-900 rounded-full px-1.5 py-0.1 font-bold not-italic text-emerald-950">
                            Trước
                          </span>
                          <span className="line-through text-slate-400 opacity-60 ml-1">, sau ăn</span>
                        </>
                      ) : isAfterMeal ? (
                        <>
                          <span className="line-through text-slate-400 opacity-60 mr-1">Trước, </span>
                          <span className="inline-block border-2 border-emerald-900 rounded-full px-1.5 py-0.1 font-bold not-italic text-emerald-950">
                            sau ăn
                          </span>
                        </>
                      ) : (
                        <span>Trước, sau ăn</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. KHỐI LỜI DẶN & CHỮ KÝ BÁC SĨ */}
      <div className="flex justify-between items-start pt-1.5 text-[8.5pt]">
        {/* Khối Lời Dặn (Bên Trái) */}
        <div className="w-[52%] pr-2">
          <div className="mb-0.5">
            <span className={`font-bold italic underline uppercase text-[8.5pt] ${staticClass}`}>
              LỜI DẶN :&nbsp;
            </span>
          </div>
          <div className="text-[8pt] italic text-slate-900 leading-tight">
            {prescription.doctorAdvice || clinicInfo.consultingHours || 'Uống thuốc đúng giờ, ăn uống kiêng khem theo hướng dẫn.'}
          </div>
          {prescription.followUpDate && (
            <div className="text-[8pt] font-semibold mt-1">
              <span className={staticClass}>Tái khám:&nbsp;</span>
              <span>{prescription.followUpDate}</span>
            </div>
          )}
        </div>

        {/* Khối Ký Tên (Bên Phải) */}
        <div className="w-[45%] text-center text-[8.5pt]">
          <div className="italic text-[8pt]">
            <span className={staticClass}>Ngày&nbsp;</span>
            <span className="font-bold not-italic">{day}</span>
            <span className={staticClass}>&nbsp;tháng&nbsp;</span>
            <span className="font-bold not-italic">{month}</span>
            <span className={staticClass}>&nbsp;năm 20</span>
            <span className="font-bold not-italic">{year}</span>
          </div>

          <div className={`font-semibold mt-0.5 ${staticClass}`}>
            BS. Điều trị
          </div>

          {/* Khoảng trống ký tên chuẩn thực tế */}
          <div className="h-10 my-0.5 flex items-center justify-center">
            {/* Nếu có chữ ký số hoặc dấu mộc, hiển thị mờ */}
          </div>

          <div className={`font-bold text-[9pt] uppercase ${staticClass}`}>
            {clinicInfo.doctorName || 'BS. Trần Văn Diệu'}
          </div>
        </div>
      </div>

      {/* 6. DÒNG CHÚ Ý CUỐI TOA (Ngăn cách bởi đường kẻ ngang) */}
      <div className="mt-2 pt-1 border-t border-black text-[7.5pt] leading-tight text-slate-800">
        <div className={staticClass}>
          <strong>CHÚ Ý :</strong> - Y .Bác sĩ cần ghi rõ tên thuốc, hàm lượng và cách dùng.
        </div>
        <div className={`pl-11 ${staticClass}`}>
          - Mỗi lần khám lại, bệnh nhân cần đem theo toa này.
        </div>
      </div>
    </div>
  );
};
