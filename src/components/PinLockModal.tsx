import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Delete, ArrowRight, KeyRound, AlertCircle, ShieldAlert } from 'lucide-react';

interface PinLockModalProps {
  isLocked: boolean;
  onUnlock: () => void;
  correctPin?: string;
  clinicName?: string;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isLocked,
  onUnlock,
  correctPin = '1234',
  clinicName = 'Phòng Khám BS. Trần Văn Diệu',
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  useEffect(() => {
    if (isLocked) {
      setPin('');
      setErrorMsg(null);
    }
  }, [isLocked]);

  // Countdown timer cho trường hợp bị khóa tạm thời do nhập sai quá 5 lần
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const timer = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMsg(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  if (!isLocked) return null;

  const logSecurityEvent = (action: string, status: 'SUCCESS' | 'FAILURE' | 'BLOCKED', details?: Record<string, unknown>) => {
    try {
      fetch('/api/security/audit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, status, details }),
      }).catch(() => {});
    } catch {}
  };

  const handleKeyPress = (num: string) => {
    if (lockoutTimer > 0) return;
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg(null);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (lockoutTimer > 0) return;
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const verifyPin = (inputPin: string) => {
    if (inputPin === correctPin) {
      setFailedAttempts(0);
      logSecurityEvent('PIN_AUTH_SUCCESS', 'SUCCESS', { clinicName });
      onUnlock();
    } else {
      const newFails = failedAttempts + 1;
      setFailedAttempts(newFails);
      setIsShaking(true);

      if (newFails >= 5) {
        setLockoutTimer(30);
        setErrorMsg('Nhập sai 5 lần! Khóa tạm thời trong 30 giây để bảo vệ dữ liệu y tế.');
        logSecurityEvent('PIN_BRUTE_FORCE_BLOCKED', 'BLOCKED', { attempts: newFails });
      } else {
        setErrorMsg(`Mã PIN không đúng (${newFails}/5 lần thử).`);
        logSecurityEvent('PIN_AUTH_FAILED', 'FAILURE', { attempt: newFails });
      }

      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div
        className={`w-full max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center transition-all duration-300 ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Clinic Icon Badge */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg mb-3 ${
          lockoutTimer > 0
            ? 'bg-rose-700 shadow-rose-700/30'
            : 'bg-emerald-700 dark:bg-emerald-600 shadow-emerald-700/30'
        }`}>
          {lockoutTimer > 0 ? (
            <ShieldAlert className="w-7 h-7 text-white" />
          ) : (
            <Lock className="w-7 h-7" />
          )}
        </div>

        <h3 className="text-base font-black text-slate-900 dark:text-white text-center">
          {clinicName}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
          {lockoutTimer > 0
            ? `Tạm khóa bảo vệ an toàn: Thử lại sau ${lockoutTimer}s`
            : 'Nhập mã PIN 4 số để mở khóa hồ sơ phòng khám'}
        </p>

        {/* 4 PIN Dots */}
        <div className="flex items-center justify-center gap-4 my-6">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  lockoutTimer > 0
                    ? 'bg-rose-300 dark:bg-rose-900'
                    : isFilled
                    ? 'bg-emerald-600 dark:bg-emerald-400 scale-110 shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-3 flex items-center gap-1.5 text-center animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="w-full grid grid-cols-3 gap-2.5 max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={lockoutTimer > 0}
              onClick={() => handleKeyPress(digit)}
              className="h-13 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-lg font-bold flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {digit}
            </button>
          ))}

          {/* Bottom Row */}
          <div className="flex items-center justify-center text-slate-400 text-xs">
            <KeyRound className="w-4 h-4" />
          </div>

          <button
            type="button"
            disabled={lockoutTimer > 0}
            onClick={() => handleKeyPress('0')}
            className="h-13 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-lg font-bold flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            0
          </button>

          <button
            type="button"
            disabled={lockoutTimer > 0}
            onClick={handleDelete}
            aria-label="Xóa 1 số"
            className="h-13 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-6 flex items-center gap-1.5 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bảo mật nội bộ phòng khám (PIN mặc định: 1234)</span>
        </div>
      </div>
    </div>
  );
};
