import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Database,
  ExternalLink,
  FolderOpen,
  Gift,
  Lock,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Star,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import {
  APPS_SCRIPT_CODE_GS,
  GoogleServerStatus,
} from '../services/googleSheets';
import {
  AgeGroup,
  AppSettings,
  AvatarAccessory,
  AvatarCharacter,
  ChildProfile,
  ChoreCategory,
  ChoreItem,
  ChoreSubmission,
  FamilyReward,
  RewardCategory,
} from '../types';
import {
  AGE_GROUP_INFO,
  AVATAR_ACCESSORIES,
  AVATAR_AURAS,
  AVATAR_CHARACTERS,
  OUTFIT_COLORS,
  QUALITY_TIERS,
  REWARD_CATEGORIES,
} from '../data/initialData';
import { compressImageFile } from '../utils/imageCompress';
import { getAgeLanguage } from '../utils/ageLanguage';
import { AvatarCanvas } from './AvatarCanvas';
import { LoadingSpinner } from './ChoreIllustration';

/* Base Responsive Sheet / Centered Modal Wrapper */
const ModalWrapper: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-lg',
  children,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/45 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidthClass} bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200`}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden pt-3 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-200" />
        </div>

        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">{children}</div>
      </div>
    </div>
  );
};

/* 1. Child Submit Chore with Photo Proof Modal */
export const SubmitChoreModal: React.FC<{
  chore: ChoreItem | null;
  child: ChildProfile;
  driveFolderId: string;
  defaultSaveToDrive: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    chore: ChoreItem;
    photoDataUrl?: string;
    note: string;
    onTime: boolean;
    saveToDrive: boolean;
  }) => Promise<void>;
}> = ({
  chore,
  child,
  driveFolderId,
  defaultSaveToDrive,
  onClose,
  onSubmit,
}) => {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [saveToDrive, setSaveToDrive] = useState(defaultSaveToDrive);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPhotoDataUrl(undefined);
    setNote('');
    setSaveToDrive(defaultSaveToDrive);
    setIsCompressing(false);
    setIsSubmitting(false);
  }, [chore, defaultSaveToDrive]);

  if (!chore) return null;

  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
  const isBeforeDeadline =
    !chore.deadlineTime || currentHHMM <= chore.deadlineTime;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file);
      setPhotoDataUrl(compressed);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        chore,
        photoDataUrl,
        note: note.trim(),
        onTime: isBeforeDeadline,
        saveToDrive: Boolean(photoDataUrl && saveToDrive),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const lang = getAgeLanguage(child.ageGroup);

  return (
    <ModalWrapper
      open={Boolean(chore)}
      onClose={onClose}
      title={lang.submitModalTitle}
      subtitle={`${child.name} · ${chore.title}`}
    >
      <form onSubmit={handleConfirmSubmit} className="space-y-4">
        {/* Coin Preview Box */}
        <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-600">
              รางวัลความตั้งใจที่รออยู่
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {chore.baseCoins} เหรียญพื้นฐาน
              </span>
              {chore.timeBonusCoins > 0 && isBeforeDeadline && (
                <span className="text-xs font-bold text-violet-700 tabular-nums">
                  + {chore.timeBonusCoins} โบนัสตรงเวลา
                </span>
              )}
            </div>
          </div>
          {chore.deadlineTime && (
            <div className="text-right text-xs font-semibold text-slate-600 shrink-0">
              <div className="flex items-center justify-end gap-1">
                <Clock className="w-3.5 h-3.5 text-violet-600" />
                <span className="tabular-nums">ก่อน {chore.deadlineTime} น.</span>
              </div>
              <span className="text-[11px] text-emerald-600">
                {isBeforeDeadline ? 'ทันเวลา!' : 'ส่งได้ตามปกติ'}
              </span>
            </div>
          )}
        </div>

        {/* Photo Upload / Camera Proof */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">
            {lang.submitPhotoPrompt}
          </label>
          {isCompressing ? (
            <LoadingSpinner label="กำลังย่อขนาดภาพให้เหมาะสม..." />
          ) : photoDataUrl ? (
            <div className="space-y-2.5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={photoDataUrl}
                  alt="หลักฐานการทำงานบ้าน"
                  className="w-full max-h-56 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl(undefined)}
                  className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-white/90 text-xs font-bold text-slate-700 shadow-sm hover:bg-white"
                >
                  เปลี่ยนรูป
                </button>
              </div>

              {/* Zero-Login Google Drive Auto Save Option */}
              <label className="flex items-start gap-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToDrive}
                  onChange={(e) => setSaveToDrive(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-emerald-600"
                />
                <div className="text-xs text-emerald-900 min-w-0">
                  <div className="font-bold flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>บันทึกรูปภาพนี้ลง Google Drive อัตโนมัติ (ไม่ต้องล็อกอิน Gmail)</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-mono-num truncate mt-0.5">
                    Folder ID: {driveFolderId}
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 hover:bg-violet-50/80 p-6 cursor-pointer transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm text-violet-600 flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                แตะเพื่อถ่ายรูป หรือเลือกรูปภาพ
              </span>
              <span className="text-xs text-slate-500">
                รองรับทั้งกล้องมือถือ แท็บเล็ต และไฟล์ภาพจากเครื่อง
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Child Note */}
        <div>
          <label
            htmlFor="child-chore-note"
            className="block text-sm font-bold text-slate-800 mb-1.5"
          >
            เล่าความภูมิใจสั้นๆ (ไม่บังคับ)
          </label>
          <textarea
            id="child-chore-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={lang.submitNotePlaceholder}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-60"
        >
          {isSubmitting ? (
            <span>กำลังบันทึกและอัปโหลด...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{lang.submitCta}</span>
            </>
          )}
        </button>
      </form>
    </ModalWrapper>
  );
};

/* 2. Parent Approval with Quality Ranking Bonus (1-3 Stars) Modal */
export const ParentApprovalModal: React.FC<{
  submission: ChoreSubmission | null;
  onClose: () => void;
  onApprove: (
    submission: ChoreSubmission,
    stars: 1 | 2 | 3,
    parentNote: string
  ) => void;
  onRequestRetry: (submission: ChoreSubmission, parentNote: string) => void;
  onUploadToDrive?: (submission: ChoreSubmission) => Promise<void>;
}> = ({ submission, onClose, onApprove, onRequestRetry, onUploadToDrive }) => {
  const [stars, setStars] = useState<1 | 2 | 3>(3);
  const [parentNote, setParentNote] = useState('');
  const [uploadingDrive, setUploadingDrive] = useState(false);

  useEffect(() => {
    if (submission) {
      setStars(3);
      setParentNote(QUALITY_TIERS[3].encouragement);
      setUploadingDrive(false);
    }
  }, [submission]);

  if (!submission) return null;

  const tier = QUALITY_TIERS[stars];
  const calculatedBase = Math.round(submission.baseCoins * tier.multiplier);
  const timeBonus = submission.onTime ? submission.timeBonusCoins : 0;
  const totalAward = calculatedBase + timeBonus;

  const handleUploadDriveClick = async () => {
    if (!onUploadToDrive) return;
    setUploadingDrive(true);
    try {
      await onUploadToDrive(submission);
    } finally {
      setUploadingDrive(false);
    }
  };

  return (
    <ModalWrapper
      open={Boolean(submission)}
      onClose={onClose}
      title="ตรวจผลงานและให้ดาวคุณภาพ"
      subtitle={`${submission.childName} · ${submission.choreTitle}`}
    >
      <div className="space-y-4">
        {submission.photoDataUrl ? (
          <div className="space-y-2">
            <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
              <img
                src={submission.photoDataUrl}
                alt="หลักฐานงานบ้านของเด็ก"
                className="w-full max-h-60 object-cover"
              />
            </div>

            {submission.driveWebViewLink ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกรูปภาพลง Google Drive แล้ว</span>
                </span>
                <a
                  href={submission.driveWebViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>เปิดดูใน Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              onUploadToDrive && (
                <button
                  type="button"
                  disabled={uploadingDrive}
                  onClick={handleUploadDriveClick}
                  className="w-full py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {uploadingDrive
                      ? 'กำลังบันทึกรูปลง Google Drive...'
                      : 'บันทึกรูปนี้ลง Google Drive'}
                  </span>
                </button>
              )
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-4 text-center text-xs text-slate-500">
            ส่งงานแบบบันทึกเวลา (ไม่ได้แนบภาพถ่าย)
          </div>
        )}

        {submission.childNote && (
          <div className="rounded-2xl bg-sky-50/70 px-4 py-3 text-sm text-slate-700">
            <span className="font-bold text-sky-900">ข้อความจากน้อง: </span>
            "{submission.childNote}"
          </div>
        )}

        {/* Quality Star Ranking Selector */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">
            ให้คะแนนความประณีต (Quality Ranking Bonus)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 3] as const).map((level) => {
              const info = QUALITY_TIERS[level];
              const active = stars === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    setStars(level);
                    setParentNote(info.encouragement);
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    active
                      ? 'border-violet-500 bg-violet-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-violet-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-0.5 mb-1">
                    {Array.from({ length: level }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    ×{info.multiplier}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {info.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reward Breakdown */}
        <div className="rounded-2xl bg-slate-50 p-4 flex items-center justify-between">
          <div className="text-xs text-slate-600 space-y-1">
            <div>
              เหรียญพื้นฐาน ({submission.baseCoins} × {tier.multiplier}) ={' '}
              <span className="font-bold text-slate-900 tabular-nums">
                {calculatedBase}
              </span>
            </div>
            {timeBonus > 0 && (
              <div>
                โบนัสตรงเวลา ={' '}
                <span className="font-bold text-violet-700 tabular-nums">
                  +{timeBonus}
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">รวมที่จะได้รับ</div>
            <div className="text-2xl font-extrabold text-violet-700 tabular-nums">
              +{totalAward} 🪙
            </div>
          </div>
        </div>

        {/* Encouraging Feedback */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">
            คำชื่นชมและกำลังใจเชิงบวก (Growth Mindset)
          </label>
          <textarea
            rows={2}
            value={parentNote}
            onChange={(e) => setParentNote(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() =>
              onRequestRetry(
                submission,
                parentNote || 'ลองช่วยกันจัดเพิ่มอีกนิดนะคนเก่ง!'
              )
            }
            className="sm:col-span-1 h-12 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            ชวนปรับปรุงอีกนิด
          </button>
          <button
            type="button"
            onClick={() => onApprove(submission, stars, parentNote)}
            className="sm:col-span-2 h-12 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 hover:opacity-95"
          >
            <Check className="w-4 h-4" />
            <span>อนุมัติและมอบ {totalAward} เหรียญ</span>
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

/* 3. Avatar Workshop & Visual Progression Modal */
export const AvatarWorkshopModal: React.FC<{
  open: boolean;
  child: ChildProfile;
  onClose: () => void;
  onUpdateAvatar: (
    childId: string,
    nextCharacter: AvatarCharacter,
    nextAccessory: AvatarAccessory,
    nextOutfitColor: string,
    nextAura: ChildProfile['avatar']['auraStyle'],
    unlockCost: number
  ) => void;
}> = ({ open, child, onClose, onUpdateAvatar }) => {
  const [character, setCharacter] = useState<AvatarCharacter>(
    child.avatar.character
  );
  const [accessory, setAccessory] = useState<AvatarAccessory>(
    child.avatar.accessory
  );
  const [outfitColor, setOutfitColor] = useState(child.avatar.outfitColor);
  const [auraStyle, setAuraStyle] = useState(child.avatar.auraStyle);
  const [accFilter, setAccFilter] = useState<
    'ทั้งหมด' | 'ศีรษะ' | 'แว่นตา' | 'ชุดและปีก'
  >('ทั้งหมด');

  useEffect(() => {
    if (open) {
      setCharacter(child.avatar.character);
      setAccessory(child.avatar.accessory);
      setOutfitColor(child.avatar.outfitColor);
      setAuraStyle(child.avatar.auraStyle);
      setAccFilter('ทั้งหมด');
    }
  }, [open, child]);

  const selectedAccInfo = AVATAR_ACCESSORIES.find((a) => a.id === accessory);
  const isAlreadyUnlocked =
    child.avatar.unlockedAccessories.includes(accessory) || accessory === 'none';
  const unlockCost = isAlreadyUnlocked ? 0 : selectedAccInfo?.cost || 0;
  const canAfford = child.coins >= unlockCost;
  const meetsLevel = child.level >= (selectedAccInfo?.minLevel || 1);

  const visibleAccessories = AVATAR_ACCESSORIES.filter(
    (a) => accFilter === 'ทั้งหมด' || a.category === accFilter
  );

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="ห้องแต่งตัวอวตาร"
      subtitle={`${child.name} · เลเวล ${child.level} · มี ${child.coins} เหรียญ`}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5">
        {/* Live Preview */}
        <div className="rounded-3xl bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 p-5 flex items-center gap-5">
          <AvatarCanvas
            avatar={{
              ...child.avatar,
              character,
              accessory,
              outfitColor,
              auraStyle,
            }}
            level={child.level}
            size="lg"
          />
          <div>
            <p className="text-base font-bold text-slate-900">{child.name}</p>
            <p className="text-xs text-slate-600 mt-0.5">
              ปลดล็อกไอเทมและฉากหลังใหม่ๆ ด้วยเหรียญความตั้งใจของคุณ
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs font-bold text-violet-700 tabular-nums">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>คงเหลือ {child.coins} เหรียญ</span>
            </div>
          </div>
        </div>

        {/* Character Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2">
            เลือกตัวละครเพื่อนคู่ใจ ({AVATAR_CHARACTERS.length} แบบ)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AVATAR_CHARACTERS.map((char) => {
              const locked = child.level < char.minLevel;
              const active = character === char.id;
              return (
                <button
                  key={char.id}
                  type="button"
                  disabled={locked}
                  onClick={() => setCharacter(char.id)}
                  className={`px-3 py-2.5 rounded-2xl text-xs font-bold border text-left transition-all ${
                    active
                      ? 'border-violet-500 bg-violet-50 text-violet-800'
                      : locked
                      ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
                  }`}
                >
                  <div className="truncate">{char.name}</div>
                  {locked && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      ปลดล็อก Lv.{char.minLevel}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Outfit Color & Aura Background */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              สีชุดประจำตัว
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {OUTFIT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setOutfitColor(c.hex)}
                  aria-label={c.name}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    outfitColor === c.hex
                      ? 'ring-4 ring-violet-300 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              สีพื้นหลังออร่าอวตาร
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {AVATAR_AURAS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAuraStyle(a.id)}
                  title={a.name}
                  aria-label={a.name}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${a.swatch} transition-transform ${
                    auraStyle === a.id
                      ? 'ring-4 ring-violet-300 scale-110'
                      : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Accessories with Category Filter */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <label className="text-xs font-bold text-slate-600">
              ไอเทมตกแต่ง ({AVATAR_ACCESSORIES.length - 1} ชิ้น)
            </label>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(['ทั้งหมด', 'ศีรษะ', 'แว่นตา', 'ชุดและปีก'] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAccFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      accFilter === cat
                        ? 'bg-white text-violet-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {visibleAccessories.map((acc) => {
              const unlocked =
                child.avatar.unlockedAccessories.includes(acc.id) ||
                acc.id === 'none';
              const levelLocked = child.level < acc.minLevel;
              const active = accessory === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  disabled={levelLocked}
                  onClick={() => setAccessory(acc.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    active
                      ? 'border-violet-500 bg-violet-50'
                      : levelLocked
                      ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                      : 'border-slate-200 bg-white hover:border-violet-200'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">
                    {acc.name}
                  </div>
                  <div className="text-[11px] mt-0.5 tabular-nums">
                    {levelLocked ? (
                      <span className="text-slate-400">
                        ปลดล็อกที่ Lv.{acc.minLevel}
                      </span>
                    ) : unlocked ? (
                      <span className="text-emerald-600 font-semibold">
                        มีแล้ว · สวมใส่ได้ทันที
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold">
                        ปลดล็อก {acc.cost} เหรียญ
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          disabled={!canAfford || !meetsLevel}
          onClick={() =>
            onUpdateAvatar(
              child.id,
              character,
              accessory,
              outfitColor,
              auraStyle,
              unlockCost
            )
          }
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 disabled:opacity-50"
        >
          {unlockCost > 0
            ? canAfford
              ? `ปลดล็อกและบันทึกอวตาร (-${unlockCost} เหรียญ)`
              : `เหรียญยังไม่พอ (ขาดอีก ${unlockCost - child.coins} เหรียญ)`
            : 'บันทึกการตกแต่งอวตาร'}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* 3b. Child Profile Create / Edit Modal (CRUD) */
export const ChildFormModal: React.FC<{
  open: boolean;
  editingChild: ChildProfile | null;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    age: number;
    ageGroup: AgeGroup;
    pin: string;
    dailyCap: number;
    coins: number;
    character: AvatarCharacter;
    outfitColor: string;
  }) => void;
}> = ({ open, editingChild, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(7);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('6-9');
  const [pin, setPin] = useState('1111');
  const [dailyCap, setDailyCap] = useState(4);
  const [coins, setCoins] = useState(0);
  const [character, setCharacter] = useState<AvatarCharacter>('fox');
  const [outfitColor, setOutfitColor] = useState(OUTFIT_COLORS[0].hex);

  useEffect(() => {
    if (open) {
      if (editingChild) {
        setName(editingChild.name);
        setAge(editingChild.age);
        setAgeGroup(editingChild.ageGroup);
        setPin(editingChild.pin || '1111');
        setDailyCap(editingChild.dailyCap);
        setCoins(editingChild.coins);
        setCharacter(editingChild.avatar.character);
        setOutfitColor(editingChild.avatar.outfitColor);
      } else {
        setName('');
        setAge(6);
        setAgeGroup('6-9');
        setPin('');
        setDailyCap(4);
        setCoins(0);
        setCharacter('bear');
        setOutfitColor(OUTFIT_COLORS[0].hex);
      }
    }
  }, [open, editingChild]);

  const handleAgeChange = (nextAge: number) => {
    setAge(nextAge);
    if (nextAge <= 5) {
      setAgeGroup('3-5');
      setDailyCap(AGE_GROUP_INFO['3-5'].defaultCap);
    } else if (nextAge <= 9) {
      setAgeGroup('6-9');
      setDailyCap(AGE_GROUP_INFO['6-9'].defaultCap);
    } else {
      setAgeGroup('10-12');
      setDailyCap(AGE_GROUP_INFO['10-12'].defaultCap);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const cleanPin = pin.replace(/\D/g, '').padEnd(4, '0').slice(0, 4);
    onSave({
      id: editingChild?.id,
      name: name.trim(),
      age,
      ageGroup,
      pin: cleanPin,
      dailyCap,
      coins: Math.max(0, coins),
      character,
      outfitColor,
    });
    onClose();
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={editingChild ? 'แก้ไขข้อมูลโปรไฟล์ลูก' : 'เพิ่มข้อมูลลูกคนใหม่'}
      subtitle="จัดการชื่อ อายุ กลุ่มพัฒนาการ และโควตางานบ้านต่อวัน"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3.5">
          <AvatarCanvas
            avatar={{
              character,
              accessory: editingChild?.avatar.accessory || 'none',
              outfitColor,
              auraStyle: editingChild?.avatar.auraStyle || 'sky',
              unlockedAccessories:
                editingChild?.avatar.unlockedAccessories || ['none'],
            }}
            level={editingChild?.level || 1}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อเล่นของลูก
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น น้องใบตอง"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              อายุ (ปี)
            </label>
            <input
              type="number"
              min={3}
              max={15}
              value={age}
              onChange={(e) => handleAgeChange(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm tabular-nums bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              กลุ่มพัฒนาการตามวัย
            </label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
            >
              {(['3-5', '6-9', '10-12'] as AgeGroup[]).map((ag) => (
                <option key={ag} value={ag}>
                  {AGE_GROUP_INFO[ag].shortLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              รหัส PIN 4 หลัก
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              required
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              placeholder="••••"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-center font-bold tracking-widest tabular-nums bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              งาน/วัน
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={dailyCap}
              onChange={(e) => setDailyCap(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm tabular-nums bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              เหรียญปัจจุบัน
            </label>
            <input
              type="number"
              min={0}
              max={99999}
              value={coins}
              onChange={(e) => setCoins(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm tabular-nums bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            ตัวละครเริ่มต้น
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {AVATAR_CHARACTERS.slice(0, 8).map((char) => (
              <button
                key={char.id}
                type="button"
                onClick={() => setCharacter(char.id)}
                className={`px-2 py-2 rounded-xl text-[11px] font-bold border truncate transition-all ${
                  character === char.id
                    ? 'border-violet-500 bg-violet-50 text-violet-800'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {char.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            สีชุดประจำตัว
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {OUTFIT_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setOutfitColor(c.hex)}
                aria-label={c.name}
                className={`w-8 h-8 rounded-full transition-transform ${
                  outfitColor === c.hex
                    ? 'ring-4 ring-violet-300 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>{editingChild ? 'บันทึกการแก้ไขข้อมูล' : 'เพิ่มโปรไฟล์ลูก'}</span>
        </button>
      </form>
    </ModalWrapper>
  );
};

/* 4. Add Custom Chore Modal */
export const AddChoreModal: React.FC<{
  open: boolean;
  defaultAgeGroup: AgeGroup;
  onClose: () => void;
  onAdd: (chore: Omit<ChoreItem, 'id'>) => void;
}> = ({ open, defaultAgeGroup, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(defaultAgeGroup);
  const [category, setCategory] = useState<ChoreCategory>('จัดระเบียบ');
  const [baseCoins, setBaseCoins] = useState(15);
  const [timeBonusCoins, setTimeBonusCoins] = useState(5);
  const [deadlineTime, setDeadlineTime] = useState('20:00');
  const [estimatedMinutes, setEstimatedMinutes] = useState(10);

  useEffect(() => {
    setAgeGroup(defaultAgeGroup);
  }, [defaultAgeGroup, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      description:
        description.trim() || 'ช่วยกันดูแลบ้านของเราให้น่าอยู่ยิ่งขึ้น',
      ageGroup,
      category,
      baseCoins,
      timeBonusCoins,
      deadlineTime: timeBonusCoins > 0 ? deadlineTime : undefined,
      estimatedMinutes,
      iconKey:
        category === 'งานครัว'
          ? 'table'
          : category === 'ความสะอาด'
          ? 'broom'
          : category === 'ดูแลสัตว์เลี้ยง'
          ? 'pet'
          : 'toys',
      isCustom: true,
    });
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="เพิ่มภารกิจงานบ้านใหม่"
      subtitle="กำหนดภารกิจตามช่วงวัยและโบนัสตรงเวลา"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            ชื่อภารกิจ
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น รดน้ำต้นไม้หน้าบ้าน"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            คำอธิบายเชิงบวก
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ช่วยให้ต้นไม้สดชื่นและเติบโตไปพร้อมกับหนู"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              กลุ่มช่วงวัย
            </label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
            >
              {(['3-5', '6-9', '10-12'] as AgeGroup[]).map((ag) => (
                <option key={ag} value={ag}>
                  {AGE_GROUP_INFO[ag].shortLabel}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมวดหมู่
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ChoreCategory)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
            >
              <option value="จัดระเบียบ">จัดระเบียบ</option>
              <option value="ความสะอาด">ความสะอาด</option>
              <option value="งานครัว">งานครัว</option>
              <option value="ดูแลสัตว์เลี้ยง">ดูแลสัตว์เลี้ยง</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              เหรียญพื้นฐาน
            </label>
            <input
              type="number"
              min={5}
              max={100}
              value={baseCoins}
              onChange={(e) => setBaseCoins(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              โบนัสตรงเวลา
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={timeBonusCoins}
              onChange={(e) => setTimeBonusCoins(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              กำหนดเวลา
            </label>
            <input
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            เวลาโดยประมาณ (นาที): {estimatedMinutes} นาที
          </label>
          <input
            type="range"
            min={5}
            max={45}
            step={5}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            className="w-full accent-violet-600"
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มภารกิจเข้าสู่รายการ</span>
        </button>
      </form>
    </ModalWrapper>
  );
};

/* 4b. Parent Reward Rule Create / Edit Modal (CRUD) */
export const RewardFormModal: React.FC<{
  open: boolean;
  editingReward: FamilyReward | null;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    title: string;
    description: string;
    cost: number;
    category: RewardCategory;
  }) => void;
}> = ({ open, editingReward, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(50);
  const [category, setCategory] = useState<RewardCategory>('เงินค่าขนม');

  useEffect(() => {
    if (open) {
      if (editingReward) {
        setTitle(editingReward.title);
        setDescription(editingReward.description);
        setCost(editingReward.cost);
        setCategory(editingReward.category);
      } else {
        setTitle('');
        setDescription('');
        setCost(50);
        setCategory('เงินค่าขนม');
      }
    }
  }, [open, editingReward]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: editingReward?.id,
      title: title.trim(),
      description:
        description.trim() ||
        'รางวัลความตั้งใจที่ผู้ปกครองกำหนดให้ลูกนำเหรียญมาแลกได้',
      cost: Math.max(1, Math.round(cost)),
      category,
    });
    onClose();
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={
        editingReward
          ? 'แก้ไขรายการแลกรางวัล'
          : 'เพิ่มเกณฑ์แลกเหรียญ / ของรางวัลใหม่'
      }
      subtitle="กำหนดว่าใช้กี่แต้มแลกอะไรได้บ้าง เช่น เงินค่าขนม ของขวัญ หรือสิ่งที่อยากได้"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            หมวดหมู่ของรางวัล
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REWARD_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  category === cat.id
                    ? 'border-violet-500 bg-violet-50 text-violet-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            ชื่อรางวัล / สิ่งที่แลกได้
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น เงินค่าขนม 50 บาท, ตุ๊กตาตัวใหม่, เลโก้ที่อยากได้"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            จำนวนเหรียญ (แต้ม) ที่ใช้แลก
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={10000}
              required
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="w-32 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <div className="flex flex-wrap gap-1.5">
              {[20, 40, 60, 100, 150, 200].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCost(preset)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold tabular-nums transition-colors ${
                    cost === preset
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            รายละเอียดเพิ่มเติม (ไม่บังคับ)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ระบุเงื่อนไขหรือรายละเอียด เช่น แลกได้สัปดาห์ละ 1 ครั้ง หรือใช้แลกวันเสาร์"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
        >
          <Gift className="w-4 h-4" />
          <span>
            {editingReward ? 'บันทึกการแก้ไขรางวัล' : 'เพิ่มรางวัลเข้าสู่รายการ'}
          </span>
        </button>
      </form>
    </ModalWrapper>
  );
};

/* 5. Mandatory Explicit Confirmation Dialog before Google Sheets Mutations */
export const SheetsConfirmModal: React.FC<{
  open: boolean;
  spreadsheetId: string;
  summaryLines: string[];
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ open, spreadsheetId, summaryLines, onCancel, onConfirm }) => {
  return (
    <ModalWrapper
      open={open}
      onClose={onCancel}
      title="ยืนยันการอัปเดตข้อมูลบน Google Sheets"
      subtitle="กรุณาตรวจสอบรายละเอียดก่อนเขียนข้อมูลลงในสเปรดชีตของคุณ"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">
              การดำเนินการนี้จะเขียนและอัปเดตข้อมูลในสเปรดชีต ID:
            </p>
            <p className="font-mono-num break-all text-amber-800">
              {spreadsheetId}
            </p>
          </div>
        </div>

        <ul className="space-y-1.5 text-sm text-slate-700 bg-slate-50 rounded-2xl p-4">
          {summaryLines.map((line, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-violet-600 font-bold">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md shadow-violet-500/20"
          >
            ยืนยันการบันทึกข้อมูล
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

/* 6. Parent Settings, Anti-Burnout, Screen Time, Google Sheets, Drive & Telegram Panel */
export const ParentSettingsPanel: React.FC<{
  childrenList: ChildProfile[];
  settings: AppSettings;
  googleServerStatus: GoogleServerStatus | null;
  isSyncingSheets: boolean;
  lastSyncedAt: string | null;
  pendingDrivePhotoCount: number;
  isUploadingDrive: boolean;
  serverTelegramConfigured: boolean;
  onLoadFromSheets: () => void;
  onRequestSyncToSheets: () => void;
  onVerifyDriveFolder: () => Promise<void>;
  onBatchUploadDrivePhotos: () => Promise<void>;
  onUpdateSettings: (next: AppSettings) => void;
  onUpdateChildDailyCap: (childId: string, cap: number) => void;
  onTestTelegram: () => Promise<void>;
  onResetAllData: () => void;
}> = ({
  childrenList,
  settings,
  googleServerStatus,
  isSyncingSheets,
  lastSyncedAt,
  pendingDrivePhotoCount,
  isUploadingDrive,
  serverTelegramConfigured,
  onLoadFromSheets,
  onRequestSyncToSheets,
  onVerifyDriveFolder,
  onBatchUploadDrivePhotos,
  onUpdateSettings,
  onUpdateChildDailyCap,
  onTestTelegram,
  onResetAllData,
}) => {
  const [testingTg, setTestingTg] = useState(false);
  const [verifyingDrive, setVerifyingDrive] = useState(false);
  const [showAppsScriptGuide, setShowAppsScriptGuide] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2500);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleTest = async () => {
    setTestingTg(true);
    try {
      await onTestTelegram();
    } finally {
      setTestingTg(false);
    }
  };

  const handleVerifyDrive = async () => {
    setVerifyingDrive(true);
    try {
      await onVerifyDriveFolder();
    } finally {
      setVerifyingDrive(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Column 1: Zero-Login Google Sheets & Google Drive Integration */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Google Sheets & Google Drive (ใช้งานได้ทันที)
            </h3>
            <p className="text-xs text-slate-500">
              เชื่อมต่อตรงผ่านระบบเซิร์ฟเวอร์ ไม่ต้องเข้าสู่ระบบ Google / Gmail
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Google Spreadsheet ID
            </label>
            <input
              type="text"
              value={settings.spreadsheetId}
              onChange={(e) =>
                onUpdateSettings({ ...settings, spreadsheetId: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono-num bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Google Drive Folder ID (เก็บรูปภาพที่อัปโหลด)
            </label>
            <input
              type="text"
              value={settings.driveFolderId}
              onChange={(e) =>
                onUpdateSettings({ ...settings, driveFolderId: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono-num bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoUploadDrivePhotos}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  autoUploadDrivePhotos: e.target.checked,
                })
              }
              className="w-4 h-4 rounded accent-violet-600"
            />
            <span>บันทึกรูปภาพลง Google Drive อัตโนมัติเมื่อเด็กส่งงาน</span>
          </label>
        </div>

        <div className="space-y-3">
          {googleServerStatus?.configured ? (
            <div className="rounded-2xl bg-emerald-50/75 border border-emerald-100 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    พร้อมใช้งานทันทีโดยไม่ต้องล็อกอิน Gmail (
                    {googleServerStatus.mode === 'service_account'
                      ? 'Service Account'
                      : 'Apps Script Web App'}
                    )
                  </span>
                </p>
              </div>
              {googleServerStatus.serviceAccountEmail && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-800 bg-white/75 rounded-xl px-2.5 py-1.5">
                  <span className="truncate font-mono-num">
                    แชร์ชีต/โฟลเดอร์ให้: {googleServerStatus.serviceAccountEmail}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        googleServerStatus.serviceAccountEmail!,
                        'email'
                      )
                    }
                    className="font-bold text-emerald-700 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedText === 'email' ? 'คัดลอกแล้ว!' : 'คัดลอกอีเมล'}</span>
                  </button>
                </div>
              )}
              <p className="text-[11px] text-emerald-700">
                {lastSyncedAt
                  ? `ซิงค์ล่าสุดเมื่อ ${lastSyncedAt}`
                  : 'ผู้ใช้ทุกคนในครอบครัวสามารถกดซิงค์ Sheets และอัปโหลดรูปเข้า Drive ได้เลย'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-3.5 space-y-2">
              <p className="text-xs font-bold text-amber-900">
                ใช้งานได้ทันทีโดยไม่ต้องล็อกอิน Gmail (รอตั้งค่าสิทธิ์บนเซิร์ฟเวอร์ 1 ครั้ง)
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                เพื่อความปลอดภัย ผู้ใช้งานในแอปไม่ต้องเข้าสู่ระบบ Gmail — เจ้าของระบบเพียงเพิ่มค่า{' '}
                <code className="font-bold">GOOGLE_SERVICE_ACCOUNT_JSON</code> หรือ{' '}
                <code className="font-bold">GOOGLE_APPS_SCRIPT_URL</code> ในเมนู Secrets ของโปรเจกต์
              </p>
              <button
                type="button"
                onClick={() => setShowAppsScriptGuide((v) => !v)}
                className="text-[11px] font-bold text-violet-700 hover:underline"
              >
                {showAppsScriptGuide
                  ? 'ซ่อนโค้ด Apps Script (Code.gs)'
                  : 'ดูวิธีเชื่อมต่อด้วย Google Apps Script (สำหรับบัญชี Gmail ส่วนตัว)'}
              </button>

              {showAppsScriptGuide && (
                <div className="rounded-xl bg-white border border-amber-200 p-3 space-y-2 text-[11px] text-slate-700">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      เปิด <span className="font-bold">script.google.com</span> สร้างโปรเจกต์ใหม่แล้ววางโค้ดด้านล่าง
                    </li>
                    <li>
                      กด <span className="font-bold">Deploy → New deployment → Web app</span> เลือก Execute as: <span className="font-bold">Me</span> และ Who has access: <span className="font-bold">Anyone</span>
                    </li>
                    <li>
                      นำ URL ที่ลงท้ายด้วย <code className="font-bold">/exec</code> ไปใส่ใน Secret ชื่อ <code className="font-bold">GOOGLE_APPS_SCRIPT_URL</code>
                    </li>
                  </ol>
                  <button
                    type="button"
                    onClick={() => handleCopy(APPS_SCRIPT_CODE_GS, 'script')}
                    className="w-full py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>
                      {copiedText === 'script'
                        ? 'คัดลอกโค้ด Apps Script เรียบร้อย!'
                        : 'คัดลอกโค้ด Apps Script (Code.gs)'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {isSyncingSheets || isUploadingDrive ? (
            <LoadingSpinner
              label={
                isUploadingDrive
                  ? 'กำลังอัปโหลดรูปภาพไปยัง Google Drive...'
                  : 'กำลังซิงค์ข้อมูลกับ Google Sheets...'
              }
            />
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onLoadFromSheets}
                  className="h-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4 text-sky-500" />
                  <span>ดึงข้อมูลจาก Sheets</span>
                </button>
                <button
                  type="button"
                  onClick={onRequestSyncToSheets}
                  className="h-11 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/20"
                >
                  <Upload className="w-4 h-4" />
                  <span>บันทึกลง Sheets</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={verifyingDrive}
                  onClick={handleVerifyDrive}
                  className="h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <FolderOpen className="w-4 h-4 text-emerald-600" />
                  <span>
                    {verifyingDrive ? 'กำลังตรวจสอบ...' : 'ตรวจสอบโฟลเดอร์ Drive'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={pendingDrivePhotoCount === 0}
                  onClick={onBatchUploadDrivePhotos}
                  className="h-10 rounded-2xl bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {pendingDrivePhotoCount > 0
                      ? `อัปโหลดรูปค้างขึ้น Drive (${pendingDrivePhotoCount})`
                      : 'อัปโหลดรูปครบทุกภาพแล้ว'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Telegram Bot Notifications & Behavioral Safeguards */}
      <div className="space-y-6">
        <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                แจ้งเตือนผู้ปกครองผ่าน Telegram
              </h3>
              <p className="text-xs text-slate-500">
                ส่งข้อความพร้อมรูปหลักฐานทันทีเมื่อเด็กส่งงาน (
                {serverTelegramConfigured
                  ? 'ตรวจพบค่าเริ่มต้นบนเซิร์ฟเวอร์แล้ว'
                  : 'ระบุ Token และ Chat ID ด้านล่างหรือตั้งค่าใน .env'}
                )
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                TELEGRAM_TOKEN
              </label>
              <input
                type="password"
                value={settings.telegram.token}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    telegram: { ...settings.telegram, token: e.target.value },
                  })
                }
                placeholder={
                  serverTelegramConfigured
                    ? 'ใช้ค่าจาก Server Env แล้ว (ใส่เพื่อแทนที่)'
                    : '123456:ABC-DEF...'
                }
                className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                TELEGRAM_CHAT_ID
              </label>
              <input
                type="text"
                value={settings.telegram.chatId}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    telegram: { ...settings.telegram, chatId: e.target.value },
                  })
                }
                placeholder={
                  serverTelegramConfigured
                    ? 'ใช้ค่าจาก Server Env แล้ว'
                    : 'เช่น -1001234567890'
                }
                className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.telegram.notifyOnSubmit}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    telegram: {
                      ...settings.telegram,
                      notifyOnSubmit: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded accent-violet-600"
              />
              <span>แจ้งเตือนอัตโนมัติเมื่อเด็กส่งภารกิจ</span>
            </label>

            <button
              type="button"
              onClick={handleTest}
              disabled={testingTg}
              className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingTg ? 'กำลังส่ง...' : 'ทดสอบส่งข้อความ'}</span>
            </button>
          </div>
        </div>

        {/* Behavioral Safeguards: Anti-Burnout & Screen-Time Regulation */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                สุขภาวะดิจิทัล & ป้องกันความเหนื่อยล้า
              </h3>
              <p className="text-xs text-slate-500">
                จำกัดเวลาหน้าจอและจำนวนภารกิจต่อวันเพื่อพัฒนาการที่สมดุล
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>เวลาใช้งานแอปสูงสุดต่อรอบ (Screen Time Limit)</span>
              <span className="text-violet-700 tabular-nums">
                {settings.screenTimeLimitMinutes} นาที
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={settings.screenTimeLimitMinutes}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  screenTimeLimitMinutes: Number(e.target.value),
                })
              }
              className="w-full accent-violet-600"
            />
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700">
              ลิมิตงานบ้านสูงสุดต่อวัน (Anti-Burnout Cap)
            </p>
            {childrenList.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="font-semibold text-slate-700">
                  {c.name} ({AGE_GROUP_INFO[c.ageGroup].shortLabel})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateChildDailyCap(c.id, Math.max(1, c.dailyCap - 1))
                    }
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-slate-900 tabular-nums">
                    {c.dailyCap} งาน
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateChildDailyCap(c.id, Math.min(8, c.dailyCap + 1))
                    }
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Lock className="w-3.5 h-3.5" />
              <span>รหัส PIN โหมดผู้ปกครอง (4 หลัก)</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={settings.parentPin}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  parentPin: e.target.value.replace(/\D/g, '').slice(0, 4),
                })
              }
              className="w-24 text-center rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-mono-num font-bold tracking-widest"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              ล้างประวัติทดลองและรีเซ็ตเหรียญ/เลเวลของเด็กทุกคนเป็น 0 เพื่อเริ่มใช้งานจริง
            </p>
            <button
              type="button"
              onClick={onResetAllData}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold whitespace-nowrap transition-colors shrink-0"
            >
              รีเซ็ตเริ่มใหม่ทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
