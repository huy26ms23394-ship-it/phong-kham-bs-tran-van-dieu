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
import { ensure3000ClinicDrugs } from './data/vietnam3000DrugsGenerator';
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
import { RemoteAccessModal, NetworkStatusData } from './components/RemoteAccessModal';
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
import { ClinicThemeMode, ClinicLayoutMode } from './types/theme';
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
  Stethoscope,
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

  // Pharmacy Catalog State (Kho 3.000+ Biệt Dược Thông Dụng Việt Nam)
  const [pharmacyCatalog, setPharmacyCatalog] = useState<MedicationCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem('mediba_pharmacy_catalog_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 500) {
          return parsed;
        }
        const { catalog } = ensure3000ClinicDrugs(Array.isArray(parsed) ? parsed : CLINIC_MEDICATION_CATALOG);
        return catalog;
      }
    } catch {}
    const { catalog } = ensure3000ClinicDrugs(CLINIC_MEDICATION_CATALOG);
    return catalog;
  });

  // Preferred AI Model (gemini-3.5-flash -> gemini-3.8-flash -> gemini-3.5-flash-lite -> gemini-2.5-flash -> offline)
  const [preferredAiModel, setPreferredAiModel] = useState<string>(() => {
    try {
      return localStorage.getItem('mediba_preferred_ai_model') || 'gemini-3.5-flash';
    } catch {
      return 'gemini-3.5-flash';
    }
  });

  const handleAiModelChange = (model: string) => {
    setPreferredAiModel(model);
    try {
      localStorage.setItem('mediba_preferred_ai_model', model);
    } catch {}
  };

  // Hệ thống Đa Giao Diện Lâm Sàng (Theme & Layout State - Mặc định giữ nguyên 100% giao diện hiện tại)
  const [themeMode, setThemeMode] = useState<ClinicThemeMode>(() => {
    try {
      const saved = localStorage.getItem('dieu_clinic_theme_mode') as ClinicThemeMode;
      if (saved && ['classic-dark', 'clinical-light', 'ocean-medical', 'high-contrast'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'classic-dark'; // Mặc định: Y Tế Tối BS. Diệu
  });

  const [layoutMode, setLayoutMode] = useState<ClinicLayoutMode>(() => {
    try {
      const saved = localStorage.getItem('dieu_clinic_layout_mode') as ClinicLayoutMode;
      if (saved && ['standard', 'focus-prescribing', 'compact-pro'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'standard'; // Mặc định: Bố cục Chuẩn (8:4)
  });

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mediba_dark_mode');
      if (saved !== null) return saved === 'true';
      return true; // Mặc định giao diện tối y tế
    } catch {
      return true;
    }
  });

  // Đồng bộ themeMode với DOM & LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('dieu_clinic_theme_mode', themeMode);
      document.documentElement.setAttribute('data-theme', themeMode);
      if (themeMode === 'clinical-light') {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      } else {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    } catch {}
  }, [themeMode]);

  // Đồng bộ layoutMode với DOM & LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('dieu_clinic_layout_mode', layoutMode);
      document.documentElement.setAttribute('data-layout', layoutMode);
    } catch {}
  }, [layoutMode]);

  // Phím tắt nhanh Ctrl+Alt+T chuyển nhanh qua lại giữa 4 theme
  useEffect(() => {
    const handleThemeKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setThemeMode((prev) => {
          const order: ClinicThemeMode[] = ['classic-dark', 'clinical-light', 'ocean-medical', 'high-contrast'];
          const nextIdx = (order.indexOf(prev) + 1) % order.length;
          return order[nextIdx];
        });
      }
    };
    window.addEventListener('keydown', handleThemeKey);
    return () => window.removeEventListener('keydown', handleThemeKey);
  }, []);

  const handleToggleDarkMode = () => {
    if (themeMode === 'clinical-light') {
      setThemeMode('classic-dark');
    } else {
      setThemeMode('clinical-light');
    }
  };

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

  // Live consultation draft ref (không dùng useState để tránh re-render toàn App mỗi lần bác sĩ gõ phím)
  const liveDraftRef = useRef<{
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

  const handleDraftChange = React.useCallback(
    (draft: {
      patient?: Patient;
      diagnosis: string;
      symptoms: string;
      medications: PrescribedMedication[];
      vitals: { bloodPressure: string; pulse: number; weight: number; height: number };
    }) => {
      liveDraftRef.current = draft;
    },
    []
  );

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
  const [isRemoteAccessModalOpen, setIsRemoteAccessModalOpen] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatusData | null>(null);
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

  const refreshNetworkStatus = React.useCallback(async () => {
    if (authUser?.role === 'SUPER_ADMIN') {
      try {
        const res = await fetch('/api/system/network-status', {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setNetworkStatus(data);
          }
        }
      } catch {}
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser?.role === 'SUPER_ADMIN') {
      refreshPendingUsers();
      refreshNetworkStatus();
      const interval = setInterval(() => {
        refreshPendingUsers();
        refreshNetworkStatus();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [authUser, refreshNetworkStatus]);

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

  // Lắng nghe lệnh in trực tiếp từ Modal Review (F9 / Ctrl + Enter / Nút In)
  useEffect(() => {
    const handlePrintDirect = (e: any) => {
      if (e.detail) {
        setCurrentPrintPrescription(e.detail);
        setActiveTab('print');
        setTimeout(() => {
          window.print();
        }, 280);
      }
    };
    window.addEventListener('clinic:print-direct-rx', handlePrintDirect);
    return () => window.removeEventListener('clinic:print-direct-rx', handlePrintDirect);
  }, []);

  const hasHydratedLanRef = useRef(false);
  const isPullingLanRef = useRef(false);
  const lastSyncEtagRef = useRef<string>('');
  const lanSyncDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // Pharmacy audit issues count for badge notification (chỉ quét thuốc cốt lõi/tùy chỉnh để đạt 0ms khởi động)
  const pharmacyIssueCount = useMemo(() => {
    const coreAndCustom = pharmacyCatalog.filter(
      (it) => !it.id.startsWith('vn3k-') || (it as any).isCustom
    );
    const report = auditPharmacyCatalog(coreAndCustom);
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
      const fullCatalog = payload?.pharmacyCatalog ?? pharmacyCatalog;
      const catalogToSync = fullCatalog.length > 500
        ? fullCatalog.filter((it) => !it.id.startsWith('vn3k-') || (it as any).isCustom)
        : fullCatalog;

      const res = await fetch('/api/clinic/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          clinicInfo: payload?.clinicInfo ?? clinicInfo,
          patients: payload?.patients ?? patients,
          prescriptions: payload?.prescriptions ?? prescriptions,
          pharmacyCatalog: catalogToSync,
        }),
      });
      if (res.ok) {
        const resEtag = res.headers.get('ETag');
        const json = await res.json();
        if (resEtag || json.etag) {
          lastSyncEtagRef.current = resEtag || json.etag;
        }
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
      const headers: Record<string, string> = { ...getAuthHeaders() };
      if (lastSyncEtagRef.current) {
        headers['If-None-Match'] = lastSyncEtagRef.current;
      }
      const res = await fetch('/api/clinic/sync?light=1', { headers });
      if (res.status === 304) return;
      if (res.status === 401 || res.status === 403) {
        clearSession();
        setAuthUser(null);
        return;
      }
      if (!res.ok) return;
      const resEtag = res.headers.get('ETag');
      const json = await res.json();
      if (resEtag || json.etag) {
        lastSyncEtagRef.current = resEtag || json.etag;
      }
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
          const { catalog: merged } = ensure3000ClinicDrugs(json.data.pharmacyCatalog);
          setPharmacyCatalog(merged);
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

  // Đồng bộ 2 chiều qua SQLite Local Server với ETag 304 + Lightweight Mode (0ms khi không đổi)
  useEffect(() => {
    if (!authUser || authUser.status !== 'APPROVED') return;
    const syncInterval = setInterval(async () => {
      if (isPullingLanRef.current || document.hidden) return;
      try {
        const headers: Record<string, string> = { ...getAuthHeaders() };
        if (lastSyncEtagRef.current) {
          headers['If-None-Match'] = lastSyncEtagRef.current;
        }
        const res = await fetch('/api/clinic/sync?light=1&poll=1', { headers });
        if (res.status === 304) return;
        if (res.status === 401 || res.status === 403) {
          clearSession();
          setAuthUser(null);
          return;
        }
        if (!res.ok) return;
        const resEtag = res.headers.get('ETag');
        const json = await res.json();
        if (resEtag || json.etag) {
          lastSyncEtagRef.current = resEtag || json.etag;
        }
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
              const { catalog: merged } = ensure3000ClinicDrugs(json.data.pharmacyCatalog);
              setPharmacyCatalog(merged);
            }
            setLastSyncedAt(json.data.updatedAt);
          }
        }
      } catch {
        // Hoạt động offline an toàn
      }
    }, 12000);

    return () => clearInterval(syncInterval);
  }, [authUser, lastSyncedAt]);

  // Tự Động Khóa Màn Hình Khi Không Thao Tác (Auto-Inactivity PIN Lock sau 15 phút)
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      try {
        const isPinDisabled = localStorage.getItem('mediba_pin_lock_enabled') === 'false';
        if (!isPinDisabled && authUser && authUser.status === 'APPROVED') {
          idleTimer = setTimeout(() => {
            setIsPinLocked(true);
          }, 15 * 60 * 1000); // Mặc định 15 phút
        }
      } catch {}
    };

    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });
    window.addEventListener('click', resetIdle, { passive: true });
    window.addEventListener('scroll', resetIdle, { passive: true });
    resetIdle();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('touchstart', resetIdle);
      window.removeEventListener('click', resetIdle);
      window.removeEventListener('scroll', resetIdle);
    };
  }, [authUser]);

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
      // Chỉ lưu thuốc cốt lõi/tùy chỉnh vào localStorage để tránh lag JSON.stringify 1.5MB mỗi lần render
      const compactCatalog = pharmacyCatalog.filter(
        (it) => !it.id.startsWith('vn3k-') || (it as any).isCustom
      );
      localStorage.setItem('mediba_pharmacy_catalog_v2', JSON.stringify(compactCatalog));
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
    liveDraftRef.current.patient ||
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
          onToggleDarkMode={handleToggleDarkMode}
          currentTheme={themeMode}
          onThemeChange={setThemeMode}
          currentLayout={layoutMode}
          onLayoutChange={setLayoutMode}
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
          onOpenLanConnect={() => setIsRemoteAccessModalOpen(true)}
          isTunnelActive={networkStatus?.tunnel?.status === 'ACTIVE'}
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
          currentAiModel={preferredAiModel}
          onAiModelChange={handleAiModelChange}
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
              onUpdateClinicSettings={(newSettings) => setClinicInfo(newSettings)}
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
              onDraftChange={handleDraftChange}
              layoutMode={layoutMode}
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
              onClose={() => setActiveTab('prescriptions')}
            />
          )}
        </main>
      </div>

      {/* Floating Gemini AI Quick Button */}
      <button
        type="button"
        onClick={() => setIsAiAssistantOpen(true)}
        className="no-print fixed bottom-20 lg:bottom-6 right-5 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm border border-emerald-400/20 transition-all z-30 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none cursor-pointer"
        title="Trợ lý Gemini AI đọc toàn bộ hồ sơ phòng khám (F7)"
      >
        <Sparkles className="w-4 h-4 text-emerald-100" aria-hidden="true" />
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

      {/* Slim Status Bar & Clean 3-Column Footer (No print) */}
      <footer className="no-print mt-12 pb-24 lg:pb-6 border-t border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0b0f17]/95 backdrop-blur-xs py-3.5 text-slate-500 dark:text-slate-400 text-xs transition-colors shrink-0">
        <div className="w-full max-w-[1840px] mx-auto px-6 lg:px-10 grid grid-cols-1 md:grid-cols-12 items-center gap-3">
          {/* Cột Trái (5 cột trên md/xl): Biểu tượng ống nghe nhỏ + PHÒNG KHÁM NỘI TỔNG QUÁT BS. TRẦN VĂN DIỆU • CCHN: 00362/SYT-GPHĐ • 293/14 Tùng Thiện Vương, P.11, Q.8 */}
          <div className="md:col-span-5 flex items-center gap-2 min-w-0 text-[11px] text-slate-700 dark:text-slate-300">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            <div className="truncate">
              <strong className="font-bold text-slate-900 dark:text-slate-100">
                PHÒNG KHÁM NỘI TỔNG QUÁT BS. TRẦN VĂN DIỆU
              </strong>
              <span className="mx-1.5 text-slate-300 dark:text-slate-700">•</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                CCHN: {clinicInfo?.licenseNumber || '00362/SYT-GPHĐ'}
              </span>
              <span className="mx-1.5 text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                {clinicInfo?.address || '293/14 Tùng Thiện Vương, P.11, Q.8'}
              </span>
            </div>
          </div>

          {/* Cột Giữa (4 cột trên md/xl): Cụm chỉ dẫn phím tắt nhanh dạng kbd badge thanh lịch, gọn mắt */}
          <div className="md:col-span-4 flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] overflow-x-auto no-scrollbar">
            <span className="inline-flex items-center gap-1 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs">F1</kbd>
              <span>Tìm BN</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700 shrink-0">•</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs">F2</kbd>
              <span>Tìm thuốc</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700 shrink-0">•</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs">F4</kbd>
              <span>Chẩn đoán</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700 shrink-0">•</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs">F8</kbd>
              <span>Xem toa</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700 shrink-0">•</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">Ctrl+↵</kbd>
              <span>Lưu &amp; In</span>
            </span>
          </div>

          {/* Cột Phải (3 cột trên md/xl): Huy hiệu bảo mật Zero-Trust (NĐ 333/2026), Cloud Supabase và Phiên bản v2.5 Pro */}
          <div className="md:col-span-3 flex items-center justify-end gap-2.5 text-[11px] shrink-0">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold cursor-default"
              title="Tuân thủ Luật 116/2025/QH15 và Nghị định 333/2026/NĐ-CP về hồ sơ bệnh án điện tử"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Zero-Trust (NĐ 333)</span>
            </span>

            <button
              type="button"
              onClick={() => setIsRemoteAccessModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"
              title="Bấm để mở Bảng điều khiển Kết nối Từ xa (Cloudflare Tunnel) & Mạng LAN Nội bộ"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden lg:inline">
                {networkStatus?.tunnel?.status === 'ACTIVE' ? 'Tunnel Internet Active' : 'Local SQLite (WAL)'}
              </span>
            </button>

            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">
              v2.5 Pro
            </span>

            {/* Công cụ phụ trợ gọn nhẹ */}
            <button
              type="button"
              onClick={() => setIsLegalModalOpen(true)}
              className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 cursor-pointer transition-colors"
              title="Pháp lý Y tế Việt Nam"
            >
              <Scale className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleExportBackup}
              className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 cursor-pointer transition-colors"
              title="Sao lưu dữ liệu JSON"
            >
              <Download className="w-3.5 h-3.5" />
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
        onBatchUpdateCatalog={(items) => {
          setPharmacyCatalog(items);
          pushStateToLanServer({ pharmacyCatalog: items });
        }}
        onOpenCrawlerBot={() => setIsCrawlerBotOpen(true)}
      />

      <CrawlerBotModal
        isOpen={isCrawlerBotOpen}
        onClose={() => setIsCrawlerBotOpen(false)}
        clinicCatalog={pharmacyCatalog}
        onAddApprovedDrugs={(newDrugs) => {
          handleAddApprovedDrugs(newDrugs);
          const updated = [...pharmacyCatalog, ...newDrugs];
          pushStateToLanServer({ pharmacyCatalog: updated });
        }}
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
          liveDraftRef.current.diagnosis ||
          activePatientForExam?.chronicConditions?.[0] ||
          'Tăng huyết áp nguyên phát'
        }
        symptoms={liveDraftRef.current.symptoms || 'Khám bệnh định kỳ và theo dõi điều trị'}
        medications={liveDraftRef.current.medications}
        vitals={liveDraftRef.current.vitals}
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

      {/* Kết Nối Từ Xa (Cloudflare Tunnel) & Mạng LAN Nội Bộ */}
      <RemoteAccessModal
        isOpen={isRemoteAccessModalOpen}
        onClose={() => setIsRemoteAccessModalOpen(false)}
        networkStatus={networkStatus}
        onRefreshStatus={refreshNetworkStatus}
      />

      {/* Kế hoạch 2: Màn Hình Khóa PIN Bảo Mật Cục Bộ (iOS/LAN) */}
      <PinLockModal
        isLocked={isPinLocked}
        onUnlock={() => setIsPinLocked(false)}
      />
    </div>
  );
}