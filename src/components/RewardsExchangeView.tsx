import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Coins,
  Gift,
  History,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import {
  ChildProfile,
  FamilyReward,
  RewardCategory,
  RewardRedemption,
} from '../types';
import { REWARD_CATEGORIES } from '../data/initialData';
import { AvatarCanvas } from './AvatarCanvas';

interface RewardsExchangeViewProps {
  activeChild: ChildProfile;
  rewards: FamilyReward[];
  redemptions: RewardRedemption[];
  onRedeemReward: (reward: FamilyReward) => void;
  onGoToParentRedeem: () => void;
}

export const RewardsExchangeView: React.FC<RewardsExchangeViewProps> = ({
  activeChild,
  rewards,
  redemptions,
  onRedeemReward,
  onGoToParentRedeem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    RewardCategory | 'all'
  >('all');

  const filteredRewards = useMemo(() => {
    const list =
      selectedCategory === 'all'
        ? rewards
        : rewards.filter((r) => r.category === selectedCategory);
    return [...list].sort((a, b) => a.cost - b.cost);
  }, [rewards, selectedCategory]);

  const childRedemptions = useMemo(
    () => redemptions.filter((r) => r.childId === activeChild.id),
    [redemptions, activeChild.id]
  );

  const affordableCount = useMemo(
    () => rewards.filter((r) => activeChild.coins >= r.cost).length,
    [rewards, activeChild.coins]
  );

  const categoryStyleMap = useMemo(() => {
    const map = new Map<RewardCategory, string>();
    REWARD_CATEGORIES.forEach((c) => map.set(c.id, c.badgeClass));
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Wallet Summary */}
      <div className="rounded-[32px] overflow-hidden shadow-[0_18px_45px_-12px_rgba(95,105,195,0.24)] bg-white">
        <div className="hero-pastel-gradient px-6 py-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <AvatarCanvas
              avatar={activeChild.avatar}
              level={activeChild.level}
              size="lg"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/25 text-xs font-bold mb-1.5">
                <Wallet className="w-3.5 h-3.5" />
                <span>กระเป๋าเหรียญของ {activeChild.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums">
                มีอยู่ {activeChild.coins.toLocaleString('th-TH')} เหรียญ
              </h1>
              <p className="text-xs sm:text-sm text-white/90 mt-1">
                พร้อมแลกรางวัลได้แล้ว {affordableCount} จาก {rewards.length} รายการ
                (เมื่อแลกแล้วระบบจะหักเหรียญออกตามจำนวนจริงทันที)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToParentRedeem}
            className="h-11 px-4 rounded-2xl bg-white/95 hover:bg-white text-violet-700 text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all self-start md:self-center shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ให้ผู้ปกครองช่วยกดแลก & ตั้งค่ารางวัล</span>
          </button>
        </div>

        {/* Category Filter Strip */}
        <div className="px-5 py-4 bg-white/90 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-sky-400 to-violet-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({rewards.length})
          </button>
          {REWARD_CATEGORIES.map((cat) => {
            const count = rewards.filter((r) => r.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-sky-400 to-violet-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Reward Catalog Grid */}
      {filteredRewards.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center text-sm text-slate-500">
          ยังไม่มีรายการรางวัลในหมวดหมู่นี้ ผู้ปกครองสามารถเพิ่มรางวัลได้ในโหมดผู้ปกครอง
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRewards.map((reward) => {
            const canAfford = activeChild.coins >= reward.cost;
            const remainingNeeded = Math.max(0, reward.cost - activeChild.coins);
            const progressPct = Math.min(
              100,
              Math.round((activeChild.coins / Math.max(1, reward.cost)) * 100)
            );
            const badgeClass =
              categoryStyleMap.get(reward.category) ||
              'bg-violet-50 text-violet-700 border-violet-100';

            return (
              <div
                key={reward.id}
                className={`glass-card rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all ${
                  canAfford ? 'hover:shadow-lg ring-1 ring-violet-100' : 'opacity-90'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${badgeClass}`}
                    >
                      {reward.category}
                    </span>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs font-extrabold tabular-nums">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>{reward.cost} เหรียญ</span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 leading-snug">
                      {reward.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {reward.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1 tabular-nums">
                      <span
                        className={
                          canAfford ? 'text-emerald-600' : 'text-slate-500'
                        }
                      >
                        {canAfford
                          ? 'เหรียญครบแล้ว พร้อมแลก!'
                          : `สะสมอีก ${remainingNeeded} เหรียญ`}
                      </span>
                      <span className="text-slate-500">{progressPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          canAfford
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                            : 'bg-gradient-to-r from-sky-400 to-violet-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => onRedeemReward(reward)}
                    className={`w-full h-11 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      canAfford
                        ? 'bg-gradient-to-r from-sky-400 to-violet-500 text-white shadow-md shadow-violet-500/20 hover:opacity-95 active:scale-[0.98]'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    <span>
                      {canAfford
                        ? `แลกรางวัลนี้ (-${reward.cost} เหรียญ)`
                        : `ขาดอีก ${remainingNeeded} เหรียญ`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Child's Redemption History */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ประวัติการแลกเหรียญของ {activeChild.name}
              </h2>
              <p className="text-xs text-slate-500">
                แสดงยอดเหรียญก่อนแลก จำนวนที่หัก และเหรียญคงเหลือจริงทุกครั้ง
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-xl tabular-nums">
            {childRedemptions.length} ครั้ง
          </span>
        </div>

        {childRedemptions.length === 0 ? (
          <div className="rounded-2xl bg-slate-50/80 p-5 text-center text-xs sm:text-sm text-slate-500 flex flex-col items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span>
              ยังไม่มีประวัติการแลกเหรียญ ลองสะสมเหรียญจากภารกิจแล้วมาแลกรางวัลที่ชอบได้เลย!
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {childRedemptions.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-white border border-slate-100 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">
                        {item.rewardTitle}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                        {item.rewardCategory}
                      </span>
                      {item.redeemedByParent && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700">
                          ผู้ปกครองทำรายการ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {new Date(item.redeemedAt).toLocaleString('th-TH', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      {item.note && <span>· {item.note}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 tabular-nums">
                  <div className="text-sm font-extrabold text-rose-600">
                    -{item.cost} เหรียญ
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {item.coinsBefore} → คงเหลือ {item.coinsAfter} เหรียญ
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
