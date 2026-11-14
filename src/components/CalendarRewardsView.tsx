import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Gift,
  Sparkles,
  CheckCircle2,
  Coins,
} from 'lucide-react';
import { ChildProfile, ChoreSubmission, FamilyReward } from '../types';
import { formatDateKey } from '../data/initialData';
import { ChoreIconBadge } from './ChoreIllustration';

interface CalendarRewardsViewProps {
  activeChild: ChildProfile;
  submissions: ChoreSubmission[];
  rewards: FamilyReward[];
  onRedeemReward: (reward: FamilyReward) => void;
  onOpenAvatarWorkshop: () => void;
}

const WEEKDAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const CalendarRewardsView: React.FC<CalendarRewardsViewProps> = ({
  activeChild,
  submissions,
  rewards,
  onRedeemReward,
  onOpenAvatarWorkshop,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayKey = formatDateKey(today);

  const [viewMonth, setViewMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  const calendarCells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: {
      day: number;
      dateKey: string;
      inCurrentMonth: boolean;
    }[] = [];

    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      cells.push({
        day: prevMonthDays - i,
        dateKey: formatDateKey(d),
        inCurrentMonth: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      cells.push({
        day: d,
        dateKey: formatDateKey(dt),
        inCurrentMonth: true,
      });
    }

    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - (startWeekday + daysInMonth) + 1;
      const dt = new Date(year, month + 1, nextDay);
      cells.push({
        day: nextDay,
        dateKey: formatDateKey(dt),
        inCurrentMonth: false,
      });
    }

    return cells;
  }, [viewMonth]);

  const activeDateMap = useMemo(() => {
    const map = new Map<string, number>();
    submissions
      .filter((s) => s.childId === activeChild.id)
      .forEach((s) => {
        map.set(s.dateKey, (map.get(s.dateKey) || 0) + 1);
      });
    return map;
  }, [submissions, activeChild.id]);

  const selectedDaySubmissions = useMemo(
    () =>
      submissions.filter(
        (s) => s.childId === activeChild.id && s.dateKey === selectedDateKey
      ),
    [submissions, activeChild.id, selectedDateKey]
  );

  const shiftMonth = (delta: number) => {
    setViewMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Monthly Calendar Card matching Screenshot 2 */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="เดือนก่อนหน้า"
                className="w-10 h-10 rounded-full hover:bg-violet-50 text-slate-600 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {THAI_MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear() + 543}
              </h2>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="เดือนถัดไป"
                className="w-10 h-10 rounded-full hover:bg-violet-50 text-slate-600 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 bg-slate-50/90 rounded-2xl py-2 mb-3 text-center">
              {WEEKDAYS.map((w) => (
                <span
                  key={w}
                  className="text-xs font-bold text-slate-500"
                >
                  {w}
                </span>
              ))}
            </div>

            {/* Date Grid */}
            <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center">
              {calendarCells.map((cell) => {
                const isSelected = cell.dateKey === selectedDateKey;
                const isToday = cell.dateKey === todayKey;
                const hasActivity = activeDateMap.has(cell.dateKey);

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(cell.dateKey)}
                    className={`relative h-10 w-10 mx-auto rounded-full text-sm font-semibold flex items-center justify-center transition-all tabular-nums ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                        : isToday
                        ? 'bg-sky-400 text-white shadow-sm'
                        : cell.inCurrentMonth
                        ? 'text-slate-700 hover:bg-violet-50'
                        : 'text-slate-300'
                    }`}
                  >
                    {cell.day}
                    {hasActivity && !isSelected && (
                      <span
                        className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-violet-500"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-700">
                บันทึกภารกิจวันที่ {selectedDateKey}
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {selectedDaySubmissions.length} รายการ
              </span>
            </div>

            {selectedDaySubmissions.length === 0 ? (
              <div className="glass-card rounded-2xl p-5 text-center text-sm text-slate-500">
                ยังไม่มีประวัติส่งงานบ้านในวันนี้ ลองเลือกวันที่มีจุดสีม่วง หรือทำภารกิจใหม่ได้เลย
              </div>
            ) : (
              selectedDaySubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ChoreIconBadge iconKey="toys" size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {sub.choreTitle}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="tabular-nums">
                          {new Date(sub.submittedAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {sub.status === 'approved'
                            ? `อนุมัติแล้ว (+${sub.totalCoinsAwarded} เหรียญ)`
                            : sub.status === 'pending'
                            ? 'รอผู้ปกครองตรวจ'
                            : 'รอปรับปรุง'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {sub.status === 'approved' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Family Rewards & Avatar Progression Shop */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  แลกรางวัลความภูมิใจของครอบครัว
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ใช้เหรียญจากการช่วยดูแลบ้านแลกช่วงเวลาแสนพิเศษร่วมกัน
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 text-amber-700 font-bold text-sm tabular-nums shrink-0">
                <Coins className="w-4 h-4" />
                <span>{activeChild.coins}</span>
              </div>
            </div>

            <div className="space-y-3">
              {rewards.map((reward) => {
                const canAfford = activeChild.coins >= reward.cost;
                return (
                  <div
                    key={reward.id}
                    className="rounded-2xl bg-white/90 border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-violet-600 mb-0.5">
                        {reward.category}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {reward.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {reward.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRedeemReward(reward)}
                      disabled={!canAfford}
                      className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                        canAfford
                          ? 'bg-gradient-to-r from-sky-400 to-violet-500 text-white shadow-md shadow-violet-500/20 hover:opacity-95 active:scale-[0.98]'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{reward.cost} เหรียญ</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Avatar Customization CTA */}
            <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  ตกแต่งอวตารและปลดล็อกไอเทมใหม่
                </p>
                <p className="text-xs text-slate-500">
                  เลเวล {activeChild.level} · สะสมไอเทมเพิ่มความภูมิใจได้ทันที
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAvatarWorkshop}
                className="px-4 py-2.5 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-800 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>แต่งตัวอวตาร</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
