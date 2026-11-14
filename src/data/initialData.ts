import {
  AgeGroup,
  AppSettings,
  AvatarAccessory,
  AvatarCharacter,
  ChildProfile,
  ChoreItem,
  ChoreSubmission,
  FamilyReward,
  RewardCategory,
} from '../types';

export const DEFAULT_SPREADSHEET_ID = '10tp-V420fQeYGxfnYoNCRURqF9OPxRkG2tQsm2vht7w';
export const DEFAULT_DRIVE_FOLDER_ID = '11ntO9X4OFZXRSa33QjGQfSBf2eS0gzTF';
export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycby8OdFmdAts1OxFgJi7fktbcbB5_6VHOPXzPBcDSKmpPzlbD2C07IN7dv8l6VQyvrA/exec';

export const AGE_GROUP_INFO: Record<
  AgeGroup,
  { label: string; shortLabel: string; focus: string; defaultCap: number }
> = {
  '3-5': {
    label: 'อายุ 3-5 ปี (อนุบาล)',
    shortLabel: '3-5 ปี',
    focus: 'การเลียนแบบ กล้ามเนื้อมัดเล็ก และการมีส่วนร่วมขั้นพื้นฐาน',
    defaultCap: 3,
  },
  '6-9': {
    label: 'อายุ 6-9 ปี (ประถมต้น)',
    shortLabel: '6-9 ปี',
    focus: 'การสร้างนิสัย ความรับผิดชอบส่วนบุคคล และการพึ่งพาตนเองเบื้องต้น',
    defaultCap: 4,
  },
  '10-12': {
    label: 'อายุ 10-12 ปี (ประถมปลาย)',
    shortLabel: '10-12 ปี',
    focus: 'การจัดการงานที่ซับซ้อน การมีส่วนร่วมดูแลบ้าน และการบริหารเวลา',
    defaultCap: 5,
  },
};

export const QUALITY_TIERS: Record<
  1 | 2 | 3,
  { stars: 1 | 2 | 3; label: string; multiplier: number; encouragement: string }
> = {
  1: {
    stars: 1,
    label: 'พยายามได้ดีมาก',
    multiplier: 1.0,
    encouragement: 'ขอบคุณที่ลงมือทำด้วยตัวเองนะ วันพรุ่งนี้ค่อยๆ ฝึกให้เรียบร้อยขึ้นอีกนิดได้จ้ะ',
  },
  2: {
    stars: 2,
    label: 'เรียบร้อยน่าชื่นชม',
    multiplier: 1.25,
    encouragement: 'ทำได้สะอาดและตั้งใจมากเลย ครอบครัวภูมิใจในความรับผิดชอบของหนูนะ',
  },
  3: {
    stars: 3,
    label: 'ยอดเยี่ยมประณีตสุดๆ',
    multiplier: 1.5,
    encouragement: 'ใส่ใจรายละเอียดทุกจุดเลย! พลังความพยายามของหนูทำให้บ้านน่าอยู่ขึ้นมากๆ',
  },
};

export const AVATAR_CHARACTERS: { id: AvatarCharacter; name: string; minLevel: number }[] = [
  { id: 'fox', name: 'จิ้งจอกน้อย', minLevel: 1 },
  { id: 'bunny', name: 'กระต่ายน้อย', minLevel: 1 },
  { id: 'bear', name: 'หมีน้อยอบอุ่น', minLevel: 1 },
  { id: 'cat', name: 'แมวน้อยช่างสำรวจ', minLevel: 1 },
  { id: 'panda', name: 'แพนด้าน้อยใจดี', minLevel: 1 },
  { id: 'dino', name: 'ไดโนเสาร์ร่าเริง', minLevel: 2 },
  { id: 'unicorn', name: 'ยูนิคอร์นวิเศษ', minLevel: 2 },
  { id: 'astronaut', name: 'นักบินอวกาศ', minLevel: 3 },
];

export const AVATAR_ACCESSORIES: {
  id: AvatarAccessory;
  name: string;
  cost: number;
  minLevel: number;
  category: 'ศีรษะ' | 'แว่นตา' | 'ชุดและปีก';
}[] = [
  { id: 'none', name: 'ไม่สวมไอเทม', cost: 0, minLevel: 1, category: 'ศีรษะ' },
  { id: 'flower', name: 'กิ๊บดอกไม้สดใส', cost: 20, minLevel: 1, category: 'ศีรษะ' },
  { id: 'ribbon', name: 'โบว์พาสเทลน่ารัก', cost: 25, minLevel: 1, category: 'ศีรษะ' },
  { id: 'cap', name: 'หมวกแก๊ปนักผจญภัย', cost: 30, minLevel: 1, category: 'ศีรษะ' },
  { id: 'scarf', name: 'ผ้าพันคออบอุ่น', cost: 35, minLevel: 1, category: 'ชุดและปีก' },
  { id: 'headphones', name: 'หูฟังจังหวะสนุก', cost: 40, minLevel: 1, category: 'ศีรษะ' },
  { id: 'glasses', name: 'แว่นตานักอ่านกลม', cost: 45, minLevel: 1, category: 'แว่นตา' },
  { id: 'beanie', name: 'หมวกไหมพรมแสนซน', cost: 50, minLevel: 1, category: 'ศีรษะ' },
  { id: 'sunglasses', name: 'แว่นตาดาวสุดเท่', cost: 55, minLevel: 2, category: 'แว่นตา' },
  { id: 'medal', name: 'เหรียญทองผู้ช่วยบ้าน', cost: 65, minLevel: 2, category: 'ชุดและปีก' },
  { id: 'beret', name: 'หมวกเบเร่ต์ศิลปิน', cost: 70, minLevel: 2, category: 'ศีรษะ' },
  { id: 'wizard', name: 'หมวกพ่อมดนักจัดบ้าน', cost: 80, minLevel: 2, category: 'ศีรษะ' },
  { id: 'star_antenna', name: 'ที่คาดผมดาวประกาย', cost: 90, minLevel: 2, category: 'ศีรษะ' },
  { id: 'wings', name: 'ปีกนางฟ้าพาสเทล', cost: 100, minLevel: 3, category: 'ชุดและปีก' },
  { id: 'cape', name: 'ผ้าคลุมผู้พิทักษ์บ้าน', cost: 110, minLevel: 3, category: 'ชุดและปีก' },
  { id: 'halo', name: 'วงแหวนแสงแห่งความดี', cost: 130, minLevel: 3, category: 'ศีรษะ' },
  { id: 'crown', name: 'มงกุฎแห่งความรับผิดชอบ', cost: 150, minLevel: 4, category: 'ศีรษะ' },
];

export const AVATAR_AURAS: {
  id: ChildProfile['avatar']['auraStyle'];
  name: string;
  swatch: string;
}[] = [
  { id: 'sky', name: 'ท้องฟ้าสดใส', swatch: 'from-sky-300 to-indigo-200' },
  { id: 'lavender', name: 'ลาเวนเดอร์', swatch: 'from-purple-300 to-pink-200' },
  { id: 'sunset', name: 'แสงอาทิตย์อุ่น', swatch: 'from-amber-200 to-rose-200' },
  { id: 'mint', name: 'มินต์ธรรมชาติ', swatch: 'from-emerald-200 to-sky-200' },
  { id: 'galaxy', name: 'กาแล็กซี', swatch: 'from-indigo-400 to-fuchsia-300' },
];

export const OUTFIT_COLORS = [
  { name: 'ฟ้าท้องฟ้า', hex: '#59B4FF' },
  { name: 'ม่วงลาเวนเดอร์', hex: '#8B6EFF' },
  { name: 'ชมพูพาสเทล', hex: '#F07CE0' },
  { name: 'เขียวมินต์', hex: '#34D399' },
  { name: 'ส้มอบอุ่น', hex: '#FB923C' },
  { name: 'เหลืองเลมอน', hex: '#FBBF24' },
  { name: 'แดงคอรัล', hex: '#F43F5E' },
  { name: 'น้ำเงินคราม', hex: '#4F46E5' },
];

export const POSITIVE_TIPS = [
  'การชื่นชมที่ "ความพยายาม" มากกว่าผลลัพธ์ ช่วยให้เด็กมีกรอบความคิดแบบเติบโต (Growth Mindset) และกล้าลองทำสิ่งใหม่ๆ',
  'การจำกัดงานบ้านไม่เกินวันละ 3-5 อย่าง ช่วยป้องกันความเหนื่อยล้าและรักษาความสนุกในการช่วยครอบครัว',
  'แอปนี้ออกแบบให้บันทึกงานและตรวจผลอย่างรวดเร็ว เพื่อให้เด็กๆ มีเวลาออกไปเล่นและทำกิจกรรมนอกหน้าจอมากขึ้น',
  'เหรียญรางวัลเป็นจุดเริ่มต้นที่ดี และเมื่อทำร่วมกันสม่ำเสมอ เด็กจะค่อยๆ ภูมิใจที่ได้เป็นส่วนหนึ่งในการดูแลบ้าน',
];

export const INITIAL_CHILDREN: ChildProfile[] = [
  {
    id: 'child-mali',
    name: 'น้องมะลิ',
    age: 4,
    ageGroup: '3-5',
    pin: '1111',
    coins: 0,
    xp: 0,
    level: 1,
    dailyCap: 3,
    streakDays: 0,
    avatar: {
      character: 'bunny',
      accessory: 'none',
      outfitColor: '#F07CE0',
      auraStyle: 'lavender',
      unlockedAccessories: ['none'],
    },
  },
  {
    id: 'child-tonkla',
    name: 'น้องต้นกล้า',
    age: 8,
    ageGroup: '6-9',
    pin: '2222',
    coins: 0,
    xp: 0,
    level: 1,
    dailyCap: 4,
    streakDays: 0,
    avatar: {
      character: 'fox',
      accessory: 'none',
      outfitColor: '#59B4FF',
      auraStyle: 'sky',
      unlockedAccessories: ['none'],
    },
  },
  {
    id: 'child-phum',
    name: 'พี่ภูมิ',
    age: 11,
    ageGroup: '10-12',
    pin: '3333',
    coins: 0,
    xp: 0,
    level: 1,
    dailyCap: 5,
    streakDays: 0,
    avatar: {
      character: 'astronaut',
      accessory: 'none',
      outfitColor: '#8B6EFF',
      auraStyle: 'galaxy',
      unlockedAccessories: ['none'],
    },
  },
];

export const INITIAL_CHORES: ChoreItem[] = [
  // กลุ่มที่ 1: อายุ 3-5 ปี
  {
    id: 'chore-35-1',
    title: 'เก็บของเล่นและหนังสือเข้าที่',
    description: 'ชวนน้องหยิบของเล่นและนิทานกลับเข้าชั้นให้เป็นระเบียบหลังเล่นเสร็จ',
    ageGroup: '3-5',
    category: 'จัดระเบียบ',
    baseCoins: 10,
    timeBonusCoins: 5,
    deadlineTime: '19:30',
    estimatedMinutes: 10,
    iconKey: 'toys',
  },
  {
    id: 'chore-35-2',
    title: 'นำเสื้อผ้าใช้แล้วใส่ตะกร้าผ้า',
    description: 'ฝึกแยกผ้าที่ใช้แล้วใส่ตะกร้าผ้าใบเก่งด้วยตัวเอง',
    ageGroup: '3-5',
    category: 'จัดระเบียบ',
    baseCoins: 10,
    timeBonusCoins: 0,
    estimatedMinutes: 5,
    iconKey: 'laundry',
  },
  {
    id: 'chore-35-3',
    title: 'เช็ดคราบหกเลอะเทอะด้วยผ้าชุบน้ำ',
    description: 'ใช้ผ้าขนนุ่มเช็ดโต๊ะหรือพื้นเบาๆ เมื่อมีน้ำหรือขนมหก',
    ageGroup: '3-5',
    category: 'ความสะอาด',
    baseCoins: 15,
    timeBonusCoins: 0,
    estimatedMinutes: 5,
    iconKey: 'wipe',
  },
  {
    id: 'chore-35-4',
    title: 'ปัดฝุ่นพื้นผิวระดับต่ำด้วยไม้ปัดฝุ่น',
    description: 'สนุกกับการปัดฝุ่นชั้นวางของเตี้ยๆ ด้วยไม้ปัดฝุ่นหรือถุงเท้าขนนุ่ม',
    ageGroup: '3-5',
    category: 'ความสะอาด',
    baseCoins: 15,
    timeBonusCoins: 0,
    estimatedMinutes: 10,
    iconKey: 'dust',
  },
  {
    id: 'chore-35-5',
    title: 'ช่วยให้อาหารสัตว์เลี้ยง (ภายใต้การดูแล)',
    description: 'ตักอาหารและเติมน้ำให้เพื่อนตัวน้อยพร้อมคุณพ่อคุณแม่',
    ageGroup: '3-5',
    category: 'ดูแลสัตว์เลี้ยง',
    baseCoins: 15,
    timeBonusCoins: 5,
    deadlineTime: '18:00',
    estimatedMinutes: 5,
    iconKey: 'pet',
  },

  // กลุ่มที่ 2: อายุ 6-9 ปี
  {
    id: 'chore-69-1',
    title: 'จัดเตียงนอนของตนเองทุกวัน',
    description: 'พับผ้าห่มและวางหมอนให้เรียบร้อยหลังตื่นนอนตอนเช้า',
    ageGroup: '6-9',
    category: 'จัดระเบียบ',
    baseCoins: 15,
    timeBonusCoins: 5,
    deadlineTime: '08:30',
    estimatedMinutes: 5,
    iconKey: 'bed',
  },
  {
    id: 'chore-69-2',
    title: 'กวาดพื้นที่ส่วนกลางด้วยไม้กวาดขนาดเหมาะสม',
    description: 'ช่วยกวาดห้องนั่งเล่นหรือทางเดินให้สะอาดน่าเดิน',
    ageGroup: '6-9',
    category: 'ความสะอาด',
    baseCoins: 20,
    timeBonusCoins: 0,
    estimatedMinutes: 15,
    iconKey: 'broom',
  },
  {
    id: 'chore-69-3',
    title: 'จัดโต๊ะอาหารและเก็บจานหลังมื้ออาหาร',
    description: 'วางช้อนส้อมก่อนทานและช่วยรวบรวมจานไปวางที่อ่างล้างจานก่อน 20:00 น.',
    ageGroup: '6-9',
    category: 'งานครัว',
    baseCoins: 20,
    timeBonusCoins: 10,
    deadlineTime: '20:00',
    estimatedMinutes: 10,
    iconKey: 'table',
  },
  {
    id: 'chore-69-4',
    title: 'แยกประเภทเสื้อผ้าตามสี',
    description: 'แยกผ้าสีขาว ผ้าสีอ่อน และผ้าสีเข้มลงตะกร้าก่อนซัก',
    ageGroup: '6-9',
    category: 'จัดระเบียบ',
    baseCoins: 20,
    timeBonusCoins: 0,
    estimatedMinutes: 10,
    iconKey: 'sort',
  },
  {
    id: 'chore-69-5',
    title: 'เทถังขยะในห้องนอนและรวมไปถึงถังขยะหลัก',
    description: 'รวบรวมขยะจากห้องตัวเองไปรวมที่ถังขยะใหญ่ของบ้านพร้อมเปลี่ยนถุง',
    ageGroup: '6-9',
    category: 'ความสะอาด',
    baseCoins: 25,
    timeBonusCoins: 5,
    deadlineTime: '20:30',
    estimatedMinutes: 10,
    iconKey: 'trash',
  },

  // กลุ่มที่ 3: อายุ 10-12 ปี
  {
    id: 'chore-1012-1',
    title: 'ใช้งานเครื่องซักผ้าและพับผ้า',
    description: 'ตั้งโปรแกรมซักผ้าอย่างถูกต้องและพับผ้าที่แห้งแล้วเก็บเข้าตู้',
    ageGroup: '10-12',
    category: 'จัดระเบียบ',
    baseCoins: 35,
    timeBonusCoins: 10,
    deadlineTime: '19:00',
    estimatedMinutes: 25,
    iconKey: 'washer',
  },
  {
    id: 'chore-1012-2',
    title: 'ใส่และนำจานออกจากเครื่องล้างจาน',
    description: 'จัดเรียงจานชามเข้าเครื่องล้างจาน หรือเก็บจานที่แห้งสะอาดเข้าตู้',
    ageGroup: '10-12',
    category: 'งานครัว',
    baseCoins: 30,
    timeBonusCoins: 10,
    deadlineTime: '20:30',
    estimatedMinutes: 15,
    iconKey: 'dishes',
  },
  {
    id: 'chore-1012-3',
    title: 'ทำความสะอาดอ่างล้างหน้าและเคาน์เตอร์ในห้องน้ำ',
    description: 'เช็ดฟองสบู่ คราบน้ำ และจัดวางแปรงสีฟันให้สะอาดเรียบร้อย',
    ageGroup: '10-12',
    category: 'ความสะอาด',
    baseCoins: 35,
    timeBonusCoins: 0,
    estimatedMinutes: 15,
    iconKey: 'sink',
  },
  {
    id: 'chore-1012-4',
    title: 'เตรียมอาหารว่างหรือมื้ออาหารง่ายๆ ได้ด้วยตนเอง',
    description: 'ทำแซนด์วิช ผลไม้หั่น หรืออาหารว่างเพื่อสุขภาพให้ตัวเองและน้องๆ',
    ageGroup: '10-12',
    category: 'งานครัว',
    baseCoins: 30,
    timeBonusCoins: 0,
    estimatedMinutes: 20,
    iconKey: 'snack',
  },
  {
    id: 'chore-1012-5',
    title: 'นำขยะและถังรีไซเคิลใบใหญ่ออกไปทิ้ง',
    description: 'แยกขยะรีไซเคิลและมัดถุงขยะใหญ่ไปวางจุดรับขยะก่อน 20:00 น.',
    ageGroup: '10-12',
    category: 'ความสะอาด',
    baseCoins: 35,
    timeBonusCoins: 10,
    deadlineTime: '20:00',
    estimatedMinutes: 15,
    iconKey: 'recycle',
  },
];

export const REWARD_CATEGORIES: {
  id: RewardCategory;
  label: string;
  badgeClass: string;
}[] = [
  {
    id: 'เงินค่าขนม',
    label: 'เงินค่าขนม',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    id: 'ของขวัญ',
    label: 'ของขวัญ',
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-100',
  },
  {
    id: 'สิ่งที่อยากได้',
    label: 'สิ่งที่อยากได้',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    id: 'เวลาครอบครัว',
    label: 'เวลาครอบครัว',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  {
    id: 'กิจกรรมพิเศษ',
    label: 'กิจกรรมพิเศษ',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  {
    id: 'สิทธิ์เลือกเมนู',
    label: 'สิทธิ์เลือกเมนู',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
];

export const INITIAL_REWARDS: FamilyReward[] = [
  {
    id: 'rew-money-1',
    title: 'เงินค่าขนมพิเศษ 20 บาท',
    description: 'นำเหรียญมาแลกเงินค่าขนมกับคุณพ่อคุณแม่ เพื่อฝึกออมหรือซื้อขนมที่ชอบ',
    cost: 40,
    category: 'เงินค่าขนม',
  },
  {
    id: 'rew-money-2',
    title: 'เงินค่าขนมเพิ่ม 50 บาท',
    description: 'สะสมแต้มครบตามเป้าหมาย แลกรับค่าขนมพิเศษเพิ่มเติมได้เลย',
    cost: 90,
    category: 'เงินค่าขนม',
  },
  {
    id: 'rew-gift-1',
    title: 'กล่องของขวัญเซอร์ไพรส์ / เครื่องเขียนน่ารัก',
    description: 'เลือกรับของขวัญเล็กๆ แทนคำขอบคุณในความรับผิดชอบของหนู',
    cost: 120,
    category: 'ของขวัญ',
  },
  {
    id: 'rew-wish-1',
    title: 'สิ่งที่อยากได้ในรายการ Wishlist (ไม่เกิน 200 บาท)',
    description: 'แลกสิทธิ์เลือกของเล่น หนังสือ หรือของที่อยากได้ตามที่ตกลงกับผู้ปกครอง',
    cost: 180,
    category: 'สิ่งที่อยากได้',
  },
  {
    id: 'rew-1',
    title: 'เลือกเมนูอาหารเย็นประจำวันศุกร์',
    description: 'รับสิทธิ์เลือกเมนูพิเศษหรือร้านโปรดสำหรับมื้อค่ำครอบครัว',
    cost: 60,
    category: 'สิทธิ์เลือกเมนู',
  },
  {
    id: 'rew-2',
    title: 'ปิกนิกและปั่นจักรยานที่สวนสาธารณะ',
    description: 'ใช้เวลาคุณภาพนอกหน้าจอร่วมกับคุณพ่อคุณแม่ในช่วงสุดสัปดาห์',
    cost: 100,
    category: 'เวลาครอบครัว',
  },
  {
    id: 'rew-3',
    title: 'คืนดูภาพยนตร์ครอบครัว + ป๊อปคอร์นโฮมเมด',
    description: 'เลือกหนังการ์ตูนหรือหนังผจญภัย 1 เรื่องดูพร้อมกันทั้งบ้าน',
    cost: 80,
    category: 'เวลาครอบครัว',
  },
  {
    id: 'rew-4',
    title: 'กิจกรรมศิลปะหรือต่อเลโก้ชุดใหม่',
    description: 'แลกรับอุปกรณ์งานประดิษฐ์หรืองบสมทบของเล่นเสริมพัฒนาการ',
    cost: 150,
    category: 'กิจกรรมพิเศษ',
  },
];

export function formatDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const INITIAL_SUBMISSIONS: ChoreSubmission[] = [];

export const INITIAL_SETTINGS: AppSettings = {
  spreadsheetId: DEFAULT_SPREADSHEET_ID,
  driveFolderId: DEFAULT_DRIVE_FOLDER_ID,
  autoUploadDrivePhotos: true,
  screenTimeLimitMinutes: 15,
  parentPin: '1234',
  telegram: {
    token: '',
    chatId: '',
    notifyOnSubmit: true,
  },
};
