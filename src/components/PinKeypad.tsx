import React, { useEffect, useState } from 'react';
import { Delete, RotateCcw } from 'lucide-react';

interface PinKeypadProps {
  title: string;
  subtitle?: string;
  expectedPin: string;
  onSuccess: () => void;
  errorText?: string;
  hintText?: string;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({
  title,
  subtitle,
  expectedPin,
  onSuccess,
  errorText = 'รหัส PIN 4 หลักไม่ถูกต้อง ลองใหม่อีกครั้งนะ',
  hintText,
}) => {
  const [digits, setDigits] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  const handleDigit = (d: string) => {
    if (digits.length >= 4) return;
    setHasError(false);
    const next = digits + d;
    setDigits(next);

    if (next.length === 4) {
      if (next === expectedPin) {
        setTimeout(() => {
          setDigits('');
          onSuccess();
        }, 120);
      } else {
        setHasError(true);
        setTimeout(() => {
          setDigits('');
        }, 500);
      }
    }
  };

  const handleBackspace = () => {
    setHasError(false);
    setDigits((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setHasError(false);
    setDigits('');
  };

  // Support physical keyboard entry for desktop/tablet users
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col items-center space-y-5">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      {/* 4 PIN Dots */}
      <div
        className={`flex items-center justify-center gap-3.5 py-2 ${
          hasError ? 'animate-bounce' : ''
        }`}
        aria-label={`กรอกรหัสแล้ว ${digits.length} จาก 4 หลัก`}
      >
        {[0, 1, 2, 3].map((idx) => {
          const filled = idx < digits.length;
          return (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                hasError
                  ? 'bg-rose-500 scale-110'
                  : filled
                  ? 'bg-violet-600 scale-110 shadow-sm shadow-violet-400/50'
                  : 'bg-slate-200'
              }`}
            />
          );
        })}
      </div>

      {hasError ? (
        <p className="text-xs font-bold text-rose-600 text-center min-h-[18px]">
          {errorText}
        </p>
      ) : (
        <p className="text-xs text-slate-400 text-center min-h-[18px]">
          {hintText || 'กดรหัสตัวเลข 4 หลัก'}
        </p>
      )}

      {/* Tactile 3x4 Numeric Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[264px]">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handleDigit(k)}
            className="h-14 rounded-2xl bg-white hover:bg-violet-50 active:scale-95 text-xl font-bold text-slate-800 shadow-[0_6px_18px_rgba(110,120,190,0.1)] border border-slate-100 transition-all tabular-nums flex items-center justify-center"
          >
            {k}
          </button>
        ))}

        <button
          type="button"
          onClick={handleClear}
          aria-label="ล้างรหัส"
          className="h-14 rounded-2xl bg-slate-100/90 hover:bg-slate-200 active:scale-95 text-xs font-bold text-slate-600 flex items-center justify-center gap-1 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>ล้าง</span>
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-14 rounded-2xl bg-white hover:bg-violet-50 active:scale-95 text-xl font-bold text-slate-800 shadow-[0_6px_18px_rgba(110,120,190,0.1)] border border-slate-100 transition-all tabular-nums flex items-center justify-center"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          aria-label="ลบตัวเลข"
          className="h-14 rounded-2xl bg-slate-100/90 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition-all"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
