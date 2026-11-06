import React, { useState, useMemo } from 'react';
import { Patient, Prescription, ClinicSettings } from '../types/medical';
import {
  Calendar,
  Clock,
  Search,
  X,
  Phone,
  MessageSquare,
  Copy,
  Check,
  AlertCircle,
  CalendarCheck,
  ChevronRight,
  Filter,
  UserCheck,
  ExternalLink,
  Send,
  Stethoscope,
} from 'lucide-react';

interface AppointmentRecallModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescriptions: Prescription[];
  patients: Patient[];
  clinicInfo: ClinicSettings;
  onStartConsultationForPatient: (patientId: string) => void;
}

export const AppointmentRecallModal: React.FC<AppointmentRecallModalProps> = ({
  isOpen,
  onClose,
  prescriptions = [],
  patients = [],
  clinicInfo,
  onStartConsultationForPatient,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'today' | 'this_week' | 'overdue'>('this_week');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedRecall, setSelectedRecall] = useState<{
    patientName: string;
    phone: string;
    date: string;
    diagnosis: string;
    customMessage: string;
  } | null>(null);

  // Lấy ngày hôm nay dạng YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Ngày 7 ngày sau
  const next7DaysStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Trích xuất các lượt hẹn tái khám gần nhất của từng bệnh nhân
  const recallList = useMemo(() => {
    // Map theo patientId để lấy toa có followUpDate mới nhất
    const map = new Map<string, Prescription>();
    prescriptions.forEach((rx) => {
      if (rx.followUpDate && rx.patientId) {
        const existing = map.get(rx.patientId);
        if (!existing || (rx.createdAt && existing.createdAt && rx.createdAt > existing.createdAt)) {
          map.set(rx.patientId, rx);
        }
      }
    });

    const patientMap = new Map<string, Patient>();
    patients.forEach((p) => patientMap.set(p.id, p));

    const list = Array.from(map.values()).map((rx) => {
      const patient = patientMap.get(rx.patientId);
      const followUp = rx.followUpDate || '';

      let status: 'today' | 'this_week' | 'overdue' | 'future' = 'future';
      if (followUp === todayStr) {
        status = 'today';
      } else if (followUp < todayStr) {
        status = 'overdue';
      } else if (followUp <= next7DaysStr) {
        status = 'this_week';
      }

      return {
        prescription: rx,
        patient,
        patientName: rx.patientName,
        phone: rx.patientPhone || patient?.phone || '',
        followUpDate: followUp,
        diagnosis: rx.diagnosis,
        status,
      };
    });

    // Sắp xếp: Hôm nay -> Tuần này -> Quá hạn -> Tương lai
    list.sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
    return list;
  }, [prescriptions, patients, todayStr, next7DaysStr]);

  // Bộ đếm
  const counts = useMemo(() => {
    let today = 0;
    let thisWeek = 0;
    let overdue = 0;
    recallList.forEach((r) => {
      if (r.status === 'today') today++;
      if (r.status === 'this_week') thisWeek++;
      if (r.status === 'overdue') overdue++;
    });
    return { all: recallList.length, today, thisWeek, overdue };
  }, [recallList]);

  // Lọc theo search & tab
  const filteredRecalls = useMemo(() => {
    return recallList.filter((item) => {
      if (filterType === 'today' && item.status !== 'today') return false;
      if (filterType === 'this_week' && item.status !== 'this_week' && item.status !== 'today') return false;
      if (filterType === 'overdue' && item.status !== 'overdue') return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.patientName.toLowerCase().includes(q) ||
          item.phone.includes(q) ||
          item.diagnosis.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [recallList, filterType, searchTerm]);

  // Tạo tin nhắn nhắc tái khám chuẩn mực y khoa
  const generateMessageText = (item: (typeof recallList)[0]) => {
    return `Kính gửi Bác/Cô/Anh/Chị ${item.patientName}, ${clinicInfo.clinicName} (BS. ${clinicInfo.doctorName}) xin gửi lời thăm hỏi sức khỏe. Theo hồ sơ bệnh án, Bác/Cô/Anh/Chị có lịch tái khám vào ngày ${item.followUpDate} (Chẩn đoán: ${item.diagnosis}). Khi đi tái khám, xin vui lòng mang theo toa thuốc cũ và sổ theo dõi huyết áp/đường huyết. Hotline liên hệ: ${clinicInfo.phone}. Trân trọng!`;
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <CalendarCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Quản Lý Lịch Hẹn &amp; Nhắc Tái Khám Tự Động
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                  {recallList.length} lịch hẹn
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Theo dõi bệnh nhân mạn tính, gửi tin nhắn Zalo/SMS nhắc tái khám 1-click cho {clinicInfo.doctorName}
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

        {/* Filters & KPI Badges */}
        <div className="p-4 bg-slate-50 dark:bg-[#121824] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterType('this_week')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'this_week'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Tuần này (7 ngày tới)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-950/40 text-emerald-100">
                {counts.thisWeek}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('today')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'today'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Hôm nay</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-950/40 text-blue-100">
                {counts.today}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('overdue')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'overdue'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Quá hạn</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-950/40 text-rose-100">
                {counts.overdue}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Tất cả</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-900/40 text-slate-100">
                {counts.all}
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm bệnh nhân, SĐT, chẩn đoán..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredRecalls.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-60" />
              <p className="font-semibold text-sm">Không tìm thấy bệnh nhân nào trong bộ lọc này.</p>
              <p className="text-xs mt-1">Các bệnh nhân có ngày hẹn tái khám khi kê đơn sẽ tự động hiển thị ở đây.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
                    <th className="p-3 w-10 text-center">STT</th>
                    <th className="p-3">Họ Tên &amp; Bệnh Nhân</th>
                    <th className="p-3">Điện Thoại</th>
                    <th className="p-3">Ngày Hẹn Tái Khám</th>
                    <th className="p-3">Chẩn Đoán Đợt Trước</th>
                    <th className="p-3 text-right">Nhắc Khám / Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRecalls.map((item, index) => {
                    const messageText = generateMessageText(item);
                    const isCopied = copiedId === item.prescription.id;

                    return (
                      <tr
                        key={item.prescription.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-3 text-center text-slate-500 font-mono font-bold">
                          {index + 1}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {item.patientName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            Mã: {item.patient?.patientCode || item.prescription.patientId}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {item.phone ? (
                            <a
                              href={`tel:${item.phone}`}
                              className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{item.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">Chưa có SĐT</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${
                                item.status === 'today'
                                  ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300'
                                  : item.status === 'overdue'
                                  ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                              }`}
                            >
                              {item.followUpDate}
                            </span>
                            {item.status === 'today' && (
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                (Hôm nay)
                              </span>
                            )}
                            {item.status === 'overdue' && (
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                (Quá hạn)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          {item.diagnosis}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Zalo Button */}
                            {item.phone && (
                              <a
                                href={`https://zalo.me/${item.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded text-[11px] font-bold flex items-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer"
                                title="Mở Zalo nhắn tin cho bệnh nhân"
                              >
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                                <span>Zalo</span>
                              </a>
                            )}

                            {/* SMS Button */}
                            {item.phone && (
                              <a
                                href={`sms:${item.phone}?body=${encodeURIComponent(messageText)}`}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded text-[11px] font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                                title="Gửi SMS trực tiếp"
                              >
                                <Send className="w-3 h-3 text-emerald-600" />
                                <span>SMS</span>
                              </a>
                            )}

                            {/* Copy Message Text Button */}
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(messageText, item.prescription.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Sao chép nội dung tin nhắn nhắc tái khám"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-bold">Đã chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Chép mẫu</span>
                                </>
                              )}
                            </button>

                            {/* Start Consultation Now Button */}
                            <button
                              type="button"
                              onClick={() => {
                                onStartConsultationForPatient(item.patient?.id || item.prescription.patientId);
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Tiến hành khám và kê đơn cho bệnh nhân này ngay"
                            >
                              <Stethoscope className="w-3 h-3" />
                              <span>Khám lại</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-[#121824] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 shrink-0">
          <div>
            * Khi kê đơn, ngày hẹn tái khám sẽ tự động đồng bộ vào danh sách này.
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
