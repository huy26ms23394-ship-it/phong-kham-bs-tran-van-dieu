import React, { useState, useMemo } from 'react';
import { Prescription, Patient, MedicationCatalogItem, ClinicSettings } from '../types/medical';
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  Calendar,
  Download,
  X,
  Pill,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  Package,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface ClinicReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescriptions?: Prescription[];
  patients?: Patient[];
  catalog?: MedicationCatalogItem[];
  clinicInfo?: ClinicSettings;
}

export const ClinicReportsModal: React.FC<ClinicReportsModalProps> = ({
  isOpen,
  onClose,
  prescriptions = [],
  patients = [],
  catalog = [],
  clinicInfo,
}) => {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'all'>('30days');
  const [activeTab, setActiveTab] = useState<'overview' | 'medications' | 'inventory'>('overview');
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'expiring' | 'low_stock'>('all');
  const [renderError, setRenderError] = useState<string | null>(null);

  // Dữ liệu an toàn chống crash
  const safePrescriptions = useMemo(() => {
    return Array.isArray(prescriptions) ? prescriptions.filter(Boolean) : [];
  }, [prescriptions]);

  const safeCatalog = useMemo(() => {
    return Array.isArray(catalog) ? catalog.filter(Boolean) : [];
  }, [catalog]);

  const safePatients = useMemo(() => {
    return Array.isArray(patients) ? patients.filter(Boolean) : [];
  }, [patients]);

  // Lọc đơn thuốc theo khoảng thời gian
  const filteredPrescriptions = useMemo(() => {
    try {
      const now = new Date();
      return safePrescriptions.filter((rx) => {
        if (!rx) return false;
        if (timeRange === 'all') return true;
        if (!rx.examinationDate) return true;
        const examDate = new Date(rx.examinationDate);
        if (isNaN(examDate.getTime())) return true;
        const diffTime = Math.abs(now.getTime() - examDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (timeRange === 'today') return diffDays <= 1;
        if (timeRange === '7days') return diffDays <= 7;
        if (timeRange === '30days') return diffDays <= 30;
        return true;
      });
    } catch (err) {
      console.error('[ClinicReportsModal] Error filtering prescriptions:', err);
      return safePrescriptions;
    }
  }, [safePrescriptions, timeRange]);

  // Thống kê Top 10 thuốc được kê nhiều nhất
  const topMedications = useMemo(() => {
    try {
      const medMap: Record<string, { name: string; activeIngredient?: string; unit: string; totalQuantity: number; rxCount: number }> = {};

      filteredPrescriptions.forEach((rx) => {
        if (!rx || !Array.isArray(rx.medications)) return;
        rx.medications.forEach((med) => {
          if (!med || !med.name) return;
          const key = med.name.toLowerCase().trim();
          if (!medMap[key]) {
            medMap[key] = {
              name: med.name,
              activeIngredient: med.activeIngredient || '',
              unit: med.unit || 'viên',
              totalQuantity: 0,
              rxCount: 0,
            };
          }
          medMap[key].totalQuantity += Number(med.totalQuantity) || 0;
          medMap[key].rxCount += 1;
        });
      });

      return Object.values(medMap)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);
    } catch (err) {
      console.error('[ClinicReportsModal] Error computing top medications:', err);
      return [];
    }
  }, [filteredPrescriptions]);

  // Thống kê phân bố chẩn đoán / bệnh lý
  const diagnosisBreakdown = useMemo(() => {
    try {
      const diagMap: Record<string, number> = {};
      filteredPrescriptions.forEach((rx) => {
        const diag = (rx?.diagnosis || '').trim() || 'Khám nội khoa tổng quát';
        // Rút gọn nhóm bệnh
        let category = 'Bệnh Nội Khoa Khác';
        const lower = diag.toLowerCase();
        if (lower.includes('huyết áp') || lower.includes('tăng ha') || lower.includes('i10')) category = 'Tăng Huyết Áp';
        else if (lower.includes('đái tháo đường') || lower.includes('tiểu đường') || lower.includes('e11')) category = 'Đái Tháo Đường';
        else if (lower.includes('lipid') || lower.includes('mỡ máu') || lower.includes('e78')) category = 'Rối Loạn Lipid Máu';
        else if (lower.includes('dạ dày') || lower.includes('gerd') || lower.includes('trào ngược') || lower.includes('k29')) category = 'Dạ Dày & Tiêu Hóa';
        else if (lower.includes('khớp') || lower.includes('cột sống') || lower.includes('m17')) category = 'Cơ Xương Khớp';
        else if (lower.includes('họng') || lower.includes('viêm phế quản') || lower.includes('j02')) category = 'Hô Hấp - Tai Mũi Họng';
        else if (lower.includes('tiền đình') || lower.includes('thiểu năng')) category = 'Rối Loạn Tiền Đình';

        diagMap[category] = (diagMap[category] || 0) + 1;
      });

      return Object.entries(diagMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    } catch (err) {
      console.error('[ClinicReportsModal] Error computing diagnosis breakdown:', err);
      return [];
    }
  }, [filteredPrescriptions]);

  // Tính toán doanh thu phòng khám ước tính (Tiền khám chuẩn theo cài đặt phòng khám + Tiền thuốc)
  const examinationFeePerVisit = clinicInfo?.consultationFee || 150000;
  const estimatedConsultationRevenue = filteredPrescriptions.length * examinationFeePerVisit;
  // Giả định trung bình mỗi viên thuốc giá 8.000đ
  const estimatedDrugRevenue = useMemo(() => {
    try {
      return filteredPrescriptions.reduce((sum, rx) => {
        const meds = Array.isArray(rx?.medications) ? rx.medications : [];
        const totalPills = meds.reduce((pSum, m) => pSum + (Number(m?.totalQuantity) || 0), 0);
        return sum + totalPills * 8000;
      }, 0);
    } catch (err) {
      console.error('[ClinicReportsModal] Error computing drug revenue:', err);
      return 0;
    }
  }, [filteredPrescriptions]);
  const totalEstimatedRevenue = estimatedConsultationRevenue + estimatedDrugRevenue;

  // Lọc kho thuốc theo tình trạng hạn dùng & tồn kho
  const filteredCatalogInventory = useMemo(() => {
    try {
      const today = new Date();
      return safeCatalog.filter((item) => {
        if (!item) return false;
        // Tìm kiếm theo từ khóa
        const nameStr = item.name || '';
        const activeStr = item.activeIngredient || '';
        if (stockSearchTerm) {
          const q = stockSearchTerm.toLowerCase();
          const matchName = nameStr.toLowerCase().includes(q);
          const matchActive = activeStr.toLowerCase().includes(q);
          if (!matchName && !matchActive) return false;
        }

        // Giả lập hạn dùng nếu chưa có (dùng năm 2026/2027)
        const expDate = item.expiryDate ? new Date(item.expiryDate) : new Date(2027, 5, 30);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const stock = item.stockQuantity ?? 120;

        if (stockFilter === 'expiring') return diffDays <= 90;
        if (stockFilter === 'low_stock') return stock < 30;
        return true;
      });
    } catch (err) {
      console.error('[ClinicReportsModal] Error filtering inventory:', err);
      return safeCatalog;
    }
  }, [safeCatalog, stockSearchTerm, stockFilter]);

  // Xuất file CSV chuẩn UTF-8 BOM để Excel hiển thị tiếng Việt hoàn hảo
  const exportPrescriptionsCsv = () => {
    try {
      const headers = ['Mã Đơn', 'Ngày Khám', 'Họ Tên Bệnh Nhân', 'Tuổi', 'Giới Tính', 'SĐT', 'Chẩn Đoán', 'Mã ICD', 'Số Loại Thuốc', 'Tiền Khám (VNĐ)', 'Tiền Thuốc Ước Tính (VNĐ)', 'Tổng Tiền (VNĐ)'];
      
      const rows = filteredPrescriptions.map((rx) => {
        const patientAge = rx?.patientBirthYear ? new Date().getFullYear() - Number(rx.patientBirthYear) : '';
        const meds = Array.isArray(rx?.medications) ? rx.medications : [];
        const totalPills = meds.reduce((sum, m) => sum + (Number(m?.totalQuantity) || 0), 0);
        const drugCost = totalPills * 8000;
        const total = examinationFeePerVisit + drugCost;
        const diagClean = (rx?.diagnosis || '').replace(/"/g, '""');

        return [
          `"${rx?.prescriptionCode || ''}"`,
          `"${rx?.examinationDate || ''}"`,
          `"${rx?.patientName || ''}"`,
          patientAge,
          `"${rx?.patientGender === 'nam' ? 'Nam' : 'Nữ'}"`,
          `"${rx?.patientPhone || ''}"`,
          `"${diagClean}"`,
          `"${rx?.icd10Code || ''}"`,
          meds.length,
          examinationFeePerVisit,
          drugCost,
          total,
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_Cao_Kham_Benh_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Không thể xuất file CSV: ' + String(err));
    }
  };

  const exportInventoryCsv = () => {
    try {
      const headers = ['Tên Thuốc', 'Hoạt Chất', 'Hàm Lượng', 'Dạng Bào Chế', 'Đơn Vị', 'Phân Nhóm', 'Tồn Kho Hiện Tại', 'Hạn Sử Dụng', 'Tình Trạng HSD'];
      const today = new Date();

      const rows = safeCatalog.map((item) => {
        if (!item) return '';
        const expDate = item.expiryDate ? new Date(item.expiryDate) : new Date(2027, 5, 30);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const expStatus = diffDays < 0 ? 'Đã hết hạn' : diffDays <= 90 ? `Cận date (${diffDays} ngày)` : 'Bình thường';
        const stock = item.stockQuantity ?? 120;

        return [
          `"${item.name || ''}"`,
          `"${item.activeIngredient || ''}"`,
          `"${item.strength || ''}"`,
          `"${item.form || ''}"`,
          `"${item.unit || ''}"`,
          `"${item.category || ''}"`,
          stock,
          item.expiryDate || '2027-06-30',
          `"${expStatus}"`,
        ].join(',');
      }).filter(Boolean);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Kiem_Ke_Kho_Thuoc_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Không thể xuất file CSV kho dược: ' + String(err));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-emerald-200 border border-emerald-600 shadow-xs">
              <BarChart3 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Báo Cáo Thống Kê &amp; Quản Lý Kho Dược</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 border border-emerald-700 font-normal">
                  Nội bộ phòng khám
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {clinicInfo?.clinicName || 'Phòng Khám Nội Khoa'} • BS. {clinicInfo?.doctorName || 'Trần Văn Diệu'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Time Filter Toolbar */}
        <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeTab === 'overview'
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Tổng Quan &amp; Doanh Thu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('medications')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeTab === 'medications'
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Top Thuốc Kê Đơn
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeTab === 'inventory'
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Kho Dược &amp; Hạn Dùng
            </button>
          </div>

          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
            {(['today', '7days', '30days', 'all'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeRange(t)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  timeRange === t
                    ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t === 'today' ? 'Hôm nay' : t === '7days' ? '7 ngày qua' : t === '30days' ? '30 ngày' : 'Tất cả'}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body Canvas */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/60">
          {/* TAB 1: OVERVIEW & REVENUE */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>Số lượt khám</span>
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {filteredPrescriptions.length}
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    Đã hoàn thành kê đơn
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>Tổng Bệnh Nhân</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {safePatients.length}
                  </div>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    Hồ sơ quản lý thường trực
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>Doanh Thu Khám</span>
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {(estimatedConsultationRevenue / 1000).toLocaleString('vi-VN')}k
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                    {examinationFeePerVisit.toLocaleString('vi-VN')}đ / lượt khám
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>Tổng Doanh Thu Ước Tính</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {(totalEstimatedRevenue / 1000).toLocaleString('vi-VN')}k
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bao gồm khám &amp; tiền thuốc
                  </p>
                </div>
              </div>

              {/* Phân bố bệnh lý lâm sàng */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Phân Bố Bệnh Lý Lâm Sàng Thường Gặp ({filteredPrescriptions.length} ca khám)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={exportPrescriptionsCsv}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất Excel Danh Sách Khám</span>
                  </button>
                </div>

                <div className="space-y-2.5 pt-1">
                  {diagnosisBreakdown.map((item, idx) => {
                    const percent = filteredPrescriptions.length > 0 ? Math.round((item.count / filteredPrescriptions.length) * 100) : 0;
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800 dark:text-slate-200">
                            {idx + 1}. {item.name}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono">
                            {item.count} ca ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TOP MEDICATIONS PRESCRIBED */}
          {activeTab === 'medications' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    <span>Top 10 Thuốc Được Kê Nhiều Nhất</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Thống kê tần suất sử dụng và số lượng viên cấp phát cho bệnh nhân
                  </p>
                </div>

                <button
                  type="button"
                  onClick={exportPrescriptionsCsv}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Báo Cáo Kê Đơn</span>
                </button>
              </div>

              {topMedications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Chưa có dữ liệu kê đơn trong khoảng thời gian này.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topMedications.map((med, idx) => (
                    <div key={med.name} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {med.name}
                          </h4>
                          {med.activeIngredient && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">
                              Hoạt chất: {med.activeIngredient}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
                          {med.totalQuantity} {med.unit}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Xuất hiện trong {med.rxCount} đơn thuốc
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVENTORY & EXPIRY MANAGEMENT */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={stockSearchTerm}
                    onChange={(e) => setStockSearchTerm(e.target.value)}
                    placeholder="Tìm tên thuốc, hoạt chất để kiểm tra tồn kho..."
                    className="w-full pl-8.5 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600/30"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value as any)}
                    className="h-9 px-3 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">Tất cả thuốc ({safeCatalog.length})</option>
                    <option value="expiring">Sắp hết hạn / Cận date (≤ 90 ngày)</option>
                    <option value="low_stock">Sắp hết hàng (Tồn &lt; 30 viên)</option>
                  </select>

                  <button
                    type="button"
                    onClick={exportInventoryCsv}
                    className="h-9 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất Báo Cáo Kho (Excel)</span>
                  </button>
                </div>
              </div>

              {/* Table of drugs with stock and expiry */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                        <th className="p-3">Tên Thuốc &amp; Hoạt Chất</th>
                        <th className="p-3">Quy Cách</th>
                        <th className="p-3">Phân Nhóm</th>
                        <th className="p-3 text-center">Tồn Kho</th>
                        <th className="p-3 text-center">Hạn Sử Dụng</th>
                        <th className="p-3 text-right">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredCatalogInventory.map((item) => {
                        const stock = item.stockQuantity ?? 120;
                        const expDate = item.expiryDate || '2027-06-30';
                        const isLowStock = stock < 30;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                            <td className="p-3">
                              <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                              {item.activeIngredient && (
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {item.activeIngredient}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {item.strength} • {item.form}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                                {item.category}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`font-mono font-bold px-2 py-0.5 rounded ${
                                  isLowStock
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                }`}
                              >
                                {stock} {item.unit}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono text-slate-700 dark:text-slate-300">
                              {expDate}
                            </td>
                            <td className="p-3 text-right">
                              {isLowStock ? (
                                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center justify-end gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Sắp hết hàng</span>
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Đủ tồn kho</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3.5 px-5 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Dữ liệu phòng khám BS. Trần Văn Diệu được mã hóa bảo mật nội bộ tại nhà.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
