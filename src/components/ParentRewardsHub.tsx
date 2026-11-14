import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Coins,
  Gift,
  History,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ChildProfile,
  FamilyReward,
  RewardRedemption,
} from '../types';
import { REWARD_CATEGORIES } from '../data/initialData';
import { AvatarCanvas } from './AvatarCanvas';

interface ParentRewardsHubProps {
  childrenList: ChildProfile[];
  rewards: FamilyReward[];
  redemptions: RewardRedemption[];
  defaultChildId: string;
  onAddReward: () => void;
  onEditReward: (reward: FamilyReward) => void;
  onDeleteReward: (reward: FamilyReward) => void;
  onParentRedeem: (
    childId: string,
    reward: FamilyReward,
    note?: string
  ) => void;
}

export const ParentRewardsHub: React.FC<ParentRewardsHubProps> = ({
  childrenList,
  rewards,
  redemptions,
  defaultChildId,
  onAddReward,
  onEditReward,
  onDeleteReward,
  onParentRedeem,
}) => {
  const [selectedChildId, setSelectedChildId] = useState(defaultChildId);
  const [selectedRewardId, setSelectedRewardId] = useState(
    rewards[0]?.id || ''
  );
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!childrenList.some((c) => c.id === selectedChildId) && childrenList[0]) {
      setSelectedChildId(childrenList[0].id);
    }
  }, [childrenList, selectedChildId]);

  useEffect(() => {
    if (!rewards.some((r) => r.id === selectedRewardId) && rewards[0]) {
      setSelectedRewardId(rewards[0].id);
    }
  }, [rewards, selectedRewardId]);

  const targetChild =
    childrenList.find((c) => c.id === selectedChildId) || childrenList[0];
  const targetReward =
    rewards.find((r) => r.id === selectedRewardId) || rewards[0];

  const canRedeem =
    Boolean(targetChild && targetReward) &&
    targetChild.coins >= targetReward.cost;
  const balanceAfter =
    targetChild && targetReward ? targetChild.coins - targetReward.cost : 0;

  const categoryBadgeMap = new Map(
    REWARD_CATEGORIES.map((c) => [c.id, c.badgeClass])
  );

  const handleConfirmRedeem = () => {
    if (!targetChild || !targetReward || !canRedeem) return;
    onParentRedeem(targetChild.id, targetReward, note.trim() || undefined);
    setNote('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Parent Coin Redemption Counter */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              เมนูแลกเหรียญให้ลูก (ผู้ปกครองดำเนินการ)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เลือกลูกและรางวัลที่ต้องการแลก ระบบจะคำนวณและลบเหรียญออกตามจำนวนจริงทันที
            </p>
          </div>
        </div>

        {childrenList.length === 0 || rewards.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5 text-center text-xs text-slate-500">
            กรุณาเพิ่มรายการรางวัลด้านล่างก่อนทำรายการแลกเหรียญให้ลูก
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Step 1 & 2 Selection */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  1. เลือกลูกที่ต้องการนำเหรียญมาแลกรางวัล
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {childrenList.map((c) => {
                    const active = c.id === targetChild?.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedChildId(c.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                          active
                            ? 'border-violet-500 bg-violet-50/90 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-violet-200'
                        }`}
                      >
                        <AvatarCanvas
                          avatar={c.avatar}
                          level={c.level}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {c.name}
                          </div>
                          <div className="text-[11px] font-bold text-amber-700 tabular-nums">
                            {c.coins} เหรียญ
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  2. เลือกรางวัลที่จะแลก (เรียงตามเกณฑ์ที่ผู้ปกครองกำหนด)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {rewards.map((r) => {
                    const selected = r.id === targetReward?.id;
                    const affordable = targetChild
                      ? targetChild.coins >= r.cost
                      : false;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRewardId(r.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selected
                            ? 'border-violet-500 bg-violet-50/90 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-violet-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                              categoryBadgeMap.get(r.category) ||
                              'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {r.category}
                          </span>
                          <span
                            className={`text-xs font-extrabold tabular-nums ${
                              affordable ? 'text-amber-700' : 'text-rose-500'
                            }`}
                          >
                            {r.cost} เหรียญ
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 line-clamp-1">
                          {r.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  บันทึกช่วยจำของผู้ปกครอง (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น มอบค่าขนมสดให้แล้ว, สั่งของขวัญให้วันเสาร์"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>

            {/* Step 3 Summary & Deduct Box */}
            {targetChild && targetReward && (
              <div className="lg:col-span-5 rounded-3xl bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 border border-indigo-100 p-5 space-y-4">
                <div className="text-xs font-bold text-violet-700">
                  สรุปรายการหักเหรียญจริง
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">ผู้แลก:</span>
                    <span className="font-bold text-slate-900">
                      {targetChild.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 shrink-0">รางวัล:</span>
                    <span className="font-bold text-slate-900 text-right">
                      {targetReward.title}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-indigo-100 flex items-center justify-between tabular-nums">
                    <span className="text-slate-600">เหรียญปัจจุบัน:</span>
                    <span className="font-bold text-slate-900">
                      {targetChild.coins} เหรียญ
                    </span>
                  </div>
                  <div className="flex items-center justify-between tabular-nums">
                    <span className="text-slate-600">ลบเหรียญที่แลก:</span>
                    <span className="font-extrabold text-rose-600">
                      -{targetReward.cost} เหรียญ
                    </span>
                  </div>
                  <div className="pt-2 border-t border-indigo-100 flex items-center justify-between tabular-nums">
                    <span className="font-bold text-slate-800">
                      คงเหลือหลังแลก:
                    </span>
                    <span
                      className={`text-lg font-extrabold ${
                        canRedeem ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {canRedeem
                        ? `${balanceAfter} เหรียญ`
                        : `ขาด ${Math.abs(balanceAfter)} เหรียญ`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canRedeem}
                  onClick={handleConfirmRedeem}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-500/20 disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  <Coins className="w-4 h-4" />
                  <span>
                    {canRedeem
                      ? `ยืนยันแลกให้ ${targetChild.name} (-${targetReward.cost} เหรียญ)`
                      : 'เหรียญของลูกยังไม่เพียงพอ'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Parent CRUD for Reward Rules */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              กำหนดเกณฑ์แต้มแลกของรางวัล ({rewards.length} รายการ)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ตั้งค่าได้ว่ากี่เหรียญแลกเงินค่าขนม ของขวัญ หรือสิ่งที่ลูกอยากได้ (เพิ่ม/แก้ไข/ลบได้ตลอด)
            </p>
          </div>
          <button
            type="button"
            onClick={onAddReward}
            className="h-10 px-4 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรางวัลใหม่</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold border mb-1.5 ${
                      categoryBadgeMap.get(reward.category) ||
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {reward.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {reward.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {reward.description}
                  </p>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-extrabold tabular-nums shrink-0">
                  {reward.cost} เหรียญ
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onEditReward(reward)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>แก้ไข</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteReward(reward)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบ</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Family Redemption Ledger */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-violet-600" />
            <h3 className="text-base font-bold text-slate-900">
              บันทึกการแลกเหรียญทั้งหมดในครอบครัว ({redemptions.length} รายการ)
            </h3>
          </div>
        </div>

        {redemptions.length === 0 ? (
          <div className="rounded-2xl bg-slate-50/80 p-5 text-center text-xs text-slate-500">
            ยังไม่มีรายการแลกเหรียญในระบบ
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {redemptions.slice(0, 15).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-white border border-slate-100 px-4 py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {item.childName} แลก "{item.rewardTitle}"
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {item.rewardCategory} ·{' '}
                      {new Date(item.redeemedAt).toLocaleString('th-TH', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                      {item.note ? ` · ${item.note}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <span className="font-extrabold text-rose-600">
                    -{item.cost} เหรียญ
                  </span>
                  <div className="text-[11px] text-slate-400">
                    ({item.coinsBefore} → {item.coinsAfter})
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
