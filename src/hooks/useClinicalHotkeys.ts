import { useEffect } from 'react';

export interface UseClinicalHotkeysProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  navigateTo?: (tab: any, params?: any) => void;
  setPatientToEdit: (patient: any) => void;
  modals: {
    isShortcutsOpen: boolean;
    setIsShortcutsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isUserGuideOpen: boolean;
    setIsUserGuideOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isReportsOpen: boolean;
    setIsReportsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isLegalOpen: boolean;
    setIsLegalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isPatientOpen: boolean;
    setIsPatientOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isPharmacyOpen: boolean;
    setIsPharmacyOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isCrawlerBotOpen: boolean;
    setIsCrawlerBotOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isSettingsOpen: boolean;
    setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isAiAssistantOpen: boolean;
    setIsAiAssistantOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isGmailOpen: boolean;
    setIsGmailOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isUserApprovalOpen?: boolean;
    setIsUserApprovalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  };
}

export function useClinicalHotkeys({
  activeTab,
  setActiveTab,
  navigateTo,
  setPatientToEdit,
  modals,
}: UseClinicalHotkeysProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. ESCAPE: Đóng các modal đang hiển thị
      if (e.key === 'Escape') {
        if (modals.isShortcutsOpen) {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsShortcutsOpen(false);
          return;
        }
        if (modals.isUserGuideOpen) {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsUserGuideOpen(false);
          return;
        }
        if (modals.isReportsOpen) {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsReportsOpen(false);
          return;
        }
        if (modals.isLegalOpen) {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsLegalOpen(false);
          return;
        }
        if (modals.isPatientOpen) {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsPatientOpen(false);
          return;
        }
        if (modals.isPharmacyOpen) {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsPharmacyOpen(false);
          return;
        }
        if (modals.isCrawlerBotOpen) {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsCrawlerBotOpen(false);
          return;
        }
        if (modals.isSettingsOpen) {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsSettingsOpen(false);
          return;
        }
        if (modals.isAiAssistantOpen) {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsAiAssistantOpen(false);
          return;
        }
        if (modals.isGmailOpen) {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsGmailOpen(false);
          return;
        }
        if (modals.isUserApprovalOpen && modals.setIsUserApprovalOpen) {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsUserApprovalOpen(false);
          return;
        }
      }

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // 2. Chuyển Tab & Phím Alt (Alt + 1..4, Alt + B/N/D/T/K/J/R/G)
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          e.stopPropagation();
          setActiveTab('consultation');
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          e.stopPropagation();
          setActiveTab('patients');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          e.stopPropagation();
          setActiveTab('prescriptions');
          return;
        }
        if (e.key === '4') {
          e.preventDefault();
          e.stopPropagation();
          setActiveTab('print');
          return;
        }

        const lowerKey = e.key.toLowerCase();
        if (lowerKey === 'u' && modals.setIsUserApprovalOpen) {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsUserApprovalOpen((prev) => !prev);
          return;
        }
        if (lowerKey === 'n') {
          e.preventDefault();
          e.stopPropagation();
          setPatientToEdit(null);
          modals.setIsPatientOpen(true);
          return;
        }
        if (lowerKey === 't') {
          e.preventDefault();
          e.stopPropagation();
          if (activeTab !== 'consultation') setActiveTab('consultation');
          setTimeout(() => window.dispatchEvent(new CustomEvent('clinic:add-custom-drug')), 50);
          return;
        }
        if (lowerKey === 'b') {
          e.preventDefault();
          e.stopPropagation();
          if (activeTab !== 'consultation') setActiveTab('consultation');
          setTimeout(() => window.dispatchEvent(new CustomEvent('clinic:focus-patient-search')), 50);
          return;
        }
        if (lowerKey === 'd') {
          e.preventDefault();
          e.stopPropagation();
          if (activeTab !== 'consultation') setActiveTab('consultation');
          setTimeout(() => window.dispatchEvent(new CustomEvent('clinic:focus-diagnosis')), 50);
          return;
        }
        if (lowerKey === 'r') {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('clinic:review-rx'));
          return;
        }
        if (lowerKey === 'k') {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsPharmacyOpen(true);
          return;
        }
        if (lowerKey === 'j') {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsAiAssistantOpen(true);
          return;
        }
        if (lowerKey === 'g') {
          e.preventDefault();
          e.stopPropagation();
          modals.setIsUserGuideOpen(true);
          return;
        }
      }

      // 3. Phím chức năng F1 -> F12 (Zero-Mouse Clinical Operations)
      if (e.key === 'F1') {
        e.preventDefault();
        e.stopPropagation();
        if (activeTab !== 'consultation') setActiveTab('consultation');
        setTimeout(() => window.dispatchEvent(new CustomEvent('clinic:focus-patient-search')), 50);
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        e.stopPropagation();
        if (activeTab !== 'consultation') setActiveTab('consultation');
        setTimeout(() => window.dispatchEvent(new CustomEvent('clinic:focus-drug-search')), 50);
        return;
      }

      if (e.key === 'F3') {
        e.preventDefault();
        e.stopPropagation();
        setPatientToEdit(null);
        modals.setIsPatientOpen(true);
        return;
      }

      if (e.key === 'F4') {
        e.preventDefault();
        e.stopPropagation();
        if (activeTab !== 'consultation') setActiveTab('consultation');
        setTimeout(() => window.dispatchEvent(new CustomEvent('clinic:focus-diagnosis')), 50);
        return;
      }

      if (e.key === 'F6') {
        e.preventDefault();
        e.stopPropagation();
        modals.setIsPharmacyOpen(true);
        return;
      }

      if (e.key === 'F7') {
        e.preventDefault();
        e.stopPropagation();
        modals.setIsAiAssistantOpen(true);
        return;
      }

      if (e.key === 'F8') {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('clinic:review-rx'));
        return;
      }

      if (e.key === 'F9') {
        e.preventDefault();
        e.stopPropagation();
        if (activeTab === 'consultation') {
          window.dispatchEvent(new CustomEvent('clinic:save-and-print-rx'));
          return;
        }
        if (activeTab === 'print') {
          window.print();
          return;
        }
        modals.setIsReportsOpen((prev) => {
          const next = !prev;
          if (navigateTo) {
            navigateTo(next ? 'reports' : activeTab);
          }
          return next;
        });
        return;
      }

      if (e.key === 'F10') {
        e.preventDefault();
        e.stopPropagation();
        modals.setIsUserGuideOpen((prev) => !prev);
        return;
      }

      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        modals.setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // 4. Ctrl + S (Lưu Đơn Thuốc)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('clinic:save-rx'));
        return;
      }

      // 5. Ctrl + Enter (Lưu & In Đơn Thuốc Ngay Lập Tức)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('clinic:save-and-print-rx'));
        return;
      }

      // 6. Phím hỏi chấm '?' (Mở bảng tra cứu phím tắt)
      if (!isInput && e.key === '?') {
        e.preventDefault();
        e.stopPropagation();
        modals.setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // 7. Phím gạch chéo '/' (Nhảy vào ô tìm thuốc tức thì)
      if (!isInput && e.key === '/') {
        e.preventDefault();
        e.stopPropagation();
        if (activeTab !== 'consultation') setActiveTab('consultation');
        setTimeout(() => window.dispatchEvent(new CustomEvent('clinic:focus-drug-search')), 50);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [activeTab, setActiveTab, navigateTo, setPatientToEdit, modals]);
}
