import React, { useState, useMemo } from 'react';
import { Patient, Prescription, PrescribedMedication } from '../types/medical';
import {
  Activity,
  TrendingUp,
  X,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Minus,
  Check,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  BarChart2,
} from 'lucide-react';

interface PatientTrendChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  prescriptions: Prescription[];
  currentDraftMedications?: PrescribedMedication[];
}

export const PatientTrendChartModal: React.FC<PatientTrendChartModalProps> = ({
  isOpen,
  onClose,
  patient,
  prescriptions,
  currentDraftMedications = [],
}) => {
  const [activeTab, setActiveTab] = useState<'vitals' | 'med_diff'>('vitals');

  // Lọc tất cả các đơn thuốc của bệnh nhân này và sắp xếp theo ngày tăng dần
  const patientHistory = useMemo(() => {
    if (!patient) return [];
    const list = prescriptions
      .filter((rx) => rx.patientId === patient.id)
      .sort((a, b) => (a.examinationDate || '').localeCompare(b.examinationDate || ''));
    return list;
  }, [patient, prescriptions]);

  // Chuẩn bị dữ liệu sinh hiệu cho đồ thị SVG
  const vitalsData = useMemo(() => {
    return patientHistory
      .filter((rx) => rx.vitalSigns && rx.examinationDate)
      .map((rx) => ({
        date: rx.examinationDate,
        systolic: rx.vitalSigns?.bloodPressureSystolic || 120,
        diastolic: rx.vitalSigns?.bloodPressureDiastolic || 80,
        heartRate: rx.vitalSigns?.heartRate || 75,
        weight: rx.vitalSigns?.weightKg || null,
        temp: rx.vitalSigns?.temperature || null,
        diagnosis: rx.diagnosis,
      }));
  }, [patientHistory]);

  // Chọn 2 đợt để so sánh đơn thuốc (Mặc định: Toa gần nhất vs Toa liền trước, hoặc Đang kê vs Toa gần nhất)
  const [compareTargetIdx, setCompareTargetIdx] = useState<number>(0);

  // Đơn so sánh:
  // - Current: Nếu có `currentDraftMedications` và đang trong màn hình kê đơn thì so sánh đơn đang kê với toa trước.
  const latestRx = patientHistory[patientHistory.length - 1];
  const previousRx = patientHistory.length >= 2 ? patientHistory[patientHistory.length - 2] : null;

  // Tính toán diff thuốc giữa đơn hiện tại (hoặc đơn mới nhất) với đơn trước đó
  const medComparison = useMemo(() => {
    const activeMedList =
      currentDraftMedications.length > 0
        ? currentDraftMedications
        : latestRx?.medications || [];

    const baseMedList =
      currentDraftMedications.length > 0
        ? latestRx?.medications || []
        : previousRx?.medications || [];

    const baseMap = new Map<string, PrescribedMedication>();
    baseMedList.forEach((m) => {
      baseMap.set(m.name.toLowerCase().trim(), m);
    });

    const activeMap = new Map<string, PrescribedMedication>();
    activeMedList.forEach((m) => {
      activeMap.set(m.name.toLowerCase().trim(), m);
    });

    // 1. Thuốc mới thêm (Có trong active, không có trong base)
    const added: PrescribedMedication[] = [];
    // 2. Thuốc duy trì hoặc đổi liều
    const maintained: Array<{
      active: PrescribedMedication;
      base: PrescribedMedication;
      dosageChanged: boolean;
    }> = [];

    activeMedList.forEach((m) => {
      const key = m.name.toLowerCase().trim();
      const base = baseMap.get(key);
      if (!base) {
        added.push(m);
      } else {
        const dosageChanged =
          m.dosage.morning !== base.dosage.morning ||
          m.dosage.noon !== base.dosage.noon ||
          m.dosage.afternoon !== base.dosage.afternoon ||
          m.dosage.evening !== base.dosage.evening ||
          m.durationDays !== base.durationDays;
        maintained.push({ active: m, base, dosageChanged });
      }
    });

    // 3. Thuốc đã ngừng (Có trong base, không có trong active)
    const removed: PrescribedMedication[] = [];
    baseMedList.forEach((m) => {
      const key = m.name.toLowerCase().trim();
      if (!activeMap.has(key)) {
        removed.push(m);
      }
    });

    return { added, maintained, removed, baseMedList, activeMedList };
  }, [currentDraftMedications, latestRx, previousRx]);

  if (!isOpen || !patient) return null;

  // SVG Chart Dimensions
  const svgWidth = 650;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 30;

  // Scale min/max cho Huyết áp (70 - 180)
  const minBP = 60;
  const maxBP = 180;
  const scaleY = (val: number) => {
    const clamped = Math.max(minBP, Math.min(maxBP, val));
    return svgHeight - paddingY - ((clamped - minBP) / (maxBP - minBP)) * (svgHeight - 2 * paddingY);
  };

  const scaleX = (index: number, total: number) => {
    if (total <= 1) return svgWidth / 2;
    return paddingX + (index / (total - 1)) * (svgWidth - 2 * paddingX);
  };

  // Tạo SVG Path cho Huyết áp tâm thu & tâm trương
  const systolicPoints = vitalsData.map((d, i) => `${scaleX(i, vitalsData.length)},${scaleY(d.systolic)}`).join(' ');
  const diastolicPoints = vitalsData.map((d, i) => `${scaleX(i, vitalsData.length)},${scaleY(d.diastolic)}`).join(' ');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-indigo-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <TrendingUp className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Tiến Triển Bệnh Án &amp; Lịch Sử Dùng Thuốc
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/30 text-blue-100 border border-blue-400/30">
                  {patientHistory.length} lần khám
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Bệnh nhân: <strong>{patient.fullName}</strong> ({patient.birthYear ? `${new Date().getFullYear() - Number(patient.birthYear)} tuổi` : ''}) • Mã: {patient.patientCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121824] px-4 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'vitals'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-md'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Biểu Đồ Sinh Hiệu (Huyết Áp / Mạch)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('med_diff')}
            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'med_diff'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-md'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>So Sánh Đơn Thuốc Cũ / Mới (Diff)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'vitals' ? (
            <div className="space-y-4">
              {vitalsData.length < 2 ? (
                <div className="p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-center text-blue-900 dark:text-blue-200 text-xs">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <p className="font-bold text-sm">Bệnh nhân mới có {vitalsData.length} lần ghi nhận sinh hiệu.</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    Khi bệnh nhân tái khám từ 2 lần trở lên, hệ thống sẽ tự động vẽ biểu đồ đường cong tiến triển huyết áp, mạch và cân nặng theo thời gian.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-[#121824] p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-rose-600" />
                      <span>Diễn Tiến Huyết Áp (Tâm Thu / Tâm Trương) Qua Các Đợt Khám</span>
                    </h3>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">Tâm thu (mmHg)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">Tâm trương (mmHg)</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Line Chart */}
                  <div className="overflow-x-auto">
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-full h-auto">
                      {/* Grid Lines */}
                      {[80, 100, 120, 140, 160].map((val) => (
                        <g key={val}>
                          <line
                            x1={paddingX}
                            y1={scaleY(val)}
                            x2={svgWidth - paddingX}
                            y2={scaleY(val)}
                            stroke="#cbd5e1"
                            strokeDasharray="3 3"
                            strokeWidth="1"
                            className="dark:stroke-slate-700"
                          />
                          <text
                            x={paddingX - 6}
                            y={scaleY(val) + 3}
                            textAnchor="end"
                            fontSize="9"
                            fill="#94a3b8"
                            className="font-mono font-bold"
                          >
                            {val}
                          </text>
                        </g>
                      ))}

                      {/* Vùng huyết áp mục tiêu chuẩn (110 - 130 mmHg) */}
                      <rect
                        x={paddingX}
                        y={scaleY(130)}
                        width={svgWidth - 2 * paddingX}
                        height={scaleY(110) - scaleY(130)}
                        fill="#22c55e"
                        fillOpacity="0.08"
                      />

                      {/* Đường Huyết áp tâm thu (Đỏ) */}
                      <polyline
                        fill="none"
                        stroke="#e11d48"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={systolicPoints}
                      />

                      {/* Đường Huyết áp tâm trương (Xanh) */}
                      <polyline
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={diastolicPoints}
                      />

                      {/* Điểm nút & nhãn giá trị */}
                      {vitalsData.map((d, i) => {
                        const x = scaleX(i, vitalsData.length);
                        const ySys = scaleY(d.systolic);
                        const yDia = scaleY(d.diastolic);
                        return (
                          <g key={i}>
                            {/* Systolic Node */}
                            <circle cx={x} cy={ySys} r="4" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                            <text x={x} y={ySys - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#be123c">
                              {d.systolic}
                            </text>

                            {/* Diastolic Node */}
                            <circle cx={x} cy={yDia} r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                            <text x={x} y={yDia + 15} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1d4ed8">
                              {d.diastolic}
                            </text>

                            {/* Date Label on X Axis */}
                            <text x={x} y={svgHeight - 8} textAnchor="middle" fontSize="9" fill="#64748b" className="font-mono">
                              {d.date.split('-').slice(1).join('/')}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              )}

              {/* Bảng chi tiết các lần đo sinh hiệu */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5">Ngày khám</th>
                      <th className="p-2.5">Huyết áp (mmHg)</th>
                      <th className="p-2.5">Nhịp tim (l/p)</th>
                      <th className="p-2.5">Cân nặng (kg)</th>
                      <th className="p-2.5">Thân nhiệt (°C)</th>
                      <th className="p-2.5">Chẩn đoán đợt khám</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {vitalsData.map((d, index) => (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {d.date}
                        </td>
                        <td className="p-2.5 font-bold">
                          <span className={d.systolic >= 140 ? 'text-rose-600 font-extrabold' : 'text-slate-800 dark:text-slate-200'}>
                            {d.systolic}/{d.diastolic}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono">{d.heartRate || '---'}</td>
                        <td className="p-2.5 font-mono">{d.weight ? `${d.weight} kg` : '---'}</td>
                        <td className="p-2.5 font-mono">{d.temp ? `${d.temp} °C` : '---'}</td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300 truncate max-w-xs">{d.diagnosis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* MEDICATION DIFF COMPARISON VIEW */
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    So sánh: <strong>{currentDraftMedications.length > 0 ? 'Toa đang kê hiện tại' : latestRx?.prescriptionCode || 'Toa gần nhất'}</strong> với{' '}
                    <strong>{currentDraftMedications.length > 0 ? latestRx?.prescriptionCode || 'Toa trước' : previousRx?.prescriptionCode || 'Toa liền trước'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 font-semibold">
                  <span className="text-emerald-700 dark:text-emerald-400">+{medComparison.added.length} Thêm mới</span>
                  <span className="text-amber-700 dark:text-amber-400">~{medComparison.maintained.filter((m) => m.dosageChanged).length} Đổi liều</span>
                  <span className="text-rose-700 dark:text-rose-400">-{medComparison.removed.length} Ngừng thuốc</span>
                </div>
              </div>

              {/* 1. Thuốc Mới Thêm */}
              {medComparison.added.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Thuốc mới kê thêm trong đợt này ({medComparison.added.length}):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {medComparison.added.map((med) => (
                      <div
                        key={med.id}
                        className="p-2.5 rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs space-y-1"
                      >
                        <div className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center justify-between">
                          <span>{med.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold">
                            MỚI
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          {med.activeIngredient} • {med.strength} • Số lượng: {med.totalQuantity} {med.unit}
                        </div>
                        <div className="text-[11px] text-emerald-900 dark:text-emerald-300 font-medium">
                          Liều: S:{med.dosage.morning} T:{med.dosage.noon} C:{med.dosage.afternoon} Tối:{med.dosage.evening} ({med.instructions})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Thuốc Duy Trì / Điều Chỉnh Liều */}
              {medComparison.maintained.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thuốc duy trì từ toa trước ({medComparison.maintained.length}):</span>
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                          <th className="p-2.5">Tên thuốc</th>
                          <th className="p-2.5">Liều toa trước</th>
                          <th className="p-2.5">Liều đợt này</th>
                          <th className="p-2.5">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {medComparison.maintained.map(({ active, base, dosageChanged }) => (
                          <tr key={active.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">
                              {active.name}
                            </td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400 font-mono">
                              S:{base.dosage.morning} T:{base.dosage.noon} C:{base.dosage.afternoon} T:{base.dosage.evening} ({base.durationDays} ngày)
                            </td>
                            <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                              S:{active.dosage.morning} T:{active.dosage.noon} C:{active.dosage.afternoon} T:{active.dosage.evening} ({active.durationDays} ngày)
                            </td>
                            <td className="p-2.5">
                              {dosageChanged ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                                  Điều chỉnh liều
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  Duy trì liều cũ
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. Thuốc Đã Ngừng Kê */}
              {medComparison.removed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Minus className="w-3.5 h-3.5 text-rose-600" />
                    <span>Thuốc có trong toa trước nhưng lần này ngừng kê ({medComparison.removed.length}):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {medComparison.removed.map((med) => (
                      <div
                        key={med.id}
                        className="p-2.5 rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 text-xs space-y-1 opacity-80"
                      >
                        <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center justify-between">
                          <span className="line-through">{med.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 font-bold">
                            NGỪNG
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          {med.activeIngredient} • {med.strength}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-[#121824] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 shrink-0">
          <div>
            * Biểu đồ tự động cập nhật mỗi khi Bác sĩ lưu toa thuốc mới cho bệnh nhân.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-bold cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
