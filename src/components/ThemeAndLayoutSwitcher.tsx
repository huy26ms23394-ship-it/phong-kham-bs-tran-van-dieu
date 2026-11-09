import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Check,
  LayoutGrid,
  Maximize2,
  Minimize2,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  Eye,
} from 'lucide-react';
import {
  ClinicThemeMode,
  ClinicLayoutMode,
  CLINIC_THEMES,
  CLINIC_LAYOUTS,
} from '../types/theme';

interface ThemeAndLayoutSwitcherProps {
  currentTheme: ClinicThemeMode;
  onThemeChange: (theme: ClinicThemeMode) => void;
  currentLayout: ClinicLayoutMode;
  onLayoutChange: (layout: ClinicLayoutMode) => void;
  className?: string;
}

export const ThemeAndLayoutSwitcher: React.FC<ThemeAndLayoutSwitcherProps> = ({
  currentTheme,
  onThemeChange,
  currentLayout,
  onLayoutChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeThemeConfig = CLINIC_THEMES.find((t) => t.id === currentTheme) || CLINIC_THEMES[0];
  const activeLayoutConfig = CLINIC_LAYOUTS.find((l) => l.id === currentLayout) || CLINIC_LAYOUTS[0];

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Đổi Chủ Đề Màu Sắc & Bố Cục Hiển Thị"
        className="h-8.5 px-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-200/80 dark:border-slate-700/80 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer shadow-2xs"
      >
        <Palette className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
        <span className="hidden lg:inline text-slate-800 dark:text-slate-100">Giao Diện:</span>
        <span className="font-bold text-emerald-700 dark:text-emerald-300 max-w-[90px] sm:max-w-none truncate">
          {activeThemeConfig.name.split(' (')[0]}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn p-3.5 space-y-3.5 text-slate-800 dark:text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                Tùy Biến Giao Diện Lâm Sàng
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              BS. Trần Văn Diệu
            </span>
          </div>

          {/* Section 1: Color Themes (4 Modes) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Chủ Đề Màu Sắc (4 Chế Độ)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {CLINIC_THEMES.map((theme) => {
                const isActive = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      onThemeChange(theme.id);
                    }}
                    className={`p-2 rounded-lg text-left border transition-all cursor-pointer flex flex-col justify-between relative ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <span className="text-xs font-bold leading-tight">{theme.name}</span>
                      </div>
                      {isActive && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                      {theme.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Layout & Density Modes (3 Modes) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <LayoutGrid className="w-3 h-3" />
                Bố Cục & Mật Độ (3 Chế Độ)
              </span>
            </div>

            <div className="space-y-1">
              {CLINIC_LAYOUTS.map((layout) => {
                const isActive = currentLayout === layout.id;
                let IconComponent = LayoutGrid;
                if (layout.id === 'focus-prescribing') IconComponent = Maximize2;
                if (layout.id === 'compact-pro') IconComponent = Minimize2;

                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => {
                      onLayoutChange(layout.id);
                    }}
                    className={`w-full p-2 rounded-lg text-left border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {layout.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                            {layout.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate">
                          {layout.description}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick notice */}
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300">
            <span>💾 Tự động lưu cấu hình cá nhân</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">Ctrl+Alt+T</span>
          </div>
        </div>
      )}
    </div>
  );
};
