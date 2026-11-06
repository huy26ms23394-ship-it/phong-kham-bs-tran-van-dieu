/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ClinicSettings,
  Patient,
  Prescription,
  PrescribedMedication,
  MedicationCatalogItem,
} from './types/medical';
import {
  DEFAULT_CLINIC_SETTINGS,
  INITIAL_PATIENTS,
  INITIAL_PRESCRIPTIONS,
  CLINIC_MEDICATION_CATALOG,
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { ConsultationForm } from './components/ConsultationForm';
import { PatientDirectory } from './components/PatientDirectory';
import { PrescriptionList } from './components/PrescriptionList';
import { PrintableClinicPrescription } from './components/PrintableClinicPrescription';
import { PatientModal } from './components/PatientModal';
import { PharmacyCatalogModal } from './components/PharmacyCatalogModal';
import { ClinicSettingsModal } from './components/ClinicSettingsModal';
import { ClinicalAiModal } from './components/ClinicalAiModal';
import { GmailInboxModal } from './components/GmailInboxModal';
import { CrawlerBotModal } from './components/CrawlerBotModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { UserGuideModal } from './components/UserGuideModal';
import { LegalComplianceModal } from './components/LegalComplianceModal';
import { ClinicReportsModal } from './components/ClinicReportsModal';
import { PinLockModal } from './components/PinLockModal';
import { AppointmentRecallModal } from './components/AppointmentRecallModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginModal } from './components/LoginModal';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';
import { UserApprovalModal } from './components/UserApprovalModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ClinicUser } from './types/auth';
import {
  getStoredToken,
  getStoredUser,
  clearSession,
  fetchMe,
  getAuthHeaders,
  fetchUsers,
} from './utils/authClient';
import { useClinicalHotkeys } from './hooks/useClinicalHotkeys';
import { parseCurrentRoute, navigateTo, subscribeToRouteChanges, RouteTab } from './utils/urlRouting';
import { getCrawlerStatus } from './utils/crawlerClient';
import { auditPharmacyCatalog } from './utils/pharmacyAudit';
import {
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Keyboard,
  BookOpen,
  Scale,
  Smartphone,
  Lock,
} from 'lucide-react';

interface GoogleUser {
  name: string;
  email: string;
  picture?: string;
  role: string;
  isSignedIn: boolean;
}

export default function App() {
  // Google User Session State
  const [googleUser, setGoogleUser] = useState<GoogleUser>(() => {
    try {
      const saved = localStorage.getItem('mediba_google_user_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Bác Sĩ Trần Văn Diệu',
      email: 'tranminhhuy3031998@gmail.com',
      role: 'Bác Sĩ Trưởng Phòng Khám',
      isSignedIn: true,
    };
  });

  // Clinic Profile State
  const [clinicInfo, setClinicInfo] = useState<ClinicSettings>(() => {
    try {
      const saved = localStorage.getItem('mediba_clinic_info_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CLINIC_SETTINGS,
          ...parsed,
          clinicName: parsed.clinicName || DEFAULT_CLINIC_SETTINGS.clinicName,
        };
      }
    } catch {}
    return DEFAULT_CLINIC_SETTINGS;
  });

  // Patients State
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('mediba_patients_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PATIENTS;
  });

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    try {
      const saved = localStorage.getItem('mediba_prescriptions_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PRESCRIPTIONS;
  });

  // Pharmacy Catalog State (44+ Drugs)
  const [pharmacyCatalog, setPharmacyCatalog] = useState<MedicationCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem('mediba_pharmacy_catalog_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return CLINIC_MEDICATION_CATALOG;
  });

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mediba_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mediba_dark_mode', String(isDarkMode));
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, [isDarkMode]);

  // URL Hash-based Routing & Deep Linking Initialization
  const initialRouteRef = useRef(parseCurrentRoute());

  // Navigation State
  const [activeTab, setActiveTabState] = useState<'consultation' | 'patients' | 'prescriptions' | 'print'>(
    () => {
      const t = initialRouteRef.current.tab;
      if (t === 'patients' || t === 'prescriptions' || t === 'print') {
        return t;
      }
      return 'consultation';
    }
  );

  const setActiveTab = (tab: 'consultation' | 'patients' | 'prescriptions' | 'print') => {
    setActiveTabState(tab);
    navigateTo(tab);
  };

  const [selectedPatientForExamId, setSelectedPatientForExamId] = useState<string>(() => {
    return initialRouteRef.current.params.patientId || INITIAL_PATIENTS[0]?.id || '';
  });

  const [currentPrintPrescription, setCurrentPrintPrescription] = useState<Prescription>(
    INITIAL_PRESCRIPTIONS[0]
  );
  const [presetPrescription, setPresetPrescription] = useState<Prescription | null>(null);

  // Live consultation draft state for ClinicalAiModal
  const [liveDraft, setLiveDraft] = useState<{
    patient?: Patient;
    diagnosis: string;
    symptoms: string;
    medications: PrescribedMedication[];
    vitals: { bloodPressure: string; pulse: number; weight: number; height: number };
  }>({
    diagnosis: 'Tăng huyết áp nguyên phát',
    symptoms: 'Khám bệnh định kỳ và theo dõi điều trị',
    medications: [],
    vitals: { bloodPressure: '130/80', pulse: 75, weight: 65, height: 165 },
  });

  // Modals
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);
  const [isCrawlerBotOpen, setIsCrawlerBotOpen] = useState(false);
  const [crawlerPendingCount, setCrawlerPendingCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mediba_crawler_pending_count');
      if (saved) return Number(saved) || 0;
    } catch {}
    return 0;
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isUserGuideModalOpen, setIsUserGuideModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(() => initialRouteRef.current.tab === 'reports');
  const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState(
    () => initialRouteRef.current.tab === 'appointments'
  );
  const [isPinLocked, setIsPinLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mediba_pin_lock_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Zero-Trust Authentication State
  const [authUser, setAuthUser] = useState<ClinicUser | null>(() => getStoredUser());
  const [isUserApprovalModalOpen, setIsUserApprovalModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  // Validate session on app launch
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthUser(null);
      return;
    }
    fetchMe().then((res) => {
      if (res.success && res.user) {
        setAuthUser(res.user);
      } else {
        clearSession();
        setAuthUser(null);
      }
    });
  }, []);

  const refreshPendingUsers = async () => {
    if (authUser?.role === 'SUPER_ADMIN') {
      const users = await fetchUsers();
      const pending = users.filter((u) => u.status === 'PENDING').length;
      setPendingUsersCount(pending);
    }
  };

  useEffect(() => {
    if (authUser?.role === 'SUPER_ADMIN') {
      refreshPendingUsers();
      const interval = setInterval(refreshPendingUsers, 15000);
      return () => clearInterval(interval);
    }
  }, [authUser]);

  // Đếm số lịch hẹn tái khám trong tuần tới
  const appointmentCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const next7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    return prescriptions.filter(
      (rx) => rx.followUpDate && rx.followUpDate >= today && rx.followUpDate <= next7Days
    ).length;
  }, [prescriptions]);

  // Đồng bộ 2 chiều URL Hash khi người dùng Back / Forward hoặc gõ URL trực tiếp
  useEffect(() => {
    return subscribeToRouteChanges((route) => {
      if (
        route.tab === 'consultation' ||
        route.tab === 'patients' ||
        route.tab === 'prescriptions' ||
        route.tab === 'print'
      ) {
        setActiveTabState(route.tab);
        setIsReportsModalOpen(false);
        setIsAppointmentsModalOpen(false);
      } else if (route.tab === 'reports') {
        setIsReportsModalOpen(true);
        setIsAppointmentsModalOpen(false);
      } else if (route.tab === 'appointments') {
        setIsAppointmentsModalOpen(true);
        setIsReportsModalOpen(false);
      }

      if (route.params.patientId) {
        setSelectedPatientForExamId(route.params.patientId);
      }
      if (route.params.rxId) {
        const found = prescriptions.find((r) => r.id === route.params.rxId || r.prescriptionCode === route.params.rxId);
        if (found) setCurrentPrintPrescription(found);
      }
    });
  }, [prescriptions]);

  const hasHydratedLanRef = useRef(false);
  const isPullingLanRef = useRef(false);
  const lanSyncDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // Pharmacy audit issues count for badge notification
  const pharmacyIssueCount = useMemo(() => {
    const report = auditPharmacyCatalog(pharmacyCatalog);
    return report.duplicateGroups.length + report.misclassifiedAlerts.length;
  }, [pharmacyCatalog]);

  // Quản lý tập trung toàn bộ phím tắt lâm sàng (Zero-Mouse Clinical Workflow)
  useClinicalHotkeys({
    activeTab,
    setActiveTab,
    navigateTo,
    setPatientToEdit,
    modals: {
      isShortcutsOpen: isShortcutsModalOpen,
      setIsShortcutsOpen: setIsShortcutsModalOpen,
      isUserGuideOpen: isUserGuideModalOpen,
      setIsUserGuideOpen: setIsUserGuideModalOpen,
      isReportsOpen: isReportsModalOpen,
      setIsReportsOpen: setIsReportsModalOpen,
      isLegalOpen: isLegalModalOpen,
      setIsLegalOpen: setIsLegalModalOpen,
      isPatientOpen: isPatientModalOpen,
      setIsPatientOpen: setIsPatientModalOpen,
      isPharmacyOpen: isPharmacyModalOpen,
      setIsPharmacyOpen: setIsPharmacyModalOpen,
      isCrawlerBotOpen,
      setIsCrawlerBotOpen,
      isSettingsOpen: isSettingsModalOpen,
      setIsSettingsOpen: setIsSettingsModalOpen,
      isAiAssistantOpen,
      setIsAiAssistantOpen,
      isGmailOpen: isGmailModalOpen,
      setIsGmailOpen: setIsGmailModalOpen,
      isUserApprovalOpen: isUserApprovalModalOpen,
      setIsUserApprovalOpen: setIsUserApprovalModalOpen,
    },
  });

  // Poll / Check initial Crawler status
  useEffect(() => {
    getCrawlerStatus().then((status) => {
      if (status) {
        setCrawlerPendingCount(status.pendingCount);
        try {
          localStorage.setItem('mediba_crawler_pending_count', String(status.pendingCount));
        } catch {}
      }
    });
  }, [isCrawlerBotOpen]);

  // Two-Way LAN Synchronization (Cloud Supabase / Postgres)
  const pushStateToLanServer = async (payload?: {
    clinicInfo?: ClinicSettings;
    patients?: Patient[];
    prescriptions?: Prescription[];
    pharmacyCatalog?: MedicationCatalogItem[];
  }) => {
    if (!authUser || authUser.status !== 'APPROVED') return;
    try {
      const res = await fetch('/api/clinic/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          clinicInfo: payload?.clinicInfo ?? clinicInfo,
          patients: payload?.patients ?? patients,
          prescriptions: payload?.prescriptions ?? prescriptions,
          pharmacyCatalog: payload?.pharmacyCatalog ?? pharmacyCatalog,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setLastSyncedAt(json.updatedAt || new Date().toISOString());
      }
    } catch {
      // Offline / Vite-only mode fallback to localStorage silently
    }
  };

  // Debounced push to LAN Server to prevent rapid disk writes and infinite reload loops
  const scheduleLanSync = (payload?: {
    clinicInfo?: ClinicSettings;
    patients?: Patient[];
    prescriptions?: Prescription[];
    pharmacyCatalog?: MedicationCatalogItem[];
  }) => {
    if (!authUser || authUser.status !== 'APPROVED') return;
    if (isPullingLanRef.current || !hasHydratedLanRef.current) return;
    if (lanSyncDebounceTimerRef.current) {
      clearTimeout(lanSyncDebounceTimerRef.current);
    }
    lanSyncDebounceTimerRef.current = setTimeout(() => {
      pushStateToLanServer(payload);
    }, 1500);
  };

  const pullOrPushLanSync = async () => {
    if (!authUser || authUser.status !== 'APPROVED') return;
    isPullingLanRef.current = true;
    try {
      const res = await fetch('/api/clinic/sync', {
        headers: getAuthHeaders(),
      });
      if (res.status === 401 || res.status === 403) {
        clearSession();
        setAuthUser(null);
        return;
      }
      if (!res.ok) return;
      const json = await res.json();
      if (json.hasServerData && json.data) {
        if (json.data.clinicInfo) {
          setClinicInfo((prev) => ({
            ...DEFAULT_CLINIC_SETTINGS,
            ...prev,
            ...json.data.clinicInfo,
            clinicName: json.data.clinicInfo.clinicName || prev.clinicName || DEFAULT_CLINIC_SETTINGS.clinicName,
          }));
        }
        if (Array.isArray(json.data.patients) && json.data.patients.length > 0) {
          setPatients(json.data.patients);
        }
        if (Array.isArray(json.data.prescriptions) && json.data.prescriptions.length > 0) {
          setPrescriptions(json.data.prescriptions);
          setCurrentPrintPrescription(json.data.prescriptions[0]);
        }
        if (Array.isArray(json.data.pharmacyCatalog) && json.data.pharmacyCatalog.length > 0) {
          setPharmacyCatalog(json.data.pharmacyCatalog);
        }
        setLastSyncedAt(json.data.updatedAt || new Date().toISOString());
      }
    } catch {
      // Offline fallback
    } finally {
      hasHydratedLanRef.current = true;
      setTimeout(() => {
        isPullingLanRef.current = false;
      }, 800);
    }
  };

  useEffect(() => {
    if (authUser?.status === 'APPROVED') {
      pullOrPushLanSync();
    }
  }, [authUser]);

  // Đồng bộ 2 chiều qua Cloud Supabase / PostgreSQL
  // Polling nhẹ mỗi 8s kiểm tra xem có thay đổi từ thiết bị khác không
  useEffect(() => {
    if (!authUser || authUser.status !== 'APPROVED') return;
    const syncInterval = setInterval(async () => {
      if (isPullingLanRef.current || document.hidden) return;
      try {
        const res = await fetch('/api/clinic/sync', {
          headers: getAuthHeaders(),
        });
        if (res.status === 401 || res.status === 403) {
          clearSession();
          setAuthUser(null);
          return;
        }
        if (!res.ok) return;
        const json = await res.json();
        if (json.hasServerData && json.data && json.data.updatedAt) {
          if (lastSyncedAt && json.data.updatedAt > lastSyncedAt) {
            if (json.data.clinicInfo) {
              setClinicInfo((prev) => ({
                ...DEFAULT_CLINIC_SETTINGS,
                ...prev,
                ...json.data.clinicInfo,
                clinicName: json.data.clinicInfo.clinicName || prev.clinicName || DEFAULT_CLINIC_SETTINGS.clinicName,
              }));
            }
            if (Array.isArray(json.data.patients) && json.data.patients.length > 0) {
              setPatients(json.data.patients);
            }
            if (Array.isArray(json.data.prescriptions) && json.data.prescriptions.length > 0) {
              setPrescriptions(json.data.prescriptions);
            }
            if (Array.isArray(json.data.pharmacyCatalog) && json.data.pharmacyCatalog.length > 0) {
              setPharmacyCatalog(json.data.pharmacyCatalog);
            }
            setLastSyncedAt(json.data.updatedAt);
          }
        }
      } catch {
        // Hoạt động offline an toàn
      }
    }, 8000);

    return () => clearInterval(syncInterval);
  }, [lastSyncedAt]);

  // Kế hoạch 2: Cơ chế tự động khóa mã PIN sau 15 phút không thao tác khi kích hoạt
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      try {
        const isPinEnabled = localStorage.getItem('mediba_pin_lock_enabled') === 'true';
        if (isPinEnabled) {
          idleTimer = setTimeout(() => {
            setIsPinLocked(true);
          }, 15 * 60 * 1000); // 15 phút
        }
      } catch {}
    };

    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });
    resetIdle();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('touchstart', resetIdle);
    };
  }, []);

  // Sync with LocalStorage & LAN Server (With debounce)
  useEffect(() => {
    try {
      localStorage.setItem('mediba_google_user_v2', JSON.stringify(googleUser));
    } catch {}
  }, [googleUser]);

  useEffect(() => {
    try {
      localStorage.setItem('mediba_clinic_info_v2', JSON.stringify(clinicInfo));
    } catch {}
    scheduleLanSync({ clinicInfo });
  }, [clinicInfo]);

  useEffect(() => {
    try {
      localStorage.setItem('mediba_patients_v2', JSON.stringify(patients));
    } catch {}
    scheduleLanSync({ patients });
  }, [patients]);

  useEffect(() => {
    try {
      localStorage.setItem('mediba_prescriptions_v2', JSON.stringify(prescriptions));
    } catch {}
    scheduleLanSync({ prescriptions });
  }, [prescriptions]);

  useEffect(() => {
    try {
      localStorage.setItem('mediba_pharmacy_catalog_v2', JSON.stringify(pharmacyCatalog));
    } catch {}
    scheduleLanSync({ pharmacyCatalog });
  }, [pharmacyCatalog]);

  // Handlers
  const handleSavePatient = (savedPatient: Patient) => {
    const exists = patients.some((p) => p.id === savedPatient.id);
    if (exists) {
      setPatients(patients.map((p) => (p.id === savedPatient.id ? savedPatient : p)));
    } else {
      setPatients([savedPatient, ...patients]);
    }
    setSelectedPatientForExamId(savedPatient.id);
  };

  const handleDeletePatient = (patientId: string) => {
    setPatients(patients.filter((p) => p.id !== patientId));
  };

  const handleSavePrescription = (
    newRx: Prescription,
    shouldPrintImmediately = false
  ) => {
    setPrescriptions([newRx, ...prescriptions]);
    setCurrentPrintPrescription(newRx);
    if (shouldPrintImmediately) {
      setActiveTab('print');
      setTimeout(() => {
        window.print();
      }, 280);
    } else {
      alert(`Đã lưu thành công đơn thuốc ${newRx.prescriptionCode} cho bệnh nhân ${newRx.patientName}!`);
      setActiveTab('prescriptions');
    }
  };

  const handleDeletePrescription = (rxId: string) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== rxId));
  };

  const handleSelectPatientForExam = (patientId: string) => {
    setSelectedPatientForExamId(patientId);
    setActiveTab('consultation');
    navigateTo('consultation', { patientId });
  };

  const handlePrintPrescription = (rx: Prescription) => {
    setCurrentPrintPrescription(rx);
    setActiveTab('print');
    navigateTo('print', { rxId: rx.id });
  };

  const handleRepeatPrescription = (rx: Prescription) => {
    setSelectedPatientForExamId(rx.patientId);
    setPresetPrescription(rx);
    setActiveTab('consultation');
    navigateTo('consultation', { patientId: rx.patientId });
  };

  const handleAddCatalogItem = (newItem: MedicationCatalogItem) => {
    setPharmacyCatalog([newItem, ...pharmacyCatalog]);
  };

  const handleAddApprovedDrugs = (approvedDrugs: any[]) => {
    const newItems: MedicationCatalogItem[] = approvedDrugs.map((d) => ({
      id: d.id || `drug-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: d.name || d.tradeName || 'Thuốc mới',
      activeIngredient: d.activeIngredient || '',
      strength: d.strength || '',
      form: d.form || 'Viên nén',
      unit: d.unit || 'viên',
      category: d.category || 'Thuốc kê đơn',
      defaultDurationDays: d.defaultDurationDays || 7,
      defaultDosage: d.defaultDosage || {
        morning: 1,
        noon: 0,
        afternoon: 0,
        evening: 1,
        timing: 'sau_an',
      },
      defaultInstructions: d.defaultInstructions || 'Uống sau bữa ăn theo chỉ dẫn bác sĩ',
      warningNote: d.warningNote || '',
    }));

    setPharmacyCatalog((prev) => {
      const validPrev = prev.filter((item) => item && typeof item.name === 'string');
      const existingNames = new Set(validPrev.map((m) => m.name.toLowerCase().trim()));
      const uniqueNew = newItems.filter(
        (d) => d.name && !existingNames.has(d.name.toLowerCase().trim())
      );
      return [...uniqueNew, ...validPrev];
    });
    setCrawlerPendingCount((prev) => Math.max(0, prev - approvedDrugs.length));
    alert(`Đã phê duyệt và bổ sung ${approvedDrugs.length} thuốc mới vào kho phòng khám!`);
  };

  const handleExportBackup = () => {
    const data = {
      clinicInfo,
      patients,
      prescriptions,
      pharmacyCatalog,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DuLieuPhongKham_BS_TranVanDieu_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '{}'));
        if (parsed.clinicInfo) setClinicInfo(parsed.clinicInfo);
        if (Array.isArray(parsed.patients)) setPatients(parsed.patients);
        if (Array.isArray(parsed.prescriptions)) {
          setPrescriptions(parsed.prescriptions);
          if (parsed.prescriptions[0]) setCurrentPrintPrescription(parsed.prescriptions[0]);
        }
        if (Array.isArray(parsed.pharmacyCatalog)) setPharmacyCatalog(parsed.pharmacyCatalog);
        alert('Đã nạp và khôi phục thành công dữ liệu phòng khám từ file JSON!');
      } catch {
        alert('File JSON không hợp lệ. Vui lòng chọn đúng file sao lưu của phòng khám.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemoData = () => {
    if (confirm('Khôi phục dữ liệu mẫu ban đầu cho Phòng khám Bác Sĩ Trần Văn Diệu?')) {
      setClinicInfo(DEFAULT_CLINIC_SETTINGS);
      setPatients(INITIAL_PATIENTS);
      setPrescriptions(INITIAL_PRESCRIPTIONS);
      setPharmacyCatalog(CLINIC_MEDICATION_CATALOG);
      setSelectedPatientForExamId(INITIAL_PATIENTS[0].id);
      setCurrentPrintPrescription(INITIAL_PRESCRIPTIONS[0]);
    }
  };

  const activePatientForExam =
    liveDraft.patient ||
    patients.find((p) => p.id === selectedPatientForExamId) ||
    patients[0];

  // ================= ZERO-TRUST GATING (KHÔNG TẢI BỆNH ÁN KHI CHƯA ĐƯỢC DUYỆT) =================

  // 1. Chưa đăng nhập -> Hiện màn hình đăng nhập chuẩn Y tế
  if (!authUser) {
    return (
      <LoginModal
        onLoginSuccess={(user) => {
          setAuthUser(user);
          hasHydratedLanRef.current = false;
        }}
        onPendingApproval={(user) => {
          setAuthUser(user);
        }}
      />
    );
  }

  // 2. Đã đăng nhập nhưng đang PENDING -> Hiện Phòng Chờ Phê Duyệt
  if (authUser.status === 'PENDING') {
    return (
      <PendingApprovalScreen
        user={authUser}
        onApproved={(user) => {
          setAuthUser(user);
          hasHydratedLanRef.current = false;
        }}
        onLogout={() => {
          clearSession();
          setAuthUser(null);
        }}
      />
    );
  }

  // 3. Tài khoản bị REVOKED -> Chặn truy cập hoàn toàn
  if (authUser.status === 'REVOKED') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 rounded-2xl p-6 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 mx-auto flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-rose-700 dark:text-rose-400">Quyền Truy Cập Bị Thu Hồi</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
            Tài khoản của bạn ({authUser.email}) đã bị khóa hoặc thu hồi quyền truy cập. Vui lòng liên hệ Bác Sĩ Trần Văn Diệu để được hỗ trợ.
          </p>
          <button
            onClick={() => {
              clearSession();
              setAuthUser(null);
            }}
            className="mt-5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-700"
          >
            Đăng xuất tài khoản
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf2f0] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div>
        {/* Navigation Bar */}
        <Navbar
          clinicInfo={clinicInfo}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          onOpenNewPatientModal={() => {
            setPatientToEdit(null);
            setIsPatientModalOpen(true);
          }}
          onOpenPharmacyModal={() => setIsPharmacyModalOpen(true)}
          pharmacyIssueCount={pharmacyIssueCount}
          onOpenReportsModal={() => {
            setIsReportsModalOpen(true);
            navigateTo('reports');
          }}
          onOpenAppointmentsModal={() => {
            setIsAppointmentsModalOpen(true);
            navigateTo('appointments');
          }}
          appointmentCount={appointmentCount}
          onLockApp={() => setIsPinLocked(true)}
          onOpenCrawlerBot={() => setIsCrawlerBotOpen(true)}
          crawlerPendingCount={crawlerPendingCount}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
          onOpenGmailInbox={() => setIsGmailModalOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          onOpenUserGuide={() => setIsUserGuideModalOpen(true)}
          totalPatientsCount={patients.length}
          totalPrescriptionsCount={prescriptions.length}
          googleUser={{
            name: authUser.full_name || clinicInfo.doctorName,
            email: authUser.email,
            picture: authUser.avatar_url,
            role: authUser.role === 'SUPER_ADMIN' ? 'Quản Trị Viên Tối Cao' : authUser.role,
            isSignedIn: true,
          }}
          currentUser={authUser}
          pendingUsersCount={pendingUsersCount}
          onOpenUserApprovalModal={() => setIsUserApprovalModalOpen(true)}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          onGoogleLogin={() => {}}
          onGoogleLogout={() => {
            clearSession();
            setAuthUser(null);
          }}
        />

        {/* Main Content Area: Widescreen Fluid Layout Max-W-[1840px] */}
        <main className="w-full max-w-[1840px] mx-auto px-6 lg:px-10 py-4 sm:py-6 pb-24 md:pb-12">
          {activeTab === 'consultation' && (
            <ConsultationForm
              patients={patients}
              selectedPatientId={selectedPatientForExamId}
              clinicInfo={clinicInfo}
              catalog={pharmacyCatalog}
              prescriptions={prescriptions}
              presetPrescription={presetPrescription}
              onClearPresetPrescription={() => setPresetPrescription(null)}
              onSavePrescription={handleSavePrescription}
              onOpenNewPatientModal={() => {
                setPatientToEdit(null);
                setIsPatientModalOpen(true);
              }}
              onQuickSavePatient={handleSavePatient}
              onEditPatient={(patient) => {
                setPatientToEdit(patient);
                setIsPatientModalOpen(true);
              }}
              onDraftChange={setLiveDraft}
            />
          )}

          {activeTab === 'patients' && (
            <PatientDirectory
              patients={patients}
              onOpenNewPatientModal={() => {
                setPatientToEdit(null);
                setIsPatientModalOpen(true);
              }}
              onEditPatient={(patient) => {
                setPatientToEdit(patient);
                setIsPatientModalOpen(true);
              }}
              onDeletePatient={handleDeletePatient}
              onSelectPatientForExam={handleSelectPatientForExam}
            />
          )}

          {activeTab === 'prescriptions' && (
            <PrescriptionList
              prescriptions={prescriptions}
              clinicInfo={clinicInfo}
              onPrintPrescription={handlePrintPrescription}
              onRepeatPrescription={handleRepeatPrescription}
              onDeletePrescription={handleDeletePrescription}
              onGoToConsultation={() => setActiveTab('consultation')}
            />
          )}

          {activeTab === 'print' && (
            <PrintableClinicPrescription
              prescription={currentPrintPrescription || prescriptions[0]}
              clinicInfo={clinicInfo}
              allPrescriptions={prescriptions}
              onSelectPrescription={(rx) => setCurrentPrintPrescription(rx)}
            />
          )}
        </main>
      </div>

      {/* Floating Gemini AI Quick Button (>=44px touch target) */}
      <button
        type="button"
        onClick={() => setIsAiAssistantOpen(true)}
        className="no-print fixed bottom-20 lg:bottom-6 right-5 min-h-[44px] px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-md shadow-lg flex items-center gap-2 font-bold text-xs border border-emerald-600 dark:border-emerald-500 transition-colors duration-200 z-30 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none cursor-pointer"
        title="Trợ lý Gemini AI đọc toàn bộ hồ sơ phòng khám"
      >
        <Sparkles className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
        <span>Trợ Lý Gemini AI</span>
      </button>

      {/* Hidden File Input for JSON Restore */}
      <input
        ref={backupFileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportBackupFile}
        className="hidden"
      />

      {/* Expanded Widescreen Footer (No print) */}
      <footer className="no-print mt-12 pb-24 lg:pb-8 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b0f17] py-6 text-slate-500 dark:text-slate-400 text-xs transition-colors">
        <div className="w-full max-w-[1840px] mx-auto px-6 lg:px-10 flex flex-col xl:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <strong className="text-slate-800 dark:text-slate-200 font-bold text-sm">
                {clinicInfo?.clinicName || 'Phòng Khám Nội Tổng Quát BS. Trần Văn Diệu'}
              </strong>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800 font-bold text-[11px]">
              CCHN: {clinicInfo?.licenseNumber || '00362/SYT-GPHĐ'}
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">
              Hệ thống Quản lý Y tế Zero-Trust tuân thủ Nghị định 333/2026/NĐ-CP
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2">
            <span
              className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-2xs"
              title="Đồng bộ tự động thời gian thực qua Cloud Supabase"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Cloud Supabase Realtime: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString('vi-VN') : 'Sẵn sàng 24/7'}</span>
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={() => setIsLegalModalOpen(true)}
              className="text-slate-600 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Kiểm tra pháp lý Y tế Việt Nam & Quốc tế"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Pháp lý Y tế (VN &amp; Quốc tế)</span>
            </button>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={() => setIsShortcutsModalOpen(true)}
              className="text-slate-600 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Xem danh sách phím tắt (Nhấn ? hoặc F12)"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Phím tắt (?)</span>
            </button>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={() => setIsUserGuideModalOpen(true)}
              className="text-slate-600 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Tài liệu hướng dẫn sử dụng (Nhấn F10)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Hướng dẫn</span>
            </button>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={handleExportBackup}
              className="text-slate-600 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Tải file sao lưu dữ liệu phòng khám (.json) về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sao lưu (JSON)</span>
            </button>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={() => backupFileInputRef.current?.click()}
              className="text-slate-600 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Khôi phục dữ liệu từ file JSON đã sao lưu"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Nạp file JSON</span>
            </button>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={handleResetDemoData}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Khôi phục mẫu</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LegalComplianceModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        clinicInfo={clinicInfo}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        onOpenUserGuide={() => setIsUserGuideModalOpen(true)}
      />

      <UserGuideModal
        isOpen={isUserGuideModalOpen}
        onClose={() => setIsUserGuideModalOpen(false)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
      />

      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSave={handleSavePatient}
        patientToEdit={patientToEdit}
        existingCount={patients.length}
      />

      <PharmacyCatalogModal
        isOpen={isPharmacyModalOpen}
        onClose={() => setIsPharmacyModalOpen(false)}
        catalog={pharmacyCatalog}
        onAddCatalogItem={handleAddCatalogItem}
        onBatchUpdateCatalog={(items) => setPharmacyCatalog(items)}
        onOpenCrawlerBot={() => setIsCrawlerBotOpen(true)}
      />

      <CrawlerBotModal
        isOpen={isCrawlerBotOpen}
        onClose={() => setIsCrawlerBotOpen(false)}
        clinicCatalog={pharmacyCatalog}
        onAddApprovedDrugs={handleAddApprovedDrugs}
      />

      <ClinicSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        clinicInfo={clinicInfo}
        onSave={(newSettings) => setClinicInfo(newSettings)}
      />

      <ClinicalAiModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        patient={activePatientForExam}
        allPatients={patients}
        allPrescriptions={prescriptions}
        catalog={pharmacyCatalog}
        diagnosis={
          liveDraft.diagnosis ||
          activePatientForExam?.chronicConditions?.[0] ||
          'Tăng huyết áp nguyên phát'
        }
        symptoms={liveDraft.symptoms || 'Khám bệnh định kỳ và theo dõi điều trị'}
        medications={liveDraft.medications}
        vitals={liveDraft.vitals}
      />

      <GmailInboxModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        userEmail={googleUser.email}
      />

      {/* Kế hoạch 3: Dashboard Báo Cáo Doanh Thu, Bệnh Nhân & Kho Dược */}
      {isReportsModalOpen && (
        <ErrorBoundary
          fallbackTitle="Không thể tải giao diện Báo Cáo"
          onReset={() => {
            setIsReportsModalOpen(false);
            navigateTo('consultation');
          }}
        >
          <ClinicReportsModal
            isOpen={isReportsModalOpen}
            onClose={() => {
              setIsReportsModalOpen(false);
              navigateTo(activeTab);
            }}
            prescriptions={prescriptions}
            patients={patients}
            catalog={pharmacyCatalog}
            clinicInfo={clinicInfo}
          />
        </ErrorBoundary>
      )}

      {/* Phân hệ 4: Quản Lý Lịch Hẹn & Nhắc Tái Khám Tự Động */}
      {isAppointmentsModalOpen && (
        <ErrorBoundary
          fallbackTitle="Không thể tải giao diện Lịch Hẹn"
          onReset={() => {
            setIsAppointmentsModalOpen(false);
            navigateTo('consultation');
          }}
        >
          <AppointmentRecallModal
            isOpen={isAppointmentsModalOpen}
            onClose={() => {
              setIsAppointmentsModalOpen(false);
              navigateTo(activeTab);
            }}
            prescriptions={prescriptions}
            patients={patients}
            clinicInfo={clinicInfo}
            onStartConsultationForPatient={(patientId) => {
              setSelectedPatientForExamId(patientId);
              setActiveTab('consultation');
              navigateTo('consultation', { patientId });
            }}
          />
        </ErrorBoundary>
      )}

      {/* Phê Duyệt & Quản Lý Thành Viên Gia Đình (SUPER_ADMIN) */}
      <UserApprovalModal
        isOpen={isUserApprovalModalOpen}
        onClose={() => setIsUserApprovalModalOpen(false)}
        onUsersUpdated={refreshPendingUsers}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
      />

      {/* Đổi Mật Khẩu Quản Trị Viên Master Admin */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      {/* Kế hoạch 2: Màn Hình Khóa PIN Bảo Mật Cục Bộ (iOS/LAN) */}
      <PinLockModal
        isLocked={isPinLocked}
        onUnlock={() => setIsPinLocked(false)}
      />
    </div>
  );
}