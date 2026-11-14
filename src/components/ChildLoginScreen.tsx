import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { ChildProfile } from '../types';
import { AGE_GROUP_INFO } from '../data/initialData';
import { AvatarCanvas } from './AvatarCanvas';
import { PinKeypad } from './PinKeypad';

interface ChildLoginScreenProps {
  childrenList: ChildProfile[];
  parentPin: string;
  onChildLogin: (child: ChildProfile) => void;
  onParentLogin: () => void;
}

export const ChildLoginScreen: React.FC<ChildLoginScreenProps> = ({
  childrenList,
  parentPin,
  onChildLogin,
  onParentLogin,
}) => {
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [parentModePrompt, setParentModePrompt] = useState(false);

  return (
    <div className="min-h-screen page-pastel-backdrop flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-3xl glass-card rounded-[36px] overflow-hidden shadow-[0_24px_60px_-15px_rgba(95,105,195,0.28)]">
        {/* Pastel Header */}
        <div className="hero-pastel-gradient px-6 py-7 text-white text-center relative">
          <div className="flex flex-col items-center mb-3">
            <img
              src="/assets/aistudio/__________________________3f410f16.png"
              alt="KidQuest Family Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-lg shadow-indigo-900/20 ring-2 ring-white/50 object-cover mb-3"
            />
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/25 backdrop-blur-md text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>KidQuest Family</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
            {parentModePrompt
              ? 'เข้าสู่ระบบโหมดผู้ปกครอง'
              : selectedChild
              ? `สวัสดี ${selectedChild.name}! ใส่รหัสลับ 4 หลัก`
              : 'เลือกตัวการ์ตูนของคุณเพื่อเข้าสู่ระบบ'}
          </h1>
          <p className="text-xs sm:text-sm text-white/90 mt-1.5">
            {parentModePrompt
              ? 'กรุณาป้อนรหัส PIN 4 หลักของผู้ปกครอง'
              : selectedChild
              ? 'แตะตัวเลขรหัสประจำตัว 4 หลักบนแป้นพิมพ์ด้านล่าง'
              : 'แตะที่ตัวการ์ตูนของหนู แล้วป้อนรหัส PIN 4 หลักเพื่อเริ่มทำภารกิจ'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 bg-white/85">
          {parentModePrompt ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setParentModePrompt(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-violet-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>กลับไปหน้าเลือกการ์ตูนของลูก</span>
              </button>

              <PinKeypad
                title="รหัสผู้ปกครอง 4 หลัก"
                subtitle="สำหรับตรวจให้ดาว ตั้งค่าเวลาหน้าจอ และซิงค์ข้อมูล"
                expectedPin={parentPin}
                onSuccess={onParentLogin}
              />
            </div>
          ) : selectedChild ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedChild(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-violet-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>เปลี่ยนตัวการ์ตูน</span>
                </button>
              </div>

              <div className="flex flex-col items-center">
                <AvatarCanvas
                  avatar={selectedChild.avatar}
                  level={selectedChild.level}
                  size="lg"
                />
                <div className="text-center mt-2.5">
                  <div className="text-base font-extrabold text-slate-900">
                    {selectedChild.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {AGE_GROUP_INFO[selectedChild.ageGroup].shortLabel} · Lv.
                    {selectedChild.level}
                  </div>
                </div>
              </div>

              <PinKeypad
                title="ป้อนรหัส PIN 4 หลัก"
                expectedPin={selectedChild.pin}
                onSuccess={() => onChildLogin(selectedChild)}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cartoon Avatar Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {childrenList.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedChild(child)}
                    className="group rounded-3xl bg-white hover:bg-gradient-to-b hover:from-sky-50 hover:to-violet-50 border border-slate-100 hover:border-violet-300 p-5 flex flex-col items-center text-center shadow-[0_8px_24px_rgba(110,120,190,0.08)] hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    <div className="transition-transform group-hover:scale-105">
                      <AvatarCanvas
                        avatar={child.avatar}
                        level={child.level}
                        size="lg"
                      />
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900 mt-3">
                      {child.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      อายุ {child.age} ปี ·{' '}
                      {AGE_GROUP_INFO[child.ageGroup].shortLabel}
                    </p>
                    <div className="mt-3 px-3.5 py-1.5 rounded-full bg-violet-100/80 text-violet-800 text-xs font-bold tabular-nums">
                      Lv.{child.level} · {child.coins} เหรียญ
                    </div>
                  </button>
                ))}
              </div>

              {/* Parent Mode Entry Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setParentModePrompt(true)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-800 text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>โหมดผู้ปกครอง (PIN 4 หลัก)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
