import { AgeGroup } from '../types';

export interface AgeLanguagePack {
  greeting: (name: string) => string;
  heroBadge: string;
  screenTimeLabel: string;
  choreTimerLabel: string;
  recentTitle: string;
  emptyActivity: string;
  aimsTitle: (name: string) => string;
  aimTodayTitle: string;
  aimStreakTitle: string;
  aimAvatarTitle: string;
  choresPageTitle: string;
  choresPageSubtitle: string;
  submitCta: string;
  submitModalTitle: string;
  submitPhotoPrompt: string;
  submitNotePlaceholder: string;
  capReachedTitle: string;
  capReachedBody: (name: string, cap: number) => string;
  submitSuccessTitle: string;
  submitSuccessBody: (name: string) => string;
  podiumSubtitle: string;
  tips: string[];
}

export const AGE_LANGUAGE_PACK: Record<AgeGroup, AgeLanguagePack> = {
  '3-5': {
    greeting: (name) => `สวัสดีจ้ะ ${name} คนเก่ง!`,
    heroBadge: 'ภารกิจตัวน้อยแสนสนุก',
    screenTimeLabel: 'พักสายตาแป๊บนึงนะ',
    choreTimerLabel: 'เล่นช่วยบ้านกันเถอะ',
    recentTitle: 'สิ่งที่หนูทำไปเมื่อกี้',
    emptyActivity: 'มาเลือกภารกิจแรกช่วยคุณพ่อคุณแม่กันเถอะ!',
    aimsTitle: (name) => `ดาวความเก่งของ${name}`,
    aimTodayTitle: 'ภารกิจสนุกวันนี้',
    aimStreakTitle: 'ทำเก่งต่อเนื่อง',
    aimAvatarTitle: 'เพื่อนอวตารของหนู',
    choresPageTitle: 'ภารกิจตัวน้อยช่วยบ้าน',
    choresPageSubtitle: 'หยิบจับทีละนิด ฝึกกล้ามเนื้อมือและช่วยกันสนุกๆ นะจ๊ะ',
    submitCta: 'ทำเสร็จแล้ว ถ่ายรูป!',
    submitModalTitle: 'อวดรูปเก่งๆ ให้คุณพ่อคุณแม่ดู',
    submitPhotoPrompt: 'ถ่ายรูปตอนเก็บของเรียบร้อยแล้วกันเลย!',
    submitNotePlaceholder: 'เช่น หนูเก็บตุ๊กตาเข้ากล่องครบแล้วค่ะ',
    capReachedTitle: 'วันนี้หนูเก่งมากๆ แล้วนะ!',
    capReachedBody: (name, cap) =>
      `${name} ช่วยงานครบ ${cap} อย่างแล้ว พักผ่อนไปวิ่งเล่นและอ่านนิทานกับครอบครัวได้เลยจ้ะ`,
    submitSuccessTitle: 'เก่งมากเลยจ้ะ!',
    submitSuccessBody: (name) =>
      `ส่งรูปสวยๆ ของ ${name} ให้คุณพ่อคุณแม่ชมเรียบร้อยแล้ว รอรับเหรียญได้เลยนะ!`,
    podiumSubtitle: 'ทุกคนเก่งมากเลย! มาดูเหรียญรางวัลความพยายามของพี่ๆ น้องๆ กัน',
    tips: [
      'วัย 3-5 ปีเรียนรู้ได้ดีจากการเลียนแบบและทำร่วมกับผู้ปกครอง ชวนกันทำอย่างสนุกสนานโดยไม่ต้องเร่งรีบ',
      'ชมที่ความตั้งใจเล็กๆ น้อยๆ เช่น "หนูหยิบของเล่นใส่กล่องเก่งจัง" เพื่อสร้างความภาคภูมิใจตั้งแต่เล็ก',
    ],
  },
  '6-9': {
    greeting: (name) => `พร้อมลุยภารกิจหรือยัง ${name}!`,
    heroBadge: 'นักสร้างนิสัยดีประจำบ้าน',
    screenTimeLabel: 'พักสายตาในอีก',
    choreTimerLabel: 'จับเวลาพิชิตภารกิจ',
    recentTitle: 'กิจกรรมล่าสุดของหนู',
    emptyActivity: 'เริ่มทำภารกิจแรกของวันนี้ เพื่อสะสมเหรียญและอัปเลเวลกันเลย!',
    aimsTitle: (name) => `เป้าหมายความภูมิใจของ${name}`,
    aimTodayTitle: 'ภารกิจวันนี้',
    aimStreakTitle: 'ความสม่ำเสมอ',
    aimAvatarTitle: 'พัฒนาการอวตาร',
    choresPageTitle: 'ภารกิจพิชิตเหรียญประจำวัน',
    choresPageSubtitle: 'ฝึกทำด้วยตัวเองให้เป็นนิสัย ส่งตรงเวลาได้โบนัสเพิ่มด้วยนะ!',
    submitCta: 'ส่งงาน + รูปถ่าย',
    submitModalTitle: 'ส่งผลงานภารกิจ',
    submitPhotoPrompt: 'ถ่ายภาพหรือแนบรูปผลงานให้คุณพ่อคุณแม่ชื่นชม',
    submitNotePlaceholder: 'เช่น หนูจัดเตียงและกวาดห้องเรียบร้อยแล้วครับ',
    capReachedTitle: 'วันนี้หนูช่วยบ้านครบโควตาแล้ว!',
    capReachedBody: (name, cap) =>
      `${name} ทำครบ ${cap} ภารกิจเพื่อสุขภาพที่สมดุลแล้ว พักผ่อนและไปสนุกกับกิจกรรมนอกหน้าจอกันเถอะ`,
    submitSuccessTitle: 'ส่งผลงานเรียบร้อยแล้ว!',
    submitSuccessBody: (name) =>
      `ยอดเยี่ยมมาก ${name}! ระบบส่งแจ้งเตือนให้คุณพ่อคุณแม่ตรวจรับเหรียญแล้ว`,
    podiumSubtitle: 'พลังความรับผิดชอบทำให้ทุกคนก้าวหน้า! อันดับเหรียญรางวัลครอบครัว',
    tips: [
      'การตั้งเวลาชัดเจน เช่น เก็บจานก่อน 20:00 น. ช่วยฝึกการบริหารเวลาและความรับผิดชอบส่วนบุคคลให้เด็กวัยประถมต้น',
      'จำกัดงานวันละ 3-4 อย่าง เพื่อให้เด็กยังสนุกกับงานบ้านและมีเวลาเล่นอิสระอย่างเพียงพอ',
    ],
  },
  '10-12': {
    greeting: (name) => `สวัสดี ${name} · พร้อมดูแลบ้านวันนี้`,
    heroBadge: 'ผู้ช่วยหลักประจำครอบครัว',
    screenTimeLabel: 'โควตาหน้าจอรอบนี้',
    choreTimerLabel: 'โฟกัสจัดการภารกิจ',
    recentTitle: 'บันทึกภารกิจล่าสุด',
    emptyActivity: 'เลือกภารกิจที่รับผิดชอบวันนี้ เพื่อบริหารเวลาและสะสมแต้ม',
    aimsTitle: (name) => `แดชบอร์ดเป้าหมายของ${name}`,
    aimTodayTitle: 'ความคืบหน้าวันนี้',
    aimStreakTitle: 'สถิติความสม่ำเสมอ',
    aimAvatarTitle: 'เลเวลและอวตาร',
    choresPageTitle: 'ภารกิจความรับผิดชอบและการจัดการ',
    choresPageSubtitle: 'วางแผนทำงานบ้านที่ซับซ้อนขึ้น บริหารเวลาให้ตรงกำหนดเพื่อรับโบนัสพิเศษ',
    submitCta: 'ส่งหลักฐานภารกิจ',
    submitModalTitle: 'ยืนยันการส่งหลักฐานภารกิจ',
    submitPhotoPrompt: 'แนบภาพความเรียบร้อยของงานเพื่อให้ผู้ปกครองประเมินคุณภาพ',
    submitNotePlaceholder: 'เช่น พับผ้าและเช็ดเคาน์เตอร์อ่างล้างหน้าเสร็จก่อนเวลาครับ',
    capReachedTitle: 'ครบเป้าหมายสมดุลประจำวันแล้ว',
    capReachedBody: (name, cap) =>
      `${name} ทำภารกิจครบ ${cap} รายการตามเป้าหมายวันนี้แล้ว พักผ่อนหรือทำกิจกรรมสร้างสรรค์นอกหน้าจอต่อได้เลย`,
    submitSuccessTitle: 'บันทึกการส่งงานสำเร็จ',
    submitSuccessBody: (name) =>
      `เยี่ยมมาก ${name} ระบบแจ้งเตือนผู้ปกครองเพื่อตรวจให้คะแนนคุณภาพ (1-3 ดาว) แล้ว`,
    podiumSubtitle: 'สรุปอันดับแต้มสะสมประจำบ้าน — วัดจากความสม่ำเสมอและคุณภาพงาน',
    tips: [
      'วัย 10-12 ปีพร้อมรับผิดชอบงานที่มีหลายขั้นตอน เช่น ซักพับผ้าหรือเตรียมอาหารว่าง ช่วยสร้างความมั่นใจก่อนเข้าสู่วัยรุ่น',
      'ให้เด็กมีส่วนร่วมวางแผนเวลาและปรับแต่งอวตารด้วยตนเอง เพื่อเสริมแรงจูงใจจากภายใน (Autonomy Support)',
    ],
  },
};

export function getAgeLanguage(ageGroup: AgeGroup): AgeLanguagePack {
  return AGE_LANGUAGE_PACK[ageGroup] || AGE_LANGUAGE_PACK['6-9'];
}
