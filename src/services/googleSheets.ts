import {
  AgeGroup,
  AvatarAccessory,
  AvatarCharacter,
  ChildProfile,
  ChoreCategory,
  ChoreItem,
  ChoreSubmission,
  FamilyReward,
  RewardCategory,
  RewardRedemption,
  SubmissionStatus,
} from '../types';

export interface SpreadsheetMeta {
  title: string;
  sheetTitles: string[];
}

const TAB_CHILDREN = 'KidQuest_Children';
const TAB_CHORES = 'KidQuest_Chores';
const TAB_SUBMISSIONS = 'KidQuest_Submissions';
const TAB_REWARDS = 'KidQuest_Rewards';
const TAB_REDEMPTIONS = 'KidQuest_Redemptions';

export const REQUIRED_TABS = [
  TAB_CHILDREN,
  TAB_CHORES,
  TAB_SUBMISSIONS,
  TAB_REWARDS,
  TAB_REDEMPTIONS,
];

async function sheetsFetch(
  url: string,
  accessToken: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  return res;
}

export async function fetchSpreadsheetMeta(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetMeta> {
  const res = await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}?fields=properties.title,sheets.properties.title`,
    accessToken
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg =
      errBody?.error?.message ||
      `ไม่สามารถเข้าถึง Google Sheet (${res.status}) กรุณาตรวจสอบสิทธิ์หรือ Spreadsheet ID`;
    throw new Error(msg);
  }

  const data = (await res.json()) as {
    properties?: { title?: string };
    sheets?: { properties?: { title?: string } }[];
  };

  return {
    title: data.properties?.title || 'Google Spreadsheet',
    sheetTitles: (data.sheets || [])
      .map((s) => s.properties?.title || '')
      .filter(Boolean),
  };
}

async function ensureTabsExist(
  spreadsheetId: string,
  accessToken: string,
  existingTabs: string[]
): Promise<string[]> {
  const missing = REQUIRED_TABS.filter((tab) => !existingTabs.includes(tab));
  if (missing.length === 0) return existingTabs;

  const res = await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}:batchUpdate`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: missing.map((title) => ({
          addSheet: { properties: { title } },
        })),
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || 'ไม่สามารถสร้างแท็บข้อมูลใน Google Sheets ได้'
    );
  }

  return [...existingTabs, ...missing];
}

export async function syncAllToGoogleSheets(
  spreadsheetId: string,
  accessToken: string,
  payload: {
    children: ChildProfile[];
    chores: ChoreItem[];
    submissions: ChoreSubmission[];
    rewards: FamilyReward[];
    redemptions: RewardRedemption[];
  }
): Promise<{ spreadsheetTitle: string; updatedTabs: string[] }> {
  const meta = await fetchSpreadsheetMeta(spreadsheetId, accessToken);
  await ensureTabsExist(spreadsheetId, accessToken, meta.sheetTitles);

  const childrenRows: (string | number)[][] = [
    [
      'ID',
      'Name',
      'Age',
      'AgeGroup',
      'Coins',
      'XP',
      'Level',
      'DailyCap',
      'StreakDays',
      'Character',
      'Accessory',
      'OutfitColor',
      'AuraStyle',
      'UnlockedAccessories',
      'Pin',
    ],
    ...payload.children.map((c) => [
      c.id,
      c.name,
      c.age,
      c.ageGroup,
      c.coins,
      c.xp,
      c.level,
      c.dailyCap,
      c.streakDays,
      c.avatar.character,
      c.avatar.accessory,
      c.avatar.outfitColor,
      c.avatar.auraStyle,
      c.avatar.unlockedAccessories.join(','),
      c.pin || '1111',
    ]),
  ];

  const choresRows: (string | number)[][] = [
    [
      'ID',
      'Title',
      'Description',
      'AgeGroup',
      'Category',
      'BaseCoins',
      'TimeBonusCoins',
      'DeadlineTime',
      'EstimatedMinutes',
      'IconKey',
      'IsCustom',
    ],
    ...payload.chores.map((ch) => [
      ch.id,
      ch.title,
      ch.description,
      ch.ageGroup,
      ch.category,
      ch.baseCoins,
      ch.timeBonusCoins,
      ch.deadlineTime || '',
      ch.estimatedMinutes,
      ch.iconKey,
      ch.isCustom ? 'TRUE' : 'FALSE',
    ]),
  ];

  const submissionsRows: (string | number)[][] = [
    [
      'ID',
      'ChoreID',
      'ChoreTitle',
      'Category',
      'ChildID',
      'ChildName',
      'AgeGroup',
      'SubmittedAt',
      'DateKey',
      'Status',
      'HasPhoto',
      'ChildNote',
      'OnTime',
      'BaseCoins',
      'TimeBonusCoins',
      'QualityStars',
      'Multiplier',
      'TotalCoinsAwarded',
      'ParentNote',
      'ReviewedAt',
      'DriveFileID',
      'DriveWebViewLink',
    ],
    ...payload.submissions.map((s) => [
      s.id,
      s.choreId,
      s.choreTitle,
      s.category,
      s.childId,
      s.childName,
      s.ageGroup,
      s.submittedAt,
      s.dateKey,
      s.status,
      s.driveWebViewLink || (s.photoDataUrl ? 'PHOTO_ATTACHED' : 'NO_PHOTO'),
      s.childNote || '',
      s.onTime ? 'TRUE' : 'FALSE',
      s.baseCoins,
      s.timeBonusCoins,
      s.qualityStars ?? '',
      s.multiplier ?? '',
      s.totalCoinsAwarded ?? '',
      s.parentNote || '',
      s.reviewedAt || '',
      s.driveFileId || '',
      s.driveWebViewLink || '',
    ]),
  ];

  const rewardsRows: (string | number)[][] = [
    ['ID', 'Title', 'Description', 'Cost', 'Category'],
    ...payload.rewards.map((r) => [
      r.id,
      r.title,
      r.description,
      r.cost,
      r.category,
    ]),
  ];

  const redemptionsRows: (string | number)[][] = [
    [
      'ID',
      'RewardID',
      'RewardTitle',
      'RewardCategory',
      'ChildID',
      'ChildName',
      'Cost',
      'CoinsBefore',
      'CoinsAfter',
      'RedeemedByParent',
      'Note',
      'RedeemedAt',
    ],
    ...payload.redemptions.map((rd) => [
      rd.id,
      rd.rewardId,
      rd.rewardTitle,
      rd.rewardCategory,
      rd.childId,
      rd.childName,
      rd.cost,
      rd.coinsBefore,
      rd.coinsAfter,
      rd.redeemedByParent ? 'TRUE' : 'FALSE',
      rd.note || '',
      rd.redeemedAt,
    ]),
  ];

  const tabData: { range: string; values: (string | number)[][] }[] = [
    { range: `${TAB_CHILDREN}!A1`, values: childrenRows },
    { range: `${TAB_CHORES}!A1`, values: choresRows },
    { range: `${TAB_SUBMISSIONS}!A1`, values: submissionsRows },
    { range: `${TAB_REWARDS}!A1`, values: rewardsRows },
    { range: `${TAB_REDEMPTIONS}!A1`, values: redemptionsRows },
  ];

  // Clear old ranges first so deleted rows do not remain stale
  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values:batchClear`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        ranges: REQUIRED_TABS.map((t) => `${t}!A1:Z500`),
      }),
    }
  );

  const updateRes = await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values:batchUpdate`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: tabData,
      }),
    }
  );

  if (!updateRes.ok) {
    const errBody = await updateRes.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || 'ไม่สามารถบันทึกข้อมูลลง Google Sheets ได้'
    );
  }

  return {
    spreadsheetTitle: meta.title,
    updatedTabs: REQUIRED_TABS,
  };
}

export async function loadAllFromGoogleSheets(
  spreadsheetId: string,
  accessToken: string
): Promise<{
  spreadsheetTitle: string;
  availableTabs: string[];
  children?: ChildProfile[];
  chores?: ChoreItem[];
  submissions?: ChoreSubmission[];
  rewards?: FamilyReward[];
  redemptions?: RewardRedemption[];
}> {
  const meta = await fetchSpreadsheetMeta(spreadsheetId, accessToken);

  const presentTabs = REQUIRED_TABS.filter((t) =>
    meta.sheetTitles.includes(t)
  );
  if (presentTabs.length === 0) {
    return {
      spreadsheetTitle: meta.title,
      availableTabs: meta.sheetTitles,
    };
  }

  const rangesQuery = presentTabs
    .map((t) => `ranges=${encodeURIComponent(`${t}!A1:Z500`)}`)
    .join('&');

  const res = await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values:batchGet?${rangesQuery}`,
    accessToken
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || 'ไม่สามารถอ่านข้อมูลจาก Google Sheets ได้'
    );
  }

  const data = (await res.json()) as {
    valueRanges?: { range?: string; values?: string[][] }[];
  };

  const result: {
    spreadsheetTitle: string;
    availableTabs: string[];
    children?: ChildProfile[];
    chores?: ChoreItem[];
    submissions?: ChoreSubmission[];
    rewards?: FamilyReward[];
    redemptions?: RewardRedemption[];
  } = {
    spreadsheetTitle: meta.title,
    availableTabs: meta.sheetTitles,
  };

  for (const vr of data.valueRanges || []) {
    const rangeName = vr.range || '';
    const rows = vr.values || [];
    if (rows.length <= 1) continue;
    const bodyRows = rows.slice(1);

    if (rangeName.includes(TAB_CHILDREN)) {
      result.children = bodyRows
        .filter((r) => r[0] && r[1])
        .map((r) => ({
          id: r[0],
          name: r[1],
          age: Number(r[2]) || 6,
          ageGroup: (r[3] as AgeGroup) || '6-9',
          coins: Number(r[4]) || 0,
          xp: Number(r[5]) || 0,
          level: Number(r[6]) || 1,
          dailyCap: Number(r[7]) || 4,
          streakDays: Number(r[8]) || 0,
          pin: (r[14] && /^\d{4}$/.test(r[14])) ? r[14] : '1111',
          avatar: {
            character: (r[9] as AvatarCharacter) || 'fox',
            accessory: (r[10] as AvatarAccessory) || 'none',
            outfitColor: r[11] || '#59B4FF',
            auraStyle:
              (r[12] as ChildProfile['avatar']['auraStyle']) || 'sky',
            unlockedAccessories: (r[13]
              ? r[13].split(',').filter(Boolean)
              : ['none']) as AvatarAccessory[],
          },
        }));
    } else if (rangeName.includes(TAB_CHORES)) {
      result.chores = bodyRows
        .filter((r) => r[0] && r[1])
        .map((r) => ({
          id: r[0],
          title: r[1],
          description: r[2] || '',
          ageGroup: (r[3] as AgeGroup) || '6-9',
          category: (r[4] as ChoreCategory) || 'จัดระเบียบ',
          baseCoins: Number(r[5]) || 10,
          timeBonusCoins: Number(r[6]) || 0,
          deadlineTime: r[7] || undefined,
          estimatedMinutes: Number(r[8]) || 10,
          iconKey: (r[9] as ChoreItem['iconKey']) || 'toys',
          isCustom: r[10] === 'TRUE',
        }));
    } else if (rangeName.includes(TAB_SUBMISSIONS)) {
      result.submissions = bodyRows
        .filter((r) => r[0] && r[1])
        .map((r) => ({
          id: r[0],
          choreId: r[1],
          choreTitle: r[2] || '',
          category: (r[3] as ChoreCategory) || 'จัดระเบียบ',
          childId: r[4] || '',
          childName: r[5] || '',
          ageGroup: (r[6] as AgeGroup) || '6-9',
          submittedAt: r[7] || new Date().toISOString(),
          dateKey: r[8] || '',
          status: (r[9] as SubmissionStatus) || 'pending',
          childNote: r[11] || undefined,
          onTime: r[12] === 'TRUE',
          baseCoins: Number(r[13]) || 0,
          timeBonusCoins: Number(r[14]) || 0,
          qualityStars: r[15]
            ? (Number(r[15]) as 1 | 2 | 3)
            : undefined,
          multiplier: r[16] ? Number(r[16]) : undefined,
          totalCoinsAwarded: r[17] ? Number(r[17]) : undefined,
          parentNote: r[18] || undefined,
          reviewedAt: r[19] || undefined,
          driveFileId: r[20] || undefined,
          driveWebViewLink: r[21] || undefined,
        }));
    } else if (rangeName.includes(TAB_REWARDS)) {
      result.rewards = bodyRows
        .filter((r) => r[0] && r[1])
        .map((r) => ({
          id: r[0],
          title: r[1],
          description: r[2] || '',
          cost: Number(r[3]) || 50,
          category: (r[4] as RewardCategory) || 'เวลาครอบครัว',
        }));
    } else if (rangeName.includes(TAB_REDEMPTIONS)) {
      result.redemptions = bodyRows
        .filter((r) => r[0] && r[1])
        .map((r) => ({
          id: r[0],
          rewardId: r[1],
          rewardTitle: r[2] || '',
          rewardCategory: (r[3] as RewardCategory) || 'ของขวัญ',
          childId: r[4] || '',
          childName: r[5] || '',
          cost: Number(r[6]) || 0,
          coinsBefore: Number(r[7]) || 0,
          coinsAfter: Number(r[8]) || 0,
          redeemedByParent: r[9] === 'TRUE',
          note: r[10] || undefined,
          redeemedAt: r[11] || new Date().toISOString(),
        }));
    }
  }

  return result;
}
