import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

interface LoginQuoteToastProps {
  open: boolean;
  childName: string;
  quote: string;
  quoteNumber: number;
  durationMs?: number;
  onClose: () => void;
}

export const LoginQuoteToast: React.FC<LoginQuoteToastProps> = ({
  open,
  childName,
  quote,
  quoteNumber,
  durationMs = 7000,
  onClose,
}) => {
  const [barStarted, setBarStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(durationMs / 1000));

  useEffect(() => {
    if (!open) {
      setBarStarted(false);
      return;
    }

    setBarStarted(false);
    setSecondsLeft(Math.ceil(durationMs / 1000));

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setBarStarted(true);
      });
    });

    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => Math.max(1, prev - 1));
    }, 1000);

    const timeoutId = setTimeout(() => {
      onClose();
    }, durationMs);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [open, quote, durationMs, onClose]);

  if (!open || !quote) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-xl pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto rounded-3xl bg-white/95 backdrop-blur-xl border border-violet-200/80 shadow-[0_20px_48px_-10px_rgba(95,105,195,0.35)] overflow-hidden">
        <div className="p-4 sm:p-5 flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl hero-pastel-gradient text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full">
                กำลังใจต้อนรับ {childName} · ข้อความที่ {quoteNumber}/300
              </span>
              <span className="text-[11px] font-semibold text-slate-400 tabular-nums shrink-0">
                ปิดอัตโนมัติใน {secondsLeft} วิ
              </span>
            </div>

            <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
              “{quote}”
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดการแจ้งเตือน"
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 7-Second Shrinking Progress Bar */}
        <div className="h-1.5 w-full bg-violet-100/70">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-500"
            style={{
              width: barStarted ? '0%' : '100%',
              transition: barStarted ? `width ${durationMs}ms linear` : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};
