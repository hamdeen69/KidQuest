import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, ShieldCheck, Timer } from 'lucide-react';
import { toastEncouragement } from '../utils/swal';

interface ScreenTimeRingProps {
  limitMinutes: number;
  activeChildName: string;
  screenTimeLabel?: string;
  choreTimerLabel?: string;
}

export const ScreenTimeRing: React.FC<ScreenTimeRingProps> = ({
  limitMinutes,
  activeChildName,
  screenTimeLabel = 'พักสายตาในอีก',
  choreTimerLabel = 'โฟกัสภารกิจ',
}) => {
  const [mode, setMode] = useState<'screentime' | 'chore'>('screentime');
  const totalSeconds = mode === 'screentime' ? limitMinutes * 60 : 10 * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [hasNotifiedBreak, setHasNotifiedBreak] = useState(false);

  // Reset countdown when limit or mode changes
  useEffect(() => {
    const nextTotal = mode === 'screentime' ? limitMinutes * 60 : 10 * 60;
    setSecondsLeft(nextTotal);
    setHasNotifiedBreak(false);
    setIsRunning(mode === 'screentime');
  }, [limitMinutes, mode]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && !hasNotifiedBreak) {
      setHasNotifiedBreak(true);
      if (mode === 'screentime') {
        toastEncouragement(
          'ถึงเวลาพักสายตาแล้วนะ!',
          `${activeChildName} ใช้งานครบ ${limitMinutes} นาทีแล้ว มาวางหน้าจอแล้วไปสนุกกับกิจกรรมในบ้านกันต่อเลย`
        );
      } else {
        toastEncouragement(
          'ครบเวลาจับภารกิจแล้ว!',
          `เยี่ยมมาก ${activeChildName}! ถ้าทำภารกิจเสร็จแล้ว อย่าลืมถ่ายรูปส่งให้คุณพ่อคุณแม่ตรวจนะ`
        );
      }
    }
  }, [secondsLeft, hasNotifiedBreak, mode, activeChildName, limitMinutes]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const clampedProgress = Math.max(0.06, Math.min(1, progressRatio || 0.25));

  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <div className="flex flex-col items-center">
      {/* Mode switch segmented pill inside hero */}
      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/25 backdrop-blur-md mb-4">
        <button
          type="button"
          onClick={() => setMode('screentime')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
            mode === 'screentime'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-white/90 hover:bg-white/15'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>เวลาหน้าจอ</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('chore')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
            mode === 'chore'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-white/90 hover:bg-white/15'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>จับเวลาทำงาน</span>
        </button>
      </div>

      {/* Concentric Circular Ring matching Screenshot 1 */}
      <div className="relative w-56 h-56 flex items-center justify-center">
        {/* Outer soft translucent halo ring */}
        <div className="absolute inset-0 rounded-full border border-white/30" />

        {/* Inner white circle card */}
        <div className="relative w-48 h-48 rounded-full bg-white/95 shadow-[0_14px_40px_rgba(88,80,180,0.18)] flex flex-col items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          >
            <defs>
              <linearGradient id="ringArcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="55%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>
            </defs>
            {/* Subtle track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#EEF2FF"
              strokeWidth="10"
            />
            {/* Active gradient arc */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="url(#ringArcGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>

          <span className="text-xs font-medium text-slate-500 mb-0.5 z-10">
            {mode === 'screentime' ? screenTimeLabel : choreTimerLabel}
          </span>
          <div className="font-mono-num text-[38px] leading-none font-bold text-slate-900 tracking-tight z-10">
            {mm}:{ss}
          </div>

          {/* Play/Pause & Reset buttons inside circle */}
          <div className="flex items-center gap-2 mt-3 z-10">
            <button
              type="button"
              onClick={() => setIsRunning((r) => !r)}
              aria-label={isRunning ? 'หยุดชั่วคราว' : 'เริ่มจับเวลา'}
              className="w-10 h-10 rounded-full bg-violet-200/80 hover:bg-violet-300/90 text-violet-800 flex items-center justify-center transition-colors shadow-sm active:scale-95"
            >
              {isRunning ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setSecondsLeft(totalSeconds);
                setHasNotifiedBreak(false);
                setIsRunning(false);
              }}
              aria-label="รีเซ็ตเวลา"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
