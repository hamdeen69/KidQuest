import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Coins,
  Gift,
  Home,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import Swal from 'sweetalert2';
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
  MainTab,
  RewardCategory,
  RewardRedemption,
} from './types';
import {
  AGE_GROUP_INFO,
  formatDateKey,
  INITIAL_CHILDREN,
  INITIAL_CHORES,
  INITIAL_REWARDS,
  INITIAL_SETTINGS,
  INITIAL_SUBMISSIONS,
  POSITIVE_TIPS,
  QUALITY_TIERS,
} from './data/initialData';
import {
  fetchGoogleServerStatus,
  GoogleServerStatus,
  loadAllFromGoogleSheets,
  syncAllToGoogleSheets,
} from './services/googleSheets';
import {
  uploadChorePhotoToDrive,
  verifyDriveFolder,
} from './services/googleDrive';
import { AvatarCanvas } from './components/AvatarCanvas';
import {
  AimCardIllustration,
  ChoreIconBadge,
} from './components/ChoreIllustration';
import { ScreenTimeRing } from './components/ScreenTimeRing';
import { OverviewChart } from './components/OverviewChart';
import { CalendarRewardsView } from './components/CalendarRewardsView';
import { FamilyPodium } from './components/FamilyPodium';
import { ChildLoginScreen } from './components/ChildLoginScreen';
import { PinKeypad } from './components/PinKeypad';
import { RewardsExchangeView } from './components/RewardsExchangeView';
import { ParentRewardsHub } from './components/ParentRewardsHub';
import { LoginQuoteToast } from './components/LoginQuoteToast';
import { getRandomKidQuote } from './data/kidsQuotes';
import {
  AddChoreModal,
  AvatarWorkshopModal,
  ChildFormModal,
  ParentApprovalModal,
  ParentSettingsPanel,
  RewardFormModal,
  SheetsConfirmModal,
  SubmitChoreModal,
} from './components/Modals';
import {
  toastEncouragement,
  toastError,
  toastSuccess,
} from './utils/swal';
import { getAgeLanguage } from './utils/ageLanguage';

const STORAGE_KEY = 'kidquest_family_state_v2';

interface PersistedState {
  children: ChildProfile[];
  chores: ChoreItem[];
  submissions: ChoreSubmission[];
  rewards: FamilyReward[];
  redemptions?: RewardRedemption[];
  activeChildId: string;
  settings: Omit<AppSettings, 'telegram'> & {
    telegram: { chatId: string; notifyOnSubmit: boolean };
  };
}

function loadInitialState(): {
  children: ChildProfile[];
  chores: ChoreItem[];
  submissions: ChoreSubmission[];
  rewards: FamilyReward[];
  redemptions: RewardRedemption[];
  activeChildId: string;
  settings: AppSettings;
} {
  try {
    // Clear legacy demo state so the app starts cleanly ready for production use
    localStorage.removeItem('kidquest_family_state_v1');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      const normalizedChildren = parsed.children?.length
        ? parsed.children.map((c, idx) => ({
            ...c,
            pin: c.pin || INITIAL_CHILDREN[idx]?.pin || '1111',
          }))
        : INITIAL_CHILDREN;
      return {
        children: normalizedChildren,
        chores: parsed.chores?.length ? parsed.chores : INITIAL_CHORES,
        submissions: parsed.submissions || INITIAL_SUBMISSIONS,
        rewards: parsed.rewards?.length ? parsed.rewards : INITIAL_REWARDS,
        redemptions: parsed.redemptions || [],
        activeChildId: parsed.activeChildId || normalizedChildren[0].id,
        settings: {
          spreadsheetId:
            parsed.settings?.spreadsheetId || INITIAL_SETTINGS.spreadsheetId,
          driveFolderId:
            parsed.settings?.driveFolderId || INITIAL_SETTINGS.driveFolderId,
          autoUploadDrivePhotos:
            parsed.settings?.autoUploadDrivePhotos ??
            INITIAL_SETTINGS.autoUploadDrivePhotos,
          screenTimeLimitMinutes:
            parsed.settings?.screenTimeLimitMinutes ||
            INITIAL_SETTINGS.screenTimeLimitMinutes,
          parentPin: parsed.settings?.parentPin || INITIAL_SETTINGS.parentPin,
          telegram: {
            token: '',
            chatId: parsed.settings?.telegram?.chatId || '',
            notifyOnSubmit:
              parsed.settings?.telegram?.notifyOnSubmit ?? true,
          },
        },
      };
    }
  } catch {
    // Fallback to initial defaults
  }

  return {
    children: INITIAL_CHILDREN,
    chores: INITIAL_CHORES,
    submissions: INITIAL_SUBMISSIONS,
    rewards: INITIAL_REWARDS,
    redemptions: [],
    activeChildId: INITIAL_CHILDREN[1].id,
    settings: INITIAL_SETTINGS,
  };
}

export default function App() {
  const initial = useMemo(() => loadInitialState(), []);

  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [childrenList, setChildrenList] = useState<ChildProfile[]>(
    initial.children
  );
  const [chores, setChores] = useState<ChoreItem[]>(initial.chores);
  const [submissions, setSubmissions] = useState<ChoreSubmission[]>(
    initial.submissions
  );
  const [rewards, setRewards] = useState<FamilyReward[]>(initial.rewards);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>(
    initial.redemptions
  );
  const [activeChildId, setActiveChildId] = useState<string>(
    initial.activeChildId
  );
  const [settings, setSettings] = useState<AppSettings>(initial.settings);

  // Filters & UI states
  const [choreSearch, setChoreSearch] = useState('');
  const [ageFilter, setAgeFilter] = useState<AgeGroup | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ChoreCategory | 'all'>(
    'all'
  );
  const [showTipBanner, setShowTipBanner] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);

  // Modals
  const [submittingChore, setSubmittingChore] = useState<ChoreItem | null>(
    null
  );
  const [reviewingSubmission, setReviewingSubmission] =
    useState<ChoreSubmission | null>(null);
  const [avatarWorkshopOpen, setAvatarWorkshopOpen] = useState(false);
  const [addChoreOpen, setAddChoreOpen] = useState(false);
  const [sheetsConfirmOpen, setSheetsConfirmOpen] = useState(false);
  const [childFormOpen, setChildFormOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [rewardFormOpen, setRewardFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<FamilyReward | null>(null);

  // Login & Parent mode PIN lock
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [loginToast, setLoginToast] = useState<{
    open: boolean;
    childName: string;
    quote: string;
    quoteNumber: number;
    lastIndex?: number;
  }>({
    open: false,
    childName: '',
    quote: '',
    quoteNumber: 1,
  });

  // Zero-Login Google Workspace Server Status, Sheets Sync & Drive Upload
  const [googleServerStatus, setGoogleServerStatus] =
    useState<GoogleServerStatus | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Server Telegram status
  const [serverTelegramConfigured, setServerTelegramConfigured] =
    useState(false);

  // Persist non-secret state
  useEffect(() => {
    const payload: PersistedState = {
      children: childrenList,
      chores,
      submissions,
      rewards,
      redemptions,
      activeChildId,
      settings: {
        spreadsheetId: settings.spreadsheetId,
        driveFolderId: settings.driveFolderId,
        autoUploadDrivePhotos: settings.autoUploadDrivePhotos,
        screenTimeLimitMinutes: settings.screenTimeLimitMinutes,
        parentPin: settings.parentPin,
        telegram: {
          chatId: settings.telegram.chatId,
          notifyOnSubmit: settings.telegram.notifyOnSubmit,
        },
      },
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    childrenList,
    chores,
    submissions,
    rewards,
    redemptions,
    activeChildId,
    settings,
  ]);

  // Check server Google Workspace & Telegram configuration status on mount
  useEffect(() => {
    fetchGoogleServerStatus()
      .then((status) => setGoogleServerStatus(status))
      .catch(() => setGoogleServerStatus(null));

    fetch('/api/telegram/status')
      .then((r) => r.json())
      .then((d) => setServerTelegramConfigured(Boolean(d?.envConfigured)))
      .catch(() => setServerTelegramConfigured(false));
  }, []);

  const activeChild = useMemo(
    () =>
      childrenList.find((c) => c.id === activeChildId) || childrenList[0],
    [childrenList, activeChildId]
  );

  const lang = useMemo(
    () => getAgeLanguage(activeChild.ageGroup),
    [activeChild.ageGroup]
  );

  // Keep age filter synced softly when switching child if user wants
  const handleSelectChild = (child: ChildProfile) => {
    setActiveChildId(child.id);
    setAgeFilter(child.ageGroup);
  };

  const todayKey = formatDateKey();

  const todayChildSubmissions = useMemo(
    () =>
      submissions.filter(
        (s) => s.childId === activeChild.id && s.dateKey === todayKey
      ),
    [submissions, activeChild.id, todayKey]
  );

  const todayCoinsEarned = useMemo(
    () =>
      todayChildSubmissions
        .filter((s) => s.status === 'approved')
        .reduce((sum, s) => sum + (s.totalCoinsAwarded || 0), 0),
    [todayChildSubmissions]
  );

  const pendingSubmissions = useMemo(
    () => submissions.filter((s) => s.status === 'pending'),
    [submissions]
  );

  const isDailyCapReached =
    todayChildSubmissions.length >= activeChild.dailyCap;

  const filteredChores = useMemo(() => {
    return chores.filter((ch) => {
      if (ageFilter !== 'all' && ch.ageGroup !== ageFilter) return false;
      if (categoryFilter !== 'all' && ch.category !== categoryFilter)
        return false;
      if (
        choreSearch.trim() &&
        !ch.title.toLowerCase().includes(choreSearch.toLowerCase()) &&
        !ch.description.toLowerCase().includes(choreSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [chores, ageFilter, categoryFilter, choreSearch]);

  const recentActivity = useMemo(
    () =>
      submissions
        .filter((s) => s.childId === activeChild.id)
        .slice(0, 4),
    [submissions, activeChild.id]
  );

  /* Actions */
  const handleSubmitChore = async ({
    chore,
    photoDataUrl,
    note,
    onTime,
    saveToDrive,
  }: {
    chore: ChoreItem;
    photoDataUrl?: string;
    note: string;
    onTime: boolean;
    saveToDrive: boolean;
  }) => {
    if (isDailyCapReached) {
      setSubmittingChore(null);
      await toastEncouragement(
        lang.capReachedTitle,
        lang.capReachedBody(activeChild.name, activeChild.dailyCap)
      );
      return;
    }

    let driveFileId: string | undefined;
    let driveWebViewLink: string | undefined;
    let driveUploadWarning = false;

    if (photoDataUrl && saveToDrive) {
      if (googleServerStatus && !googleServerStatus.configured) {
        driveUploadWarning = true;
      } else {
        try {
          const uploaded = await uploadChorePhotoToDrive({
            dataUrl: photoDataUrl,
            fileBaseName: `KidQuest_${todayKey}_${activeChild.name}_${chore.title}`,
            folderId: settings.driveFolderId,
            description: `หลักฐานภารกิจ "${chore.title}" โดย ${activeChild.name} วันที่ ${todayKey}`,
          });
          driveFileId = uploaded.id;
          driveWebViewLink = uploaded.webViewLink;
        } catch {
          driveUploadWarning = true;
        }
      }
    }

    const newSubmission: ChoreSubmission = {
      id: `sub-${Date.now()}`,
      choreId: chore.id,
      choreTitle: chore.title,
      category: chore.category,
      childId: activeChild.id,
      childName: activeChild.name,
      ageGroup: activeChild.ageGroup,
      submittedAt: new Date().toISOString(),
      dateKey: todayKey,
      status: 'pending',
      photoDataUrl,
      driveFileId,
      driveWebViewLink,
      childNote: note || undefined,
      onTime,
      baseCoins: chore.baseCoins,
      timeBonusCoins: chore.timeBonusCoins,
    };

    setSubmissions((prev) => [newSubmission, ...prev]);
    setSubmittingChore(null);

    // Send Telegram notification if enabled
    if (settings.telegram.notifyOnSubmit) {
      fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: activeChild.name,
          ageGroupLabel: AGE_GROUP_INFO[activeChild.ageGroup].shortLabel,
          choreTitle: chore.title,
          baseCoins: chore.baseCoins,
          deadlineBonus: chore.timeBonusCoins,
          onTime,
          note: driveWebViewLink
            ? `${note ? `${note} | ` : ''}Google Drive: ${driveWebViewLink}`
            : note,
          photoDataUrl,
          token: settings.telegram.token,
          chatId: settings.telegram.chatId,
        }),
      }).catch(() => {});
    }

    if (driveWebViewLink) {
      await toastSuccess(
        lang.submitSuccessTitle,
        `${lang.submitSuccessBody(activeChild.name)} และบันทึกรูปลง Google Drive แล้ว`
      );
    } else if (driveUploadWarning) {
      await toastEncouragement(
        lang.submitSuccessTitle,
        `${lang.submitSuccessBody(
          activeChild.name
        )} (บันทึกภาพในเครื่องแล้ว ผู้ปกครองสามารถกดอัปโหลดขึ้น Drive ภายหลังได้)`
      );
    } else {
      await toastSuccess(
        lang.submitSuccessTitle,
        lang.submitSuccessBody(activeChild.name)
      );
    }
  };

  const handleApproveSubmission = async (
    submission: ChoreSubmission,
    stars: 1 | 2 | 3,
    parentNote: string
  ) => {
    const tier = QUALITY_TIERS[stars];
    const basePart = Math.round(submission.baseCoins * tier.multiplier);
    const bonusPart = submission.onTime ? submission.timeBonusCoins : 0;
    const totalCoins = basePart + bonusPart;

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submission.id
          ? {
              ...s,
              status: 'approved',
              qualityStars: stars,
              multiplier: tier.multiplier,
              totalCoinsAwarded: totalCoins,
              parentNote,
              reviewedAt: new Date().toISOString(),
            }
          : s
      )
    );

    setChildrenList((prev) =>
      prev.map((c) => {
        if (c.id !== submission.childId) return c;
        const nextXp = c.xp + totalCoins * 2;
        const nextLevel = Math.max(c.level, Math.floor(nextXp / 100) + 1);
        return {
          ...c,
          coins: c.coins + totalCoins,
          xp: nextXp,
          level: nextLevel,
        };
      })
    );

    setReviewingSubmission(null);
    await toastSuccess(
      `มอบ +${totalCoins} เหรียญสำเร็จ!`,
      `${submission.childName} ได้รับ ${stars} ดาว (${tier.label})`
    );
  };

  const handleRequestRetry = async (
    submission: ChoreSubmission,
    parentNote: string
  ) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submission.id
          ? {
              ...s,
              status: 'needs_retry',
              parentNote,
              reviewedAt: new Date().toISOString(),
            }
          : s
      )
    );
    setReviewingSubmission(null);
    await toastEncouragement(
      'ส่งคำแนะนำเชิงบวกแล้ว',
      `บอก ${submission.childName} แล้ว: "${parentNote}"`
    );
  };

  const handleRedeemReward = async (
    reward: FamilyReward,
    targetChildId?: string,
    redeemedByParent = false,
    note?: string
  ) => {
    const child =
      childrenList.find((c) => c.id === (targetChildId || activeChild.id)) ||
      activeChild;

    if (child.coins < reward.cost) {
      await toastEncouragement(
        'เหรียญยังไม่พอนะครับ/คะ',
        `${child.name} มี ${child.coins} เหรียญ ยังขาดอีก ${
          reward.cost - child.coins
        } เหรียญเพื่อแลก "${reward.title}"`
      );
      return;
    }

    const coinsBefore = child.coins;
    const coinsAfter = coinsBefore - reward.cost;

    const confirmRes = await Swal.fire({
      icon: 'question',
      title: `ยืนยันแลก "${reward.title}"?`,
      html: `<div class="text-sm text-slate-600 space-y-1">
        <p><strong>ผู้แลก:</strong> ${child.name}</p>
        <p><strong>เหรียญปัจจุบัน:</strong> ${coinsBefore} เหรียญ</p>
        <p class="text-rose-600 font-bold">ลบเหรียญที่ใช้แลก: -${reward.cost} เหรียญ</p>
        <p class="text-emerald-600 font-bold">เหรียญคงเหลือจริง: ${coinsAfter} เหรียญ</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: `ยืนยันแลก (-${reward.cost} เหรียญ)`,
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'kidquest-swal',
        confirmButton: 'kidquest-swal-confirm',
        cancelButton: 'kidquest-swal-cancel',
      },
      buttonsStyling: false,
    });

    if (!confirmRes.isConfirmed) return;

    setChildrenList((prev) =>
      prev.map((c) =>
        c.id === child.id
          ? { ...c, coins: Math.max(0, c.coins - reward.cost) }
          : c
      )
    );

    const record: RewardRedemption = {
      id: `red-${Date.now()}`,
      rewardId: reward.id,
      rewardTitle: reward.title,
      rewardCategory: reward.category,
      childId: child.id,
      childName: child.name,
      cost: reward.cost,
      coinsBefore,
      coinsAfter,
      redeemedByParent,
      note,
      redeemedAt: new Date().toISOString(),
    };
    setRedemptions((prev) => [record, ...prev]);

    await toastSuccess(
      'แลกเหรียญรับรางวัลสำเร็จ!',
      `${child.name} แลก "${reward.title}" หักออก -${reward.cost} เหรียญ (คงเหลือ ${coinsAfter} เหรียญ)`
    );
  };

  const handleSaveReward = (data: {
    id?: string;
    title: string;
    description: string;
    cost: number;
    category: RewardCategory;
  }) => {
    if (data.id) {
      setRewards((prev) =>
        prev.map((r) =>
          r.id === data.id
            ? {
                ...r,
                title: data.title,
                description: data.description,
                cost: data.cost,
                category: data.category,
              }
            : r
        )
      );
      toastSuccess('อัปเดตรายการรางวัลแล้ว', `${data.title} (${data.cost} เหรียญ)`);
    } else {
      const created: FamilyReward = {
        id: `rew-${Date.now()}`,
        title: data.title,
        description: data.description,
        cost: data.cost,
        category: data.category,
      };
      setRewards((prev) => [created, ...prev]);
      toastSuccess(
        'เพิ่มเกณฑ์แลกรางวัลใหม่แล้ว!',
        `${created.title} (${created.cost} เหรียญ)`
      );
    }
  };

  const handleDeleteReward = async (reward: FamilyReward) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: `ลบรายการ "${reward.title}"?`,
      text: 'รายการนี้จะถูกนำออกจากเมนูแลกเหรียญของลูก',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'kidquest-swal',
        confirmButton: 'kidquest-swal-confirm',
        cancelButton: 'kidquest-swal-cancel',
      },
      buttonsStyling: false,
    });
    if (!result.isConfirmed) return;
    setRewards((prev) => prev.filter((r) => r.id !== reward.id));
    await toastSuccess('ลบรายการรางวัลเรียบร้อยแล้ว', reward.title);
  };

  const handleUpdateAvatar = async (
    childId: string,
    character: AvatarCharacter,
    accessory: AvatarAccessory,
    outfitColor: string,
    auraStyle: ChildProfile['avatar']['auraStyle'],
    unlockCost: number
  ) => {
    setChildrenList((prev) =>
      prev.map((c) => {
        if (c.id !== childId) return c;
        const unlocked = Array.from(
          new Set([...c.avatar.unlockedAccessories, accessory])
        );
        return {
          ...c,
          coins: Math.max(0, c.coins - unlockCost),
          avatar: {
            character,
            accessory,
            outfitColor,
            auraStyle,
            unlockedAccessories: unlocked,
          },
        };
      })
    );
    setAvatarWorkshopOpen(false);
    await toastSuccess(
      'บันทึกอวตารใหม่แล้ว!',
      'ตัวละครของคุณดูเท่และมีเอกลักษณ์สุดๆ ไปเลย'
    );
  };

  const handleAddChore = (newChore: Omit<ChoreItem, 'id'>) => {
    const created: ChoreItem = {
      ...newChore,
      id: `chore-custom-${Date.now()}`,
    };
    setChores((prev) => [created, ...prev]);
    toastSuccess('เพิ่มภารกิจใหม่แล้ว', created.title);
  };

  const handleSaveChild = (data: {
    id?: string;
    name: string;
    age: number;
    ageGroup: AgeGroup;
    pin: string;
    dailyCap: number;
    coins: number;
    character: AvatarCharacter;
    outfitColor: string;
  }) => {
    if (data.id) {
      setChildrenList((prev) =>
        prev.map((c) =>
          c.id === data.id
            ? {
                ...c,
                name: data.name,
                age: data.age,
                ageGroup: data.ageGroup,
                pin: data.pin,
                dailyCap: data.dailyCap,
                coins: data.coins,
                avatar: {
                  ...c.avatar,
                  character: data.character,
                  outfitColor: data.outfitColor,
                },
              }
            : c
        )
      );
      toastSuccess('อัปเดตข้อมูลเรียบร้อย!', `แก้ไขโปรไฟล์ ${data.name} แล้ว`);
    } else {
      const created: ChildProfile = {
        id: `child-${Date.now()}`,
        name: data.name,
        age: data.age,
        ageGroup: data.ageGroup,
        pin: data.pin,
        coins: data.coins,
        xp: 0,
        level: 1,
        dailyCap: data.dailyCap,
        streakDays: 0,
        avatar: {
          character: data.character,
          accessory: 'none',
          outfitColor: data.outfitColor,
          auraStyle: 'sky',
          unlockedAccessories: ['none'],
        },
      };
      setChildrenList((prev) => [...prev, created]);
      setActiveChildId(created.id);
      toastSuccess('เพิ่มโปรไฟล์ลูกสำเร็จ!', `ยินดีต้อนรับ ${created.name} สู่ KidQuest`);
    }
  };

  const handleDeleteChild = async (child: ChildProfile) => {
    if (childrenList.length <= 1) {
      await toastEncouragement(
        'ไม่สามารถลบโปรไฟล์สุดท้ายได้',
        'ควรมีข้อมูลเด็กอย่างน้อย 1 คนในครอบครัวเพื่อใช้งานระบบภารกิจ'
      );
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: `ลบโปรไฟล์ของ ${child.name}?`,
      text: 'ข้อมูลเหรียญและเลเวลของโปรไฟล์นี้จะถูกลบออกจากรายการครอบครัว',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'kidquest-swal',
        confirmButton: 'kidquest-swal-confirm',
        cancelButton: 'kidquest-swal-cancel',
      },
      buttonsStyling: false,
    });

    if (!result.isConfirmed) return;

    const remaining = childrenList.filter((c) => c.id !== child.id);
    setChildrenList(remaining);
    if (activeChildId === child.id && remaining[0]) {
      setActiveChildId(remaining[0].id);
    }
    await toastSuccess('ลบโปรไฟล์เรียบร้อยแล้ว', `ลบข้อมูลของ ${child.name} แล้ว`);
  };

  const handleLoadFromSheets = async () => {
    setIsSyncingSheets(true);
    try {
      const data = await loadAllFromGoogleSheets(settings.spreadsheetId.trim());
      if (
        !data.children &&
        !data.chores &&
        !data.submissions &&
        !data.rewards
      ) {
        await toastEncouragement(
          `เชื่อมต่อ "${data.spreadsheetTitle}" สำเร็จ`,
          'ยังไม่พบแท็บข้อมูล KidQuest ในสเปรดชีตนี้ คุณสามารถกด "บันทึกลง Sheets" เพื่อสร้างแท็บเริ่มต้นได้ทันที'
        );
      } else {
        if (data.children?.length) setChildrenList(data.children);
        if (data.chores?.length) setChores(data.chores);
        if (data.submissions) setSubmissions(data.submissions);
        if (data.rewards?.length) setRewards(data.rewards);
        if (data.redemptions) setRedemptions(data.redemptions);
        setLastSyncedAt(
          new Date().toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
        await toastSuccess(
          'ดึงข้อมูลจาก Google Sheets สำเร็จ!',
          `อัปเดตข้อมูลจาก "${data.spreadsheetTitle}" เรียบร้อยแล้ว`
        );
      }
    } catch (err) {
      await toastError(
        'ดึงข้อมูลไม่สำเร็จ',
        err instanceof Error ? err.message : 'กรุณาตรวจสอบ Spreadsheet ID'
      );
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleConfirmSyncToSheets = async () => {
    setSheetsConfirmOpen(false);
    setIsSyncingSheets(true);
    try {
      const res = await syncAllToGoogleSheets(settings.spreadsheetId.trim(), {
        children: childrenList,
        chores,
        submissions,
        rewards,
        redemptions,
      });
      setLastSyncedAt(
        new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      await toastSuccess(
        'บันทึกลง Google Sheets เรียบร้อย!',
        `อัปเดต ${res.updatedTabs.length} แท็บใน "${res.spreadsheetTitle}" สำเร็จ`
      );
    } catch (err) {
      await toastError(
        'บันทึกข้อมูลไม่สำเร็จ',
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเขียนชีต'
      );
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const pendingDrivePhotos = useMemo(
    () => submissions.filter((s) => Boolean(s.photoDataUrl) && !s.driveFileId),
    [submissions]
  );

  const handleVerifyDriveFolder = async () => {
    try {
      const folder = await verifyDriveFolder(settings.driveFolderId);
      await toastSuccess(
        'เชื่อมต่อโฟลเดอร์ Google Drive สำเร็จ!',
        `พบโฟลเดอร์ "${folder.name}" (ID: ${folder.id})`
      );
    } catch (err) {
      await toastError(
        'ไม่สามารถเข้าถึงโฟลเดอร์ Drive ได้',
        err instanceof Error ? err.message : 'กรุณาตรวจสอบสิทธิ์หรือ Folder ID'
      );
    }
  };

  const handleUploadSubmissionToDrive = async (sub: ChoreSubmission) => {
    if (!sub.photoDataUrl) return;

    const confirmRes = await Swal.fire({
      icon: 'question',
      title: 'บันทึกรูปภาพลง Google Drive?',
      html: `<div class="text-xs text-slate-600 space-y-1">
        <p><strong>ภารกิจ:</strong> ${sub.choreTitle} (${sub.childName})</p>
        <p class="font-mono-num break-all"><strong>Drive Folder ID:</strong> ${settings.driveFolderId}</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันอัปโหลดขึ้น Drive',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'kidquest-swal',
        confirmButton: 'kidquest-swal-confirm',
        cancelButton: 'kidquest-swal-cancel',
      },
      buttonsStyling: false,
    });

    if (!confirmRes.isConfirmed) return;

    try {
      const uploaded = await uploadChorePhotoToDrive({
        dataUrl: sub.photoDataUrl,
        fileBaseName: `KidQuest_${sub.dateKey}_${sub.childName}_${sub.choreTitle}`,
        folderId: settings.driveFolderId,
        description: `หลักฐานภารกิจ "${sub.choreTitle}" โดย ${sub.childName} วันที่ ${sub.dateKey}`,
      });

      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === sub.id
            ? {
                ...item,
                driveFileId: uploaded.id,
                driveWebViewLink: uploaded.webViewLink,
              }
            : item
        )
      );
      setReviewingSubmission((curr) =>
        curr && curr.id === sub.id
          ? {
              ...curr,
              driveFileId: uploaded.id,
              driveWebViewLink: uploaded.webViewLink,
            }
          : curr
      );

      await toastSuccess(
        'บันทึกรูปลง Google Drive สำเร็จ!',
        `บันทึกไฟล์ "${uploaded.name}" เรียบร้อยแล้ว`
      );
    } catch (err) {
      await toastError(
        'อัปโหลดรูปขึ้น Drive ไม่สำเร็จ',
        err instanceof Error ? err.message : 'กรุณาลองใหม่อีกครั้ง'
      );
    }
  };

  const handleBatchUploadDrivePhotos = async () => {
    if (pendingDrivePhotos.length === 0) return;

    const confirmRes = await Swal.fire({
      icon: 'question',
      title: `อัปโหลดรูปภาพ ${pendingDrivePhotos.length} รูปขึ้น Google Drive?`,
      html: `<div class="text-xs text-slate-600 space-y-1">
        <p>จะอัปโหลดรูปหลักฐานงานบ้านที่ยังไม่ได้บันทึกจำนวน <strong>${pendingDrivePhotos.length}</strong> รูป</p>
        <p class="font-mono-num break-all"><strong>ไปยัง Folder ID:</strong> ${settings.driveFolderId}</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันอัปโหลดทั้งหมด',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'kidquest-swal',
        confirmButton: 'kidquest-swal-confirm',
        cancelButton: 'kidquest-swal-cancel',
      },
      buttonsStyling: false,
    });

    if (!confirmRes.isConfirmed) return;

    setIsUploadingDrive(true);
    let successCount = 0;
    try {
      const updatedMap = new Map<
        string,
        { driveFileId: string; driveWebViewLink: string }
      >();

      for (const sub of pendingDrivePhotos) {
        if (!sub.photoDataUrl) continue;
        const uploaded = await uploadChorePhotoToDrive({
          dataUrl: sub.photoDataUrl,
          fileBaseName: `KidQuest_${sub.dateKey}_${sub.childName}_${sub.choreTitle}`,
          folderId: settings.driveFolderId,
          description: `หลักฐานภารกิจ "${sub.choreTitle}" โดย ${sub.childName} วันที่ ${sub.dateKey}`,
        });
        updatedMap.set(sub.id, {
          driveFileId: uploaded.id,
          driveWebViewLink: uploaded.webViewLink,
        });
        successCount += 1;
      }

      if (updatedMap.size > 0) {
        setSubmissions((prev) =>
          prev.map((s) => {
            const found = updatedMap.get(s.id);
            return found ? { ...s, ...found } : s;
          })
        );
      }

      await toastSuccess(
        'อัปโหลดรูปขึ้น Google Drive เรียบร้อย!',
        `บันทึกสำเร็จ ${successCount} จาก ${pendingDrivePhotos.length} รูป ลงโฟลเดอร์แล้ว`
      );
    } catch (err) {
      await toastError(
        'อัปโหลดรูปบางส่วนไม่สำเร็จ',
        err instanceof Error ? err.message : 'กรุณาตรวจสอบสิทธิ์หรือ Folder ID'
      );
    } finally {
      setIsUploadingDrive(false);
    }
  };

  const handleTestTelegram = async () => {
    const res = await fetch('/api/telegram/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: settings.telegram.token,
        chatId: settings.telegram.chatId,
      }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      message?: string;
      error?: string;
    };
    if (data.ok) {
      await toastSuccess(
        'ส่งข้อความทดสอบสำเร็จ!',
        'ตรวจสอบข้อความแจ้งเตือนในแอป Telegram ของคุณได้เลย'
      );
    } else {
      await toastError('ทดสอบ Telegram ไม่สำเร็จ', data.error);
    }
  };

  const handleLogoutToLoginScreen = () => {
    setIsLoggedIn(false);
    setParentUnlocked(false);
    setLoginToast((prev) => ({ ...prev, open: false }));
    setActiveTab('home');
  };

  const handleResetAllData = async () => {
    const res = await Swal.fire({
      icon: 'warning',
      title: 'รีเซ็ตข้อมูลทั้งหมดเพื่อเริ่มใหม่?',
      text: 'เหรียญ XP เลเวล ประวัติการส่งงาน และประวัติการแลกรางวัลทั้งหมดจะถูกตั้งค่าเริ่มต้นเป็น 0',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันรีเซ็ตทั้งหมด',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'kidquest-swal',
        confirmButton: 'kidquest-swal-confirm',
        cancelButton: 'kidquest-swal-cancel',
      },
      buttonsStyling: false,
    });
    if (!res.isConfirmed) return;

    setChildrenList((prev) =>
      prev.map((c) => ({
        ...c,
        coins: 0,
        xp: 0,
        level: 1,
        streakDays: 0,
        avatar: {
          ...c.avatar,
          accessory: 'none',
          unlockedAccessories: ['none'],
        },
      }))
    );
    setSubmissions([]);
    setRedemptions([]);
    setChores(INITIAL_CHORES);
    setRewards(INITIAL_REWARDS);
    await toastSuccess(
      'รีเซ็ตระบบเรียบร้อยแล้ว!',
      'ข้อมูลทั้งหมดพร้อมสำหรับการเริ่มต้นใช้งานจริงแล้ว'
    );
  };

  const xpIntoLevel = activeChild.xp % 100;

  const navItems: {
    id: MainTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { id: 'home', label: 'หน้าหลัก', icon: <Home className="w-5 h-5" /> },
    {
      id: 'chores',
      label: 'ภารกิจ',
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      id: 'calendar',
      label: 'ตาราง',
      icon: <CalendarDays className="w-5 h-5" />,
    },
    {
      id: 'rewards',
      label: 'แลกเหรียญ',
      icon: <Gift className="w-5 h-5" />,
    },
    {
      id: 'parent',
      label: 'ผู้ปกครอง',
      icon: <Users className="w-5 h-5" />,
      badge: pendingSubmissions.length,
    },
  ];

  if (!isLoggedIn) {
    return (
      <ChildLoginScreen
        childrenList={childrenList}
        parentPin={settings.parentPin}
        onChildLogin={(child) => {
          handleSelectChild(child);
          setParentUnlocked(false);
          setActiveTab('home');
          setIsLoggedIn(true);
          const picked = getRandomKidQuote(loginToast.lastIndex);
          setLoginToast({
            open: true,
            childName: child.name,
            quote: picked.quote,
            quoteNumber: picked.index + 1,
            lastIndex: picked.index,
          });
        }}
        onParentLogin={() => {
          setParentUnlocked(true);
          setActiveTab('parent');
          setIsLoggedIn(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen page-pastel-backdrop flex flex-col lg:flex-row text-slate-900">
      <LoginQuoteToast
        open={loginToast.open}
        childName={loginToast.childName}
        quote={loginToast.quote}
        quoteNumber={loginToast.quoteNumber}
        durationMs={7000}
        onClose={() => setLoginToast((prev) => ({ ...prev, open: false }))}
      />
      {/* Desktop / Tablet Sidebar Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-68 lg:shrink-0 bg-white/85 backdrop-blur-xl border-r border-indigo-100/70 p-5 justify-between sticky top-0 h-screen">
        <div className="space-y-6">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-3 px-1">
            <img
              src="/assets/aistudio/__________________________3f410f16.png"
              alt="KidQuest Family Logo"
              className="w-10 h-10 rounded-xl shadow-sm object-cover shrink-0"
            />
            <div className="min-w-0">
              <span className="block text-lg font-extrabold tracking-tight bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 bg-clip-text text-transparent leading-tight">
                KidQuest Family
              </span>
              <span className="block text-[11px] font-medium text-slate-400 truncate">
                ภารกิจงานบ้านแสนสนุก
              </span>
            </div>
          </div>

          {/* Active Child Card in Sidebar */}
          <div className="rounded-3xl bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <AvatarCanvas
                avatar={activeChild.avatar}
                level={activeChild.level}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {activeChild.name}
                </p>
                <p className="text-xs text-slate-500 tabular-nums">
                  Lv.{activeChild.level} · {activeChild.coins} เหรียญ
                </p>
              </div>
            </div>

            {parentUnlocked ? (
              <div className="grid grid-cols-3 gap-1 pt-1">
                {childrenList.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => handleSelectChild(child)}
                    className={`py-1.5 px-1.5 rounded-xl text-[11px] font-bold truncate transition-all ${
                      child.id === activeChild.id
                        ? 'bg-white text-violet-700 shadow-sm'
                        : 'text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    {child.name.replace('น้อง', '').replace('พี่', '')}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogoutToLoginScreen}
                className="w-full py-2 px-3 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>สลับผู้ใช้ / ออกจากระบบ</span>
              </button>
            )}
          </div>

          {/* Sidebar Nav Links */}
          <nav className="space-y-1.5" aria-label="เมนูหลัก">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-sky-400 to-violet-500 text-white shadow-md shadow-violet-500/20'
                      : 'text-slate-600 hover:bg-indigo-50/70 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs tabular-nums ${
                        active
                          ? 'bg-white/25 text-white'
                          : 'bg-violet-100 text-violet-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Avatar Workshop CTA */}
        <button
          type="button"
          onClick={() => setAvatarWorkshopOpen(true)}
          className="w-full py-3 px-4 rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>แต่งตัวอวตาร ({activeChild.name})</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6">
          {/* Compact Mobile Brand Bar */}
          <div className="lg:hidden flex items-center justify-between gap-2 mb-3 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/assets/aistudio/__________________________3f410f16.png"
                alt="KidQuest Family Logo"
                className="w-9 h-9 rounded-xl shadow-sm object-cover shrink-0"
              />
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 bg-clip-text text-transparent truncate">
                KidQuest Family
              </span>
            </div>
            <span className="text-[11px] font-bold text-violet-700 bg-white/80 px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
              {activeChild.name} · Lv.{activeChild.level}
            </span>
          </div>

          {/* TAB 1: HOME VIEW (Matches Screenshot 1) */}
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Hero Gradient Card + Curved White Last Activity Sheet */}
              <div className="lg:col-span-5 rounded-[32px] overflow-hidden shadow-[0_18px_45px_-12px_rgba(95,105,195,0.28)] bg-white">
                <div className="hero-pastel-gradient px-5 pt-5 pb-7 text-white">
                  {/* Top Bar inside Hero: Child Avatar + Child Switcher + Quick Parent Button */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <button
                      type="button"
                      onClick={() => setAvatarWorkshopOpen(true)}
                      className="flex items-center gap-2.5 text-left group"
                      aria-label="แก้ไขหรือแต่งตัวอวตาร"
                    >
                      <AvatarCanvas
                        avatar={activeChild.avatar}
                        level={activeChild.level}
                        size="sm"
                      />
                      <div>
                        <div className="text-sm font-bold leading-tight text-white drop-shadow-sm">
                          {activeChild.name}
                        </div>
                        <div className="text-[11px] font-medium text-white/90 tabular-nums">
                          Lv.{activeChild.level} · {activeChild.coins} เหรียญ
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleLogoutToLoginScreen}
                        aria-label="ออกจากระบบเพื่อเปลี่ยนผู้ใช้"
                        className="h-10 px-3 rounded-2xl bg-white/25 hover:bg-white/35 backdrop-blur-md flex items-center gap-1.5 text-xs font-bold text-white transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">สลับคน</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('parent')}
                        aria-label="ตั้งค่าและอนุมัติงานผู้ปกครอง"
                        className="w-10 h-10 rounded-2xl bg-white/25 hover:bg-white/35 backdrop-blur-md flex items-center justify-center transition-colors relative"
                      >
                        <Settings className="w-5 h-5 text-white" />
                        {pendingSubmissions.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                            {pendingSubmissions.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Parent-only quick child switcher strip on mobile */}
                  {parentUnlocked && (
                    <div className="flex items-center gap-1.5 mb-5 overflow-x-auto no-scrollbar lg:hidden">
                      {childrenList.map((c) => {
                        const selected = c.id === activeChild.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectChild(c)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                              selected
                                ? 'bg-white text-violet-700 shadow-sm'
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Age-Adapted Greeting Banner */}
                  <div className="mb-3 px-1">
                    <p className="text-base font-extrabold text-white drop-shadow-sm">
                      {lang.greeting(activeChild.name)}
                    </p>
                    <p className="text-xs font-medium text-white/85">
                      {lang.heroBadge}
                    </p>
                  </div>

                  {/* Centerpiece Circular Timer Ring */}
                  <ScreenTimeRing
                    limitMinutes={settings.screenTimeLimitMinutes}
                    activeChildName={activeChild.name}
                    screenTimeLabel={lang.screenTimeLabel}
                    choreTimerLabel={lang.choreTimerLabel}
                  />

                  {/* 4 Quick Category Rounded-Square Tiles matching Screenshot 1 */}
                  <div className="grid grid-cols-4 gap-2.5 mt-7">
                    {(
                      [
                        {
                          label: 'จัดระเบียบ',
                          cat: 'จัดระเบียบ' as const,
                          icon: 'toys' as const,
                        },
                        {
                          label: 'ความสะอาด',
                          cat: 'ความสะอาด' as const,
                          icon: 'broom' as const,
                        },
                        {
                          label: 'งานครัว',
                          cat: 'งานครัว' as const,
                          icon: 'table' as const,
                        },
                        {
                          label: 'ทั้งหมด',
                          cat: 'all' as const,
                          icon: 'pet' as const,
                        },
                      ] as const
                    ).map((tile) => (
                      <button
                        key={tile.label}
                        type="button"
                        onClick={() => {
                          setCategoryFilter(tile.cat);
                          setAgeFilter(activeChild.ageGroup);
                          setActiveTab('chores');
                        }}
                        className="flex flex-col items-center gap-1.5 group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-white/95 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center">
                          <ChoreIconBadge iconKey={tile.icon} size="sm" />
                        </div>
                        <span className="text-[11px] font-semibold text-white whitespace-nowrap">
                          {tile.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Curved White Lower Sheet: Last Activity */}
                <div className="bg-white rounded-t-[32px] -mt-4 relative px-5 pt-6 pb-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">
                      {lang.recentTitle}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setAgeFilter(activeChild.ageGroup);
                        setCategoryFilter('all');
                        setActiveTab('chores');
                      }}
                      className="text-xs font-bold text-violet-600 hover:text-violet-700"
                    >
                      ดูภารกิจทั้งหมด
                    </button>
                  </div>

                  {recentActivity.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      {lang.emptyActivity}
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {recentActivity.map((sub) => {
                        const progress =
                          sub.status === 'approved'
                            ? 100
                            : sub.status === 'pending'
                            ? 65
                            : 35;
                        return (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <ChoreIconBadge
                                iconKey={
                                  sub.category === 'งานครัว'
                                    ? 'table'
                                    : sub.category === 'ความสะอาด'
                                    ? 'broom'
                                    : 'toys'
                                }
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-800 truncate">
                                  {sub.choreTitle}
                                </p>
                                <div className="mt-1.5 h-1.5 w-full max-w-[140px] rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                                {sub.status === 'approved'
                                  ? `+${sub.totalCoinsAwarded}`
                                  : sub.status === 'pending'
                                  ? 'รอตรวจ'
                                  : 'ปรับปรุง'}
                              </span>
                              {sub.status === 'approved' && (
                                <span className="text-[11px] text-slate-400 ml-1">
                                  เหรียญ
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Your Aims + Sports Medal Podium + Positive Tip + Chart.js Overview */}
              <div className="lg:col-span-7 space-y-5">
                {/* Your Aims Header */}
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {lang.aimsTitle(activeChild.name)}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setAvatarWorkshopOpen(true)}
                    className="text-xs font-bold text-violet-600 hover:text-violet-700"
                  >
                    ตกแต่งอวตาร
                  </button>
                </div>

                {/* Horizontal Pastel Gradient Aim Cards matching Screenshot 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="aim-card-pink rounded-3xl p-4 text-white shadow-md flex flex-col justify-between min-h-[152px]">
                    <div className="flex items-start justify-between">
                      <AimCardIllustration variant="coins" />
                      <span className="text-xs font-bold bg-white/25 px-2.5 py-1 rounded-full tabular-nums">
                        +{todayCoinsEarned} วันนี้
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-bold">{lang.aimTodayTitle}</p>
                      <p className="text-xs text-white/90 tabular-nums mt-0.5">
                        ทำแล้ว {todayChildSubmissions.length}/
                        {activeChild.dailyCap} งาน
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (todayChildSubmissions.length /
                                activeChild.dailyCap) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="aim-card-violet rounded-3xl p-4 text-white shadow-md flex flex-col justify-between min-h-[152px]">
                    <div className="flex items-start justify-between">
                      <AimCardIllustration variant="streak" />
                      <span className="text-xs font-bold bg-white/25 px-2.5 py-1 rounded-full tabular-nums">
                        {activeChild.streakDays} วันติด
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-bold">{lang.aimStreakTitle}</p>
                      <p className="text-xs text-white/90 tabular-nums mt-0.5">
                        สะสมทั้งหมด {activeChild.coins} เหรียญ
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{
                            width: `${Math.min(
                              100,
                              (activeChild.streakDays / 7) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAvatarWorkshopOpen(true)}
                    className="aim-card-sky rounded-3xl p-4 text-white shadow-md flex flex-col justify-between min-h-[152px] text-left hover:scale-[1.01] transition-transform"
                  >
                    <div className="flex items-start justify-between w-full">
                      <AimCardIllustration variant="avatar" />
                      <span className="text-xs font-bold bg-white/25 px-2.5 py-1 rounded-full tabular-nums">
                        Lv.{activeChild.level}
                      </span>
                    </div>
                    <div className="mt-3 w-full">
                      <p className="text-sm font-bold">{lang.aimAvatarTitle}</p>
                      <p className="text-xs text-white/90 tabular-nums mt-0.5">
                        XP {xpIntoLevel}/100 สู่เลเวลถัดไป
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{ width: `${xpIntoLevel}%` }}
                        />
                      </div>
                    </div>
                  </button>
                </div>

                {/* Top 1, 2, 3 Sports Medal Podium */}
                <FamilyPodium
                  childrenList={childrenList}
                  activeChildId={activeChild.id}
                  subtitle={lang.podiumSubtitle}
                  onSelectChild={(child) => {
                    if (parentUnlocked) {
                      handleSelectChild(child);
                    } else if (child.id !== activeChild.id) {
                      toastEncouragement(
                        `สลับไปที่บัญชีของ ${child.name}?`,
                        'กดปุ่ม "สลับคน / ออกจากระบบ" เพื่อเลือกตัวการ์ตูนและใส่รหัส PIN 4 หลักของตัวเองได้เลย'
                      );
                    }
                  }}
                />

                {/* Positive Psychology Tip Banner matching Screenshot 1 */}
                {showTipBanner && (
                  <div className="rounded-3xl bg-white/90 shadow-[0_8px_24px_rgba(110,120,190,0.08)] p-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setTipIndex(
                          (i) =>
                            (i + 1) %
                            (lang.tips.length + POSITIVE_TIPS.length)
                        )
                      }
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5" />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {[...lang.tips, ...POSITIVE_TIPS][
                          tipIndex % (lang.tips.length + POSITIVE_TIPS.length)
                        ]}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTipBanner(false)}
                      aria-label="ซ่อนคำแนะนำ"
                      className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Chart.js Overview Spline Chart */}
                <OverviewChart
                  submissions={submissions}
                  activeChildId={activeChild.id}
                />
              </div>
            </div>
          )}

          {/* TAB 2: CHORES LIST VIEW (Matches Screenshot 2 Left: Documents/Tasks Style) */}
          {activeTab === 'chores' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    {lang.choresPageTitle}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    {lang.choresPageSubtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAddChoreOpen(true)}
                  className="h-11 px-4 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/20 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มภารกิจใหม่</span>
                </button>
              </div>

              {/* Search Bar & Age Group Filters */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                <div className="lg:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={choreSearch}
                    onChange={(e) => setChoreSearch(e.target.value)}
                    placeholder="ค้นหาภารกิจงานบ้าน..."
                    className="w-full h-11 pl-11 pr-4 rounded-2xl bg-white/90 shadow-sm text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>

                <div className="lg:col-span-7 flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-white/75 rounded-2xl shadow-sm">
                  {(
                    [
                      { id: 'all', label: 'ทุกช่วงวัย' },
                      { id: '3-5', label: '3-5 ปี' },
                      { id: '6-9', label: '6-9 ปี' },
                      { id: '10-12', label: '10-12 ปี' },
                    ] as const
                  ).map((tab) => {
                    const active = ageFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAgeFilter(tab.id)}
                        className={`flex-1 min-w-[78px] py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          active
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Anti-Burnout Daily Cap Notice */}
              <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck
                    className={`w-5 h-5 shrink-0 ${
                      isDailyCapReached ? 'text-emerald-600' : 'text-violet-600'
                    }`}
                  />
                  <div className="text-xs sm:text-sm">
                    <span className="font-bold text-slate-900">
                      {activeChild.name}: ทำภารกิจวันนี้แล้ว{' '}
                      <span className="tabular-nums">
                        {todayChildSubmissions.length}/{activeChild.dailyCap}
                      </span>{' '}
                      งาน
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isDailyCapReached
                        ? lang.capReachedBody(activeChild.name, activeChild.dailyCap)
                        : AGE_GROUP_INFO[
                            ageFilter === 'all'
                              ? activeChild.ageGroup
                              : ageFilter
                          ].focus}
                    </p>
                  </div>
                </div>

                {categoryFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className="text-xs font-bold text-violet-600 hover:underline whitespace-nowrap self-start sm:self-center"
                  >
                    ล้างตัวกรองหมวด ({categoryFilter})
                  </button>
                )}
              </div>

              {/* Frosted Chore Cards matching Screenshot 2 Left */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredChores.map((chore) => {
                  const existingToday = todayChildSubmissions.find(
                    (s) => s.choreId === chore.id
                  );

                  return (
                    <div
                      key={chore.id}
                      className="glass-card rounded-3xl p-5 flex flex-col justify-between gap-4 hover:shadow-lg transition-shadow"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-violet-700">
                              {chore.category}
                            </span>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-slate-500">
                              {AGE_GROUP_INFO[chore.ageGroup].shortLabel}
                            </span>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-slate-500 tabular-nums">
                              ~{chore.estimatedMinutes} นาที
                            </span>
                          </div>

                          {chore.deadlineTime && (
                            <div className="flex items-center gap-1 text-xs font-bold text-sky-700 tabular-nums shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                              <span>ก่อน {chore.deadlineTime}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start gap-3.5">
                          <ChoreIconBadge iconKey={chore.iconKey} />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-slate-900 leading-snug">
                              {chore.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {chore.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 tabular-nums">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <span>{chore.baseCoins} เหรียญ</span>
                          {chore.timeBonusCoins > 0 && (
                            <span className="text-violet-600">
                              (+{chore.timeBonusCoins} ตรงเวลา)
                            </span>
                          )}
                        </div>

                        {existingToday ? (
                          <span
                            className={`text-xs font-bold flex items-center gap-1 ${
                              existingToday.status === 'approved'
                                ? 'text-emerald-600'
                                : existingToday.status === 'pending'
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {existingToday.status === 'approved'
                                ? 'รับเหรียญแล้ววันนี้'
                                : existingToday.status === 'pending'
                                ? 'รอผู้ปกครองตรวจ'
                                : 'ส่งใหม่อีกครั้ง'}
                            </span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isDailyCapReached}
                            onClick={() => setSubmittingChore(chore)}
                            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                              isDailyCapReached
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-sky-400 to-violet-500 text-white shadow-sm hover:opacity-95 active:scale-[0.98]'
                            }`}
                          >
                            {isDailyCapReached
                              ? 'ครบโควตาวันนี้'
                              : lang.submitCta}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CALENDAR & REWARDS VIEW */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  ตารางกิจวัตร & รางวัลครอบครัว
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  ติดตามประวัติความสม่ำเสมอรายวัน และนำเหรียญมาแลกช่วงเวลาดีๆ ร่วมกัน
                </p>
              </div>
              <CalendarRewardsView
                activeChild={activeChild}
                submissions={submissions}
                rewards={rewards}
                onRedeemReward={(reward) => handleRedeemReward(reward)}
                onOpenAvatarWorkshop={() => setAvatarWorkshopOpen(true)}
              />
            </div>
          )}

          {/* TAB 3b: REWARDS EXCHANGE VIEW */}
          {activeTab === 'rewards' && (
            <RewardsExchangeView
              activeChild={activeChild}
              rewards={rewards}
              redemptions={redemptions}
              onRedeemReward={(reward) => handleRedeemReward(reward)}
              onGoToParentRedeem={() => setActiveTab('parent')}
            />
          )}

          {/* TAB 4: PARENT APPROVAL & SETTINGS HUB */}
          {activeTab === 'parent' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    ศูนย์ดูแลของผู้ปกครอง
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    ตรวจรูปถ่ายให้ดาวคุณภาพ ตั้งค่าเวลาหน้าจอ ซิงค์ Google Sheets และแจ้งเตือน Telegram
                  </p>
                </div>

                {parentUnlocked && (
                  <button
                    type="button"
                    onClick={() => setParentUnlocked(false)}
                    className="h-10 px-4 rounded-2xl bg-white/90 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm self-start sm:self-center"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>ล็อกโหมดผู้ปกครอง</span>
                  </button>
                )}
              </div>

              {!parentUnlocked ? (
                <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-md mx-auto text-center space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto">
                    <Lock className="w-7 h-7" />
                  </div>
                  <PinKeypad
                    title="กรุณายืนยันรหัสผู้ปกครอง 4 หลัก"
                    subtitle="เพื่อความปลอดภัยของการอนุมัติเหรียญและการตั้งค่าระบบ"
                    expectedPin={settings.parentPin}
                    onSuccess={() => setParentUnlocked(true)}
                  />
                </div>
              ) : (
                <>
                  {/* Pending Photo Proof Approval Queue */}
                  <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          งานบ้านรอตรวจอนุมัติ ({pendingSubmissions.length})
                        </h2>
                      </div>
                    </div>

                    {pendingSubmissions.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                        ตรวจงานครบทุกรายการแล้ว! เมื่อเด็กๆ ส่งรูปผลงานใหม่ จะมาแสดงที่นี่ทันที
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingSubmissions.map((sub) => (
                          <div
                            key={sub.id}
                            className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-col sm:flex-row gap-4 justify-between"
                          >
                            <div className="flex gap-3 min-w-0">
                              {sub.photoDataUrl ? (
                                <img
                                  src={sub.photoDataUrl}
                                  alt={sub.choreTitle}
                                  className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-100"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0 text-violet-500 text-xs font-bold text-center p-2">
                                  ไม่มีรูปแนบ
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-violet-600">
                                  {sub.childName} ·{' '}
                                  {AGE_GROUP_INFO[sub.ageGroup].shortLabel}
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                                  {sub.choreTitle}
                                </h3>
                                {sub.childNote && (
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                    "{sub.childNote}"
                                  </p>
                                )}
                                <div className="text-xs font-semibold text-amber-700 mt-1.5 tabular-nums">
                                  {sub.baseCoins} เหรียญ
                                  {sub.onTime && sub.timeBonusCoins > 0
                                    ? ` + ${sub.timeBonusCoins} โบนัสตรงเวลา`
                                    : ''}
                                </div>
                                {sub.driveWebViewLink && (
                                  <a
                                    href={sub.driveWebViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline mt-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>บันทึกใน Google Drive แล้ว</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setReviewingSubmission(sub)}
                              className="h-11 px-4 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 text-white text-xs font-bold whitespace-nowrap self-end sm:self-center shadow-sm"
                            >
                              ตรวจและให้ดาว
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Family Children CRUD Management */}
                  <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          จัดการโปรไฟล์ลูกในครอบครัว ({childrenList.length} คน)
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          เพิ่ม แก้ไข หรือลบข้อมูลเด็ก ปรับช่วงวัย โควตางานต่อวัน และยอดเหรียญ
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingChild(null);
                          setChildFormOpen(true);
                        }}
                        className="h-10 px-4 rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap self-start sm:self-center"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>เพิ่มโปรไฟล์ลูก</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {childrenList.map((child) => (
                        <div
                          key={child.id}
                          className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-center gap-3.5">
                            <AvatarCanvas
                              avatar={child.avatar}
                              level={child.level}
                              size="md"
                            />
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-slate-900 truncate">
                                {child.name} ({child.age} ขวบ)
                              </h3>
                              <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                                {AGE_GROUP_INFO[child.ageGroup].shortLabel} · Lv.
                                {child.level}
                              </p>
                              <p className="text-xs font-bold text-violet-700 tabular-nums mt-0.5">
                                {child.coins} เหรียญ · โควตา {child.dailyCap} งาน/วัน
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChild(child);
                                setChildFormOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>แก้ไข</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChild(child)}
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

                  {/* Parent Reward Rules CRUD & Coin Redemption Counter */}
                  <ParentRewardsHub
                    childrenList={childrenList}
                    rewards={rewards}
                    redemptions={redemptions}
                    defaultChildId={activeChild.id}
                    onAddReward={() => {
                      setEditingReward(null);
                      setRewardFormOpen(true);
                    }}
                    onEditReward={(reward) => {
                      setEditingReward(reward);
                      setRewardFormOpen(true);
                    }}
                    onDeleteReward={handleDeleteReward}
                    onParentRedeem={(childId, reward, note) =>
                      handleRedeemReward(reward, childId, true, note)
                    }
                  />

                  {/* Google Sheets + Google Drive + Telegram + Behavioral Safeguards Panel */}
                  <ParentSettingsPanel
                    childrenList={childrenList}
                    settings={settings}
                    googleServerStatus={googleServerStatus}
                    isSyncingSheets={isSyncingSheets}
                    lastSyncedAt={lastSyncedAt}
                    pendingDrivePhotoCount={pendingDrivePhotos.length}
                    isUploadingDrive={isUploadingDrive}
                    serverTelegramConfigured={serverTelegramConfigured}
                    onLoadFromSheets={handleLoadFromSheets}
                    onRequestSyncToSheets={() => setSheetsConfirmOpen(true)}
                    onVerifyDriveFolder={handleVerifyDriveFolder}
                    onBatchUploadDrivePhotos={handleBatchUploadDrivePhotos}
                    onUpdateSettings={setSettings}
                    onUpdateChildDailyCap={(childId, cap) =>
                      setChildrenList((prev) =>
                        prev.map((c) =>
                          c.id === childId ? { ...c, dailyCap: cap } : c
                        )
                      )
                    }
                    onTestTelegram={handleTestTelegram}
                    onResetAllData={handleResetAllData}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Fixed Bottom Tab Bar (Matches Screenshot 2, <=15% viewport height) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md rounded-t-3xl shadow-[0_-6px_28px_rgba(95,105,195,0.12)] border-t border-slate-100"
        aria-label="แถบนำทางมือถือ"
      >
        <div className="grid grid-cols-5 items-center h-16 pb-safe px-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                  active ? 'text-violet-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] font-bold mt-0.5 whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      <SubmitChoreModal
        chore={submittingChore}
        child={activeChild}
        driveFolderId={settings.driveFolderId}
        defaultSaveToDrive={settings.autoUploadDrivePhotos}
        onClose={() => setSubmittingChore(null)}
        onSubmit={handleSubmitChore}
      />

      <ParentApprovalModal
        submission={reviewingSubmission}
        onClose={() => setReviewingSubmission(null)}
        onApprove={handleApproveSubmission}
        onRequestRetry={handleRequestRetry}
        onUploadToDrive={handleUploadSubmissionToDrive}
      />

      <AvatarWorkshopModal
        open={avatarWorkshopOpen}
        child={activeChild}
        onClose={() => setAvatarWorkshopOpen(false)}
        onUpdateAvatar={handleUpdateAvatar}
      />

      <AddChoreModal
        open={addChoreOpen}
        defaultAgeGroup={
          ageFilter === 'all' ? activeChild.ageGroup : ageFilter
        }
        onClose={() => setAddChoreOpen(false)}
        onAdd={handleAddChore}
      />

      <ChildFormModal
        open={childFormOpen}
        editingChild={editingChild}
        onClose={() => {
          setChildFormOpen(false);
          setEditingChild(null);
        }}
        onSave={handleSaveChild}
      />

      <RewardFormModal
        open={rewardFormOpen}
        editingReward={editingReward}
        onClose={() => {
          setRewardFormOpen(false);
          setEditingReward(null);
        }}
        onSave={handleSaveReward}
      />

      <SheetsConfirmModal
        open={sheetsConfirmOpen}
        spreadsheetId={settings.spreadsheetId}
        summaryLines={[
          `KidQuest_Children: โปรไฟล์เด็ก ${childrenList.length} คน (เหรียญ, เลเวล, อวตาร)`,
          `KidQuest_Chores: รายการภารกิจงานบ้าน ${chores.length} รายการ`,
          `KidQuest_Submissions: ประวัติการส่งและตรวจงาน ${submissions.length} รายการ`,
          `KidQuest_Rewards: เกณฑ์แลกของรางวัล ${rewards.length} รายการ`,
          `KidQuest_Redemptions: ประวัติการแลกเหรียญ ${redemptions.length} รายการ`,
        ]}
        onCancel={() => setSheetsConfirmOpen(false)}
        onConfirm={handleConfirmSyncToSheets}
      />
    </div>
  );
}
