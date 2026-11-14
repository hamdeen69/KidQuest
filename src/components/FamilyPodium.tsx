import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { ChildProfile } from '../types';
import { AvatarCanvas } from './AvatarCanvas';

interface FamilyPodiumProps {
  childrenList: ChildProfile[];
  activeChildId: string;
  subtitle: string;
  onSelectChild: (child: ChildProfile) => void;
}

const SportMedalSvg: React.FC<{ rank: 1 | 2 | 3 }> = ({ rank }) => {
  const palette =
    rank === 1
      ? {
          ribbonLeft: '#EF4444',
          ribbonRight: '#DC2626',
          rim: '#F59E0B',
          face: '#FDE047',
          text: '#92400E',
        }
      : rank === 2
      ? {
          ribbonLeft: '#3B82F6',
          ribbonRight: '#2563EB',
          rim: '#94A3B8',
          face: '#E2E8F0',
          text: '#334155',
        }
      : {
          ribbonLeft: '#8B5CF6',
          ribbonRight: '#7C3AED',
          rim: '#B45309',
          face: '#FDBA74',
          text: '#7C2D12',
        };

  return (
    <svg viewBox="0 0 48 56" className="w-9 h-10 drop-shadow-sm shrink-0" aria-label={`เหรียญรางวัลอันดับ ${rank}`}>
      {/* Ribbon */}
      <polygon points="12,2 22,2 24,20 17,22" fill={palette.ribbonLeft} />
      <polygon points="36,2 26,2 24,20 31,22" fill={palette.ribbonRight} />
      {/* Medal Outer Rim */}
      <circle cx="24" cy="34" r="16" fill={palette.rim} />
      {/* Medal Face */}
      <circle cx="24" cy="34" r="12.5" fill={palette.face} stroke="#FFFFFF" strokeWidth="1.5" />
      {/* Rank Number */}
      <text
        x="24"
        y="39"
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
        fill={palette.text}
      >
        {rank}
      </text>
    </svg>
  );
};

export const FamilyPodium: React.FC<FamilyPodiumProps> = ({
  childrenList,
  activeChildId,
  subtitle,
  onSelectChild,
}) => {
  const ranked = useMemo(() => {
    return [...childrenList].sort((a, b) => {
      if (b.coins !== a.coins) return b.coins - a.coins;
      return b.xp - a.xp;
    });
  }, [childrenList]);

  const first = ranked[0];
  const second = ranked[1];
  const third = ranked[2];
  const others = ranked.slice(3);

  // Olympic Podium display order: [2nd (left), 1st (center), 3rd (right)]
  const podiumSlots: {
    child?: ChildProfile;
    rank: 1 | 2 | 3;
    rankLabel: string;
    pedestalHeight: string;
    pedestalGradient: string;
    ringColor: string;
  }[] = [
    {
      child: second,
      rank: 2,
      rankLabel: 'เหรียญเงิน',
      pedestalHeight: 'h-20 sm:h-24',
      pedestalGradient: 'from-slate-200 via-sky-100 to-slate-100 text-slate-800',
      ringColor: 'ring-slate-300',
    },
    {
      child: first,
      rank: 1,
      rankLabel: 'เหรียญทอง',
      pedestalHeight: 'h-28 sm:h-32',
      pedestalGradient: 'from-amber-300 via-yellow-200 to-amber-100 text-amber-950',
      ringColor: 'ring-amber-300',
    },
    {
      child: third,
      rank: 3,
      rankLabel: 'เหรียญทองแดง',
      pedestalHeight: 'h-14 sm:h-16',
      pedestalGradient: 'from-orange-200 via-amber-100 to-rose-100 text-orange-950',
      ringColor: 'ring-orange-300',
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(110,120,190,0.08)] space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              แท่นรับเหรียญแต้มสูงสุด (อันดับ 1–3)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>

      {/* Stepped Olympic Sports Podium */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-2">
        {podiumSlots.map((slot) => {
          if (!slot.child) {
            return (
              <div
                key={slot.rank}
                className="flex flex-col items-center justify-end opacity-40"
              >
                <div
                  className={`w-full ${slot.pedestalHeight} rounded-t-2xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400`}
                >
                  อันดับ {slot.rank}
                </div>
              </div>
            );
          }

          const isSelected = slot.child.id === activeChildId;

          return (
            <button
              key={slot.child.id}
              type="button"
              onClick={() => onSelectChild(slot.child!)}
              className="flex flex-col items-center group focus:outline-none"
            >
              {/* Medal + Avatar */}
              <div className="relative flex flex-col items-center mb-2">
                <div className="-mb-3 z-10 transition-transform group-hover:-translate-y-1">
                  <SportMedalSvg rank={slot.rank} />
                </div>
                <div
                  className={`rounded-full p-0.5 ring-2 ${
                    isSelected ? 'ring-violet-500' : slot.ringColor
                  }`}
                >
                  <AvatarCanvas
                    avatar={slot.child.avatar}
                    level={slot.child.level}
                    size={slot.rank === 1 ? 'md' : 'sm'}
                  />
                </div>
              </div>

              {/* Child Name & Score */}
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-full px-1">
                {slot.child.name}
              </p>
              <p className="text-[11px] font-semibold text-violet-700 tabular-nums mb-2">
                {slot.child.coins} แต้ม
              </p>

              {/* Stepped Pedestal Block */}
              <div
                className={`w-full ${slot.pedestalHeight} rounded-t-2xl bg-gradient-to-b ${slot.pedestalGradient} shadow-inner flex flex-col items-center justify-center px-1.5 py-2 transition-transform group-hover:brightness-95`}
              >
                <span className="text-lg sm:text-2xl font-extrabold leading-none tabular-nums">
                  {slot.rank}
                </span>
                <span className="text-[10px] sm:text-xs font-bold mt-1 whitespace-nowrap">
                  {slot.rankLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Ranks 4+ if more than 3 children exist */}
      {others.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          {others.map((child, idx) => (
            <button
              key={child.id}
              type="button"
              onClick={() => onSelectChild(child)}
              className="w-full rounded-2xl bg-slate-50 hover:bg-violet-50/70 px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-xs font-bold text-slate-500 tabular-nums">
                  #{idx + 4}
                </span>
                <AvatarCanvas
                  avatar={child.avatar}
                  level={child.level}
                  size="sm"
                />
                <div className="text-left min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {child.name}
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    Lv.{child.level}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-violet-700 tabular-nums shrink-0">
                {child.coins} แต้ม
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
