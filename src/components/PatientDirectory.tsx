import React, { useState, useMemo } from 'react';
import { Patient } from '../types/medical';
import { useSmartPagination } from '../hooks/useSmartPagination';
import { ClinicPaginationBar } from './ClinicPaginationBar';
import { matchesVietnameseSearch } from '../utils/vietnameseSearch';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  ShieldAlert,
  Stethoscope,
  Edit2,
  Trash2,
  Filter,
} from 'lucide-react';

interface PatientDirectoryProps {
  patients: Patient[];
  onOpenNewPatientModal: () => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onSelectPatientForExam: (patientId: string) => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  patients,
  onOpenNewPatientModal,
  onEditPatient,
  onDeletePatient,
  onSelectPatientForExam,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'allergies' | 'chronic'>('all');

  const filtered = useMemo<Patient[]>(() => {
    return patients.filter((p) => {
      if (filterType === 'allergies' && (!p.allergies || p.allergies.length === 0)) {
        return false;
      }
      if (filterType === 'chronic' && (!p.chronicConditions || p.chronicConditions.length === 0)) {
        return false;
      }
      const targetText = `${p.fullName} ${p.phone} ${p.patientCode} ${p.healthInsuranceNumber || ''} ${p.address || ''} ${(p.allergies || []).join(' ')} ${(p.chronicConditions || []).join(' ')}`;
      return matchesVietnameseSearch(targetText, searchTerm);
    });
  }, [patients, searchTerm, filterType]);

  const pagination = useSmartPagination<Patient>({
    items: filtered,
    initialPageSize: 15,
    resetDependencies: [searchTerm, filterType],
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-md uppercase font-mono border border-emerald-200 dark:border-emerald-700">
              Hồ sơ phòng khám
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              ({patients.length} bệnh nhân đã lưu)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            Danh Sách &amp; Hồ Sơ Bệnh Nhân
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Quản lý tên bệnh nhân, số điện thoại, tiền sử bệnh nền và dị ứng thuốc tại phòng khám BS. Trần Văn Diệu.
          </p>
        </div>

        <button
          onClick={onOpenNewPatientModal}
          className="min-h-[44px] px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-md shadow-xs flex items-center justify-center gap-2 text-xs transition-all border border-emerald-700/60 shrink-0 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Tiếp Nhận Bệnh Nhân Mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3 transition-colors">
        <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm bệnh nhân theo họ và tên, số điện thoại, mã hồ sơ (VD: Nguyễn Văn An, 0918...)..."
          className="w-full px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 bg-transparent focus:outline-hidden"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shrink-0"
          >
            Xóa
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Lọc nhanh:
        </span>
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-all border cursor-pointer ${
            filterType === 'all'
              ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          Tất cả hồ sơ ({patients.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('allergies')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
            filterType === 'allergies'
              ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Có cảnh báo dị ứng</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType('chronic')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-all border cursor-pointer ${
            filterType === 'chronic'
              ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50'
          }`}
        >
          Tiền sử bệnh mạn tính
        </button>
      </div>

      {/* Patients List Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-md border border-dashed border-slate-200 dark:border-slate-800">
          <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Không tìm thấy bệnh nhân nào</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Thử tìm kiếm với từ khóa khác hoặc bấm nút bên dưới để lưu tên bệnh nhân mới vào phòng khám.
          </p>
          <button
            onClick={onOpenNewPatientModal}
            className="min-h-[44px] px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-md text-xs border border-emerald-700/60 shadow-xs active:scale-98"
          >
            Lưu Bệnh Nhân Mới
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pagination.paginatedItems.map((patient) => {
            const age =
              new Date().getFullYear() - (Number(patient.birthYear) || 1970);
            const hasAllergy =
              patient.allergies &&
              patient.allergies.length > 0 &&
              !patient.allergies[0]?.includes('Không có');

            return (
              <div
                key={patient.id}
                className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-sm transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md bg-emerald-800 dark:bg-emerald-700 text-white flex items-center justify-center font-black text-lg shadow-2xs shrink-0 border border-emerald-700/60 dark:border-emerald-600/60">
                        {patient.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
                            {patient.patientCode}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md font-semibold border border-emerald-200/60 dark:border-emerald-700/60">
                            {patient.gender === 'nam' ? 'Nam' : 'Nữ'} • {age} tuổi
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                          {patient.fullName}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditPatient(patient)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        title="Sửa thông tin bệnh nhân"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Xác nhận xóa hồ sơ bệnh nhân ${patient.fullName}?`)) {
                            onDeletePatient(patient.id);
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-rose-800"
                        title="Xóa bệnh nhân"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-300 font-mono">{patient.phone || 'Chưa có số ĐT'}</span>
                    </div>
                    {patient.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{patient.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Allergy Alert */}
                  {hasAllergy ? (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="truncate">Dị ứng: {patient.allergies.join(', ')}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                      Không có dị ứng thuốc đã biết
                    </div>
                  )}

                  {/* Chronic conditions chips */}
                  {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {patient.chronicConditions.slice(0, 3).map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-medium border border-slate-200 dark:border-slate-700"
                        >
                          {c}
                        </span>
                      ))}
                      {patient.chronicConditions.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{patient.chronicConditions.length - 3} bệnh khác
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onSelectPatientForExam(patient.id)}
                    className="w-full min-h-[42px] py-2 px-4 bg-emerald-50 hover:bg-emerald-800 hover:text-white dark:bg-emerald-950/40 dark:hover:bg-emerald-700 text-emerald-900 dark:text-emerald-200 dark:hover:text-white font-bold rounded-md text-xs flex items-center justify-center gap-2 transition-all border border-emerald-200 dark:border-emerald-800/80 active:scale-98"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Khám Bệnh &amp; Kê Toa Cho BN Này</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <ClinicPaginationBar
          pagination={pagination}
          pageSizeOptions={[15, 30, 50]}
          itemLabel="bệnh nhân"
          className="rounded-md border shadow-2xs"
        />
      </>
      )}
    </div>
  );
};