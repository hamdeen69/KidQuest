export type AgeGroup = '3-5' | '6-9' | '10-12';

export type ChoreCategory =
  | 'ความสะอาด'
  | 'จัดระเบียบ'
  | 'งานครัว'
  | 'ดูแลสัตว์เลี้ยง';

export type AvatarCharacter =
  | 'fox'
  | 'bunny'
  | 'bear'
  | 'astronaut'
  | 'dino'
  | 'cat'
  | 'panda'
  | 'unicorn';

export type AvatarAccessory =
  | 'none'
  | 'crown'
  | 'headphones'
  | 'flower'
  | 'wizard'
  | 'sunglasses'
  | 'cape'
  | 'ribbon'
  | 'cap'
  | 'beanie'
  | 'glasses'
  | 'halo'
  | 'wings'
  | 'scarf'
  | 'medal'
  | 'beret'
  | 'star_antenna';

export interface AvatarConfig {
  character: AvatarCharacter;
  accessory: AvatarAccessory;
  outfitColor: string;
  auraStyle: 'sky' | 'lavender' | 'sunset' | 'mint' | 'galaxy';
  unlockedAccessories: AvatarAccessory[];
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  ageGroup: AgeGroup;
  pin: string;
  coins: number;
  xp: number;
  level: number;
  dailyCap: number;
  streakDays: number;
  avatar: AvatarConfig;
}

export interface ChoreItem {
  id: string;
  title: string;
  description: string;
  ageGroup: AgeGroup;
  category: ChoreCategory;
  baseCoins: number;
  timeBonusCoins: number;
  deadlineTime?: string; // e.g. "20:00"
  estimatedMinutes: number;
  iconKey:
    | 'toys'
    | 'laundry'
    | 'wipe'
    | 'dust'
    | 'pet'
    | 'bed'
    | 'broom'
    | 'table'
    | 'sort'
    | 'trash'
    | 'washer'
    | 'dishes'
    | 'sink'
    | 'snack'
    | 'recycle';
  isCustom?: boolean;
}

export type SubmissionStatus = 'pending' | 'approved' | 'needs_retry';

export interface ChoreSubmission {
  id: string;
  choreId: string;
  choreTitle: string;
  category: ChoreCategory;
  childId: string;
  childName: string;
  ageGroup: AgeGroup;
  submittedAt: string; // ISO string
  dateKey: string; // YYYY-MM-DD
  status: SubmissionStatus;
  photoDataUrl?: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  childNote?: string;
  onTime: boolean;
  baseCoins: number;
  timeBonusCoins: number;
  qualityStars?: 1 | 2 | 3;
  multiplier?: number;
  totalCoinsAwarded?: number;
  parentNote?: string;
  reviewedAt?: string;
}

export type RewardCategory =
  | 'เงินค่าขนม'
  | 'ของขวัญ'
  | 'สิ่งที่อยากได้'
  | 'เวลาครอบครัว'
  | 'กิจกรรมพิเศษ'
  | 'สิทธิ์เลือกเมนู';

export interface FamilyReward {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: RewardCategory;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  rewardTitle: string;
  rewardCategory: RewardCategory;
  childId: string;
  childName: string;
  cost: number;
  coinsBefore: number;
  coinsAfter: number;
  redeemedByParent: boolean;
  note?: string;
  redeemedAt: string;
}

export interface TelegramSettings {
  token: string;
  chatId: string;
  notifyOnSubmit: boolean;
}

export interface AppSettings {
  spreadsheetId: string;
  driveFolderId: string;
  autoUploadDrivePhotos: boolean;
  screenTimeLimitMinutes: number;
  parentPin: string;
  telegram: TelegramSettings;
}

export type MainTab = 'home' | 'chores' | 'calendar' | 'rewards' | 'parent';
