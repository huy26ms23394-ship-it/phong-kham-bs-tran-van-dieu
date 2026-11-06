import React, { useState } from 'react';
import { ClinicSettings } from '../types/medical';
import { GoogleAuthBar, GoogleUser } from './GoogleAuthBar';
import {
  Stethoscope,
  Users,
  FileText,
  Printer,
  Pill,
  Settings,
  Plus,
  Sparkles,
  Sun,
  Moon,
  Bot,
  Keyboard,
  BookOpen,
  Wifi,
  BarChart3,
  Lock,
  CalendarCheck,
  Menu,
  X,
  Grid,
  ChevronRight,
  Shield,
  Mail,
} from 'lucide-react';

interface NavbarProps {
  clinicInfo: ClinicSettings;
  activeTab: 'consultation' | 'patients' | 'prescriptions' | 'print';
  setActiveTab: (tab: 'consultation' | 'patients' | 'prescriptions' | 'print') => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenNewPatientModal: () => void;
  onOpenPharmacyModal: () => void;
  pharmacyIssueCount?: number;
  onOpenReportsModal?: () => void;
  onOpenAppointmentsModal?: () => void;
  appointmentCount?: number;
  onLockApp?: () => void;
  onOpenCrawlerBot?: () => void;
  crawlerPendingCount?: number;
  onOpenSettingsModal: () => void;
  onOpenAiAssistant: () => void;
  onOpenGmailInbox: () => void;
  onOpenShortcuts?: () => void;
  onOpenUserGuide?: () => void;
  onOpenLanConnect?: () => void;
  totalPatientsCount: number;
  totalPrescriptionsCount: number;
  googleUser: GoogleUser;
  onGoogleLogin: (user: GoogleUser) => void;
  onGoogleLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  clinicInfo,
  activeTab,
  setActiveTab,
  isDarkMode = false,
  onToggleDarkMode,
  onOpenNewPatientModal,
  onOpenPharmacyModal,
  pharmacyIssueCount = 0,
  onOpenReportsModal,
  onOpenAppointmentsModal,
  appointmentCount = 0,
  onLockApp,
  onOpenCrawlerBot,
  crawlerPendingCount = 0,
  onOpenSettingsModal,
  onOpenAiAssistant,
  onOpenGmailInbox,
  onOpenShortcuts,
  onOpenUserGuide,
  onOpenLanConnect,
  totalPatientsCount,
  totalPrescriptionsCount,
  googleUser,
  onGoogleLogin,
  onGoogleLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navTabs: Array<{
    id: 'consultation' | 'patients' | 'prescriptions' | 'print';
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
    shortcut: string;
    count?: number;
  }> = [
    {
      id: 'consultation',
      label: 'Khám Bệnh & Kê Toa',
      shortLabel: 'Khám & Kê Toa',
      icon: Stethoscope,
      shortcut: 'Alt+1',
    },
    {
      id: 'patients',
      label: 'Danh Sách Bệnh Nhân',
      shortLabel: 'Bệnh Nhân',
      icon: Users,
      shortcut: 'Alt+2',
      count: totalPatientsCount,
    },
    {
      id: 'prescriptions',
      label: 'Hồ Sơ Toa Thuốc',
      shortLabel: 'Hồ Sơ Toa',
      icon: FileText,
      shortcut: 'Alt+3',
      count: totalPrescriptionsCount,
    },
    {
      id: 'print',
      label: 'In Toa & Lịch Uống',
      shortLabel: 'In Toa',
      icon: Printer,
      shortcut: 'Alt+4',
    },
  ];

  const totalAlertBadge = (pharmacyIssueCount || 0) + (appointmentCount || 0) + (crawlerPendingCount || 0);

  return (
    <>
      <header className="no-print w-full bg-white dark:bg-[#0b0f17] border-b border-slate-200/90 dark:border-slate-800 transition-colors duration-200 sticky top-0 z-30 shadow-2xs">
        {/* TIER 1: Minimalist Brand & Primary Actions */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-12 sm:h-13 flex items-center justify-between gap-2">
          {/* Brand Identity */}
          <div
            className="flex items-center gap-2 min-w-0 select-none cursor-default"
            title={`${clinicInfo?.clinicName || 'Phòng Khám BS. Trần Văn Diệu'} · CCHN: ${clinicInfo?.licenseNumber || '08362/SYT-GPHĐ'} · ${clinicInfo?.doctorTitle || 'BS.'} ${clinicInfo?.doctorName || 'Trần Văn Diệu'} · ĐT: ${clinicInfo?.phone || ''}`}
          >
            <div className="w-8 h-8 rounded-md bg-emerald-700 dark:bg-emerald-600 flex items-center justify-center text-white shadow-2xs shrink-0">
              <Stethoscope className="w-4.5 h-4.5 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 uppercase truncate block">
                <span className="sm:hidden">PK. BS. Diệu</span>
                <span className="hidden sm:inline">{(clinicInfo?.clinicName || 'PHÒNG KHÁM BÁC SĨ TRẦN VĂN DIỆU').replace('PHÒNG KHÁM ', 'PK. ')}</span>
              </span>
              <span className="hidden md:inline text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200/80 dark:border-emerald-800/80 shrink-0">
                CCHN: {clinicInfo?.licenseNumber || '08362/SYT-GPHĐ'}
              </span>
            </div>
          </div>

          {/* Top-Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Primary Action: Thêm Bệnh Nhân (Visible everywhere) */}
            <button
              type="button"
              onClick={onOpenNewPatientModal}
              className="h-8.5 px-2.5 sm:px-3 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-md font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer whitespace-nowrap active:scale-98"
              title="Tiếp nhận và thêm bệnh nhân mới (Phím tắt: F3)"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden xs:inline">Thêm BN</span>
              <span className="xs:hidden font-bold">BN</span>
              <kbd className="hidden lg:inline px-1 py-0.2 text-[9px] font-mono bg-emerald-900/60 text-emerald-200 rounded font-bold">
                F3
              </kbd>
            </button>

            {/* Dark Mode Toggle: Always visible */}
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
                title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
                className="h-8.5 w-8.5 rounded-md border border-slate-200/80 dark:border-slate-700/80 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer"
              >
                {isDarkMode ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                )}
              </button>
            )}

            {/* Quick LAN / iPhone Connect (Tablet & Desktop: md+) */}
            {onOpenLanConnect && (
              <button
                type="button"
                onClick={onOpenLanConnect}
                className="hidden md:flex h-8.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 rounded-md font-bold text-xs items-center gap-1.5 transition-colors border border-emerald-200 dark:border-emerald-800/80 cursor-pointer"
                title="Kết nối iPhone / Điện thoại cùng mạng Wi-Fi nội bộ (Quét mã QR)"
              >
                <Wifi className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                <span className="hidden lg:inline">iPhone / LAN</span>
              </button>
            )}

            {/* Quick Shortcuts Button (Desktop: lg+) */}
            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                className="hidden lg:flex h-8.5 px-2 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-bold text-xs items-center gap-1 transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
                title="Xem danh sách phím tắt thao tác nhanh (? hoặc F12)"
              >
                <Keyboard className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <kbd className="px-1 py-0.2 text-[9px] font-mono bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 font-bold">
                  ?
                </kbd>
              </button>
            )}

            {/* User Guide Button (Desktop: xl+) */}
            {onOpenUserGuide && (
              <button
                type="button"
                onClick={onOpenUserGuide}
                className="hidden xl:flex h-8.5 px-2 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-bold text-xs items-center gap-1 transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
                title="Tài liệu hướng dẫn sử dụng phòng khám (F10)"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <kbd className="px-1 py-0.2 text-[9px] font-mono bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 font-bold">
                  F10
                </kbd>
              </button>
            )}

            {/* Settings (Tablet & Desktop: md+) */}
            <button
              type="button"
              onClick={onOpenSettingsModal}
              aria-label="Cài đặt thông tin phòng khám"
              title="Cài đặt thông tin phòng khám"
              className="hidden md:flex h-8.5 w-8.5 items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors duration-150 border border-slate-200/80 dark:border-slate-700/80 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            {/* User Account / Gmail Profile (Tablet & Desktop: md+) */}
            <div className="hidden md:block">
              <GoogleAuthBar
                currentUser={googleUser}
                onLogin={onGoogleLogin}
                onLogout={onGoogleLogout}
                onOpenGmailInbox={onOpenGmailInbox}
              />
            </div>

            {/* Quick Lock PIN Button (Tablet & Desktop: md+) */}
            {onLockApp && (
              <button
                type="button"
                onClick={onLockApp}
                aria-label="Khóa bảo mật ứng dụng (Mã PIN)"
                title="Khóa nhanh màn hình phòng khám (Mã PIN)"
                className="hidden md:flex h-8.5 px-2 bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/60 text-slate-700 hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-400 rounded-md transition-colors duration-150 border border-slate-200/80 dark:border-slate-700/80 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none cursor-pointer items-center gap-1 text-xs font-semibold"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span className="hidden xl:inline">Khóa</span>
              </button>
            )}

            {/* MOBILE MENU TRIGGER BUTTON (Mobile only: < md) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden relative h-8.5 px-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
              aria-label="Mở danh mục tiện ích phòng khám"
            >
              <Grid className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Tiện Ích</span>
              {totalAlertBadge > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* TIER 2: Workspace Sub-Menu & Clinical Tools Toolbar (IPAD & DESKTOP: md+) */}
        {/* Hidden on mobile (< md) to eliminate clutter and save valuable screen height */}
        <div className="hidden md:block bg-slate-50/80 dark:bg-[#121824]/90 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3 flex-nowrap">
            {/* Left: 4 Primary Workspace Navigation Tabs */}
            <nav
              aria-label="Điều hướng phân hệ làm việc"
              role="tablist"
              className="flex items-center gap-1 shrink-0"
            >
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    title={`${tab.label} (Phím tắt: ${tab.shortcut})`}
                    className={`h-8 px-2.5 sm:px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="hidden xl:inline">{tab.label}</span>
                    <span className="xl:hidden">{tab.shortLabel}</span>
                    {typeof tab.count === 'number' && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isActive
                            ? 'bg-emerald-900/60 text-emerald-50'
                            : 'bg-slate-200 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right: Specialized Clinical Tools (Compact Icon Buttons with Hover Tooltip) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Tool 1: Bot Cào Thuốc (AI) */}
              {onOpenCrawlerBot && (
                <div className="relative group">
                  <button
                    type="button"
                    onClick={onOpenCrawlerBot}
                    aria-label="Bot tự động cào thuốc mới (AI)"
                    className="h-8 w-8 bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 rounded-md flex items-center justify-center border border-emerald-200 dark:border-emerald-800/80 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer relative shadow-2xs"
                  >
                    <Bot className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                    {crawlerPendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-[15px] rounded-full text-[9px] font-mono font-bold bg-amber-500 text-slate-950 flex items-center justify-center">
                        {crawlerPendingCount}
                      </span>
                    )}
                  </button>
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50 transition-all duration-150">
                    <div className="bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded shadow-lg whitespace-nowrap border border-slate-700">
                      Bot Thuốc (AI) · Cào &amp; đối soát tự động
                    </div>
                    <div className="w-2 h-1 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                  </div>
                </div>
              )}

              {/* Tool 2: Kho Thuốc (F6) */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={onOpenPharmacyModal}
                  aria-label="Danh mục Kho Thuốc Phòng Khám (F6)"
                  className="h-8 w-8 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-md flex items-center justify-center transition-colors duration-150 border border-slate-200/90 dark:border-slate-700/80 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer shadow-2xs relative"
                >
                  <Pill className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  {pharmacyIssueCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-[15px] rounded-full text-[9px] font-mono font-bold bg-amber-500 text-slate-950 flex items-center justify-center animate-pulse">
                      {pharmacyIssueCount}
                    </span>
                  )}
                </button>
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50 transition-all duration-150">
                  <div className="bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded shadow-lg whitespace-nowrap border border-slate-700">
                    Kho Thuốc (44+ loại) · Phím tắt: F6
                  </div>
                  <div className="w-2 h-1 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                </div>
              </div>

              {/* Tool 3: Trợ Lý Gemini AI (F7) */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={onOpenAiAssistant}
                  aria-label="Trợ lý lâm sàng Gemini AI (F7)"
                  className="h-8 w-8 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-md flex items-center justify-center transition-colors duration-150 border border-slate-200/90 dark:border-slate-700/80 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
                </button>
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50 transition-all duration-150">
                  <div className="bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded shadow-lg whitespace-nowrap border border-slate-700">
                    Trợ Lý Lâm Sàng Gemini AI · Phím tắt: F7
                  </div>
                  <div className="w-2 h-1 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                </div>
              </div>

              {/* Tool 4: Lịch Hẹn & Tái Khám */}
              {onOpenAppointmentsModal && (
                <div className="relative group">
                  <button
                    type="button"
                    onClick={onOpenAppointmentsModal}
                    aria-label="Quản lý lịch hẹn tái khám (Zalo/SMS)"
                    className="h-8 w-8 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-md flex items-center justify-center transition-colors duration-150 border border-slate-200/90 dark:border-slate-700/80 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer shadow-2xs relative"
                  >
                    <CalendarCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                    {typeof appointmentCount === 'number' && appointmentCount > 0 && (
                      <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-[15px] rounded-full text-[9px] font-mono font-bold bg-teal-500 text-slate-950 flex items-center justify-center">
                        {appointmentCount}
                      </span>
                    )}
                  </button>
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50 transition-all duration-150">
                    <div className="bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded shadow-lg whitespace-nowrap border border-slate-700">
                      Lịch Hẹn Tái Khám &amp; Nhắc Zalo/SMS
                    </div>
                    <div className="w-2 h-1 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                  </div>
                </div>
              )}

              {/* Tool 5: Báo Cáo & Quản Lý Kho / Doanh Thu (F9) */}
              {onOpenReportsModal && (
                <div className="relative group">
                  <button
                    type="button"
                    onClick={onOpenReportsModal}
                    aria-label="Báo cáo doanh thu và kho dược (F9)"
                    className="h-8 w-8 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-md flex items-center justify-center transition-colors duration-150 border border-slate-200/90 dark:border-slate-700/80 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer shadow-2xs"
                  >
                    <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </button>
                  {/* Tooltip on hover (aligned right) */}
                  <div className="pointer-events-none absolute bottom-full right-0 mb-1.5 hidden group-hover:flex flex-col items-end z-50 transition-all duration-150">
                    <div className="bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded shadow-lg whitespace-nowrap border border-slate-700">
                      Báo Cáo Doanh Thu &amp; Kho Dược · Phím tắt: F9
                    </div>
                    <div className="w-2 h-1 mr-3 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (< md screens: iPhone / Android) */}
      <nav
        aria-label="Điều hướng di động iPhone / Android"
        className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] grid grid-cols-5 gap-1 shadow-lg"
      >
        {[
          { id: 'consultation' as const, shortLabel: 'Khám & Toa', icon: Stethoscope, action: () => setActiveTab('consultation'), isActive: activeTab === 'consultation' },
          { id: 'patients' as const, shortLabel: 'Bệnh Nhân', icon: Users, badge: totalPatientsCount, action: () => setActiveTab('patients'), isActive: activeTab === 'patients' },
          { id: 'prescriptions' as const, shortLabel: 'Hồ Sơ Toa', icon: FileText, badge: totalPrescriptionsCount, action: () => setActiveTab('prescriptions'), isActive: activeTab === 'prescriptions' },
          { id: 'pharmacy' as const, shortLabel: 'Kho Thuốc', icon: Pill, badge: pharmacyIssueCount, action: onOpenPharmacyModal, isActive: false },
          { id: 'more' as const, shortLabel: 'Tiện Ích', icon: Grid, badge: (appointmentCount || 0) + (crawlerPendingCount || 0), action: () => setIsMobileMenuOpen(true), isActive: isMobileMenuOpen },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className={`min-h-[46px] rounded-md flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors relative cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-emerald-800 dark:bg-emerald-700 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="truncate">{item.shortLabel}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`absolute top-1 right-1 px-1 rounded-full text-[9px] font-mono ${
                    isActive
                      ? 'bg-emerald-950 text-emerald-200'
                      : 'bg-amber-500 text-slate-950 font-extrabold'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* MOBILE ACTION SHEET / DRAWER (< md screens: iPhone / iPad mini) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMobileMenuOpen(false);
          }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 dark:bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Công Cụ &amp; Tiện Ích Phòng Khám
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {clinicInfo.clinicName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 2-Column Action Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Báo Cáo Doanh Thu */}
              {onOpenReportsModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenReportsModal();
                  }}
                  className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-left flex items-start gap-2.5 active:scale-98 transition-all cursor-pointer"
                >
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Báo Cáo (F9)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Doanh thu &amp; Kho dược</div>
                  </div>
                </button>
              )}

              {/* 2. Lịch Hẹn & Tái Khám */}
              {onOpenAppointmentsModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAppointmentsModal();
                  }}
                  className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-left flex items-start gap-2.5 active:scale-98 transition-all cursor-pointer relative"
                >
                  <CalendarCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Lịch Hẹn Tái Khám</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Nhắc Zalo / SMS</div>
                  </div>
                  {typeof appointmentCount === 'number' && appointmentCount > 0 && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-teal-600 text-white">
                      {appointmentCount}
                    </span>
                  )}
                </button>
              )}

              {/* 3. Trợ Lý Gemini AI */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAiAssistant();
                }}
                className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-left flex items-start gap-2.5 active:scale-98 transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Trợ Lý Gemini AI</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Tương tác &amp; Gợi ý thuốc</div>
                </div>
              </button>

              {/* 4. In Toa & Lịch Uống */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setActiveTab('print');
                }}
                className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-left flex items-start gap-2.5 active:scale-98 transition-all cursor-pointer"
              >
                <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">In Toa &amp; Lịch Uống</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Khổ A4/A5 VietQR</div>
                </div>
              </button>

              {/* 5. Bot Cào Thuốc AI */}
              {onOpenCrawlerBot && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenCrawlerBot();
                  }}
                  className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-left flex items-start gap-2.5 active:scale-98 transition-all cursor-pointer relative"
                >
                  <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Bot Thuốc (AI)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Cào danh mục tự động</div>
                  </div>
                  {crawlerPendingCount > 0 && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500 text-slate-950">
                      {crawlerPendingCount}
                    </span>
                  )}
                </button>
              )}

              {/* 6. Kết Nối iPhone / LAN */}
              {onOpenLanConnect && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenLanConnect();
                  }}
                  className="p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200/80 dark:border-cyan-800/60 text-left flex items-start gap-2.5 active:scale-98 transition-all cursor-pointer"
                >
                  <Wifi className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">iPhone / Wi-Fi LAN</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Quét mã QR kết nối</div>
                  </div>
                </button>
              )}

              {/* 7. Cài Đặt Phòng Khám */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSettingsModal();
                }}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left flex items-start gap-2.5 active:scale-98 transition-all cursor-pointer"
              >
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Cài Đặt Phòng Khám</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Tài khoản &amp; Tiền khám</div>
                </div>
              </button>

              {/* 8. Khóa Màn Hình (PIN) */}
              {onLockApp && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLockApp();
                  }}
                  className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 text-left flex items-start gap-2.5 active:scale-98 transition-all cursor-pointer"
                >
                  <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Khóa Màn Hình</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Bảo mật mã PIN 4 số</div>
                  </div>
                </button>
              )}
            </div>

            {/* Account & Additional Links */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {googleUser.name.charAt(0) || 'D'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {googleUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {googleUser.email || 'Bác sĩ phụ trách'}
                    </div>
                  </div>
                </div>

                {onOpenGmailInbox && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenGmailInbox();
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-md cursor-pointer"
                  >
                    Hộp Thư
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                {onOpenUserGuide && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenUserGuide();
                    }}
                    className="hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold cursor-pointer"
                  >
                    📖 Hướng Dẫn Sử Dụng
                  </button>
                )}
                {onOpenShortcuts && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenShortcuts();
                    }}
                    className="hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold cursor-pointer"
                  >
                    ⌨ Phím Tắt
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
