import {
  DEFAULT_APPS_SCRIPT_URL,
  DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_SPREADSHEET_ID,
} from '../data/initialData';
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

export interface GoogleServerStatus {
  configured: boolean;
  mode: 'service_account' | 'apps_script' | 'unconfigured';
  serviceAccountEmail: string | null;
  defaultSpreadsheetId: string;
  defaultDriveFolderId: string;
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

function getFallbackAppsScriptUrl(): string {
  const envUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  const cleanedEnv =
    typeof envUrl === 'string'
      ? envUrl.trim().replace(/^["']|["']$/g, '')
      : '';
  return cleanedEnv || DEFAULT_APPS_SCRIPT_URL;
}

function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') || '';
  return ct.toLowerCase().includes('application/json');
}

export async function callAppsScriptDirect<T = Record<string, unknown>>(
  scriptUrl: string,
  payload: Record<string, unknown>
): Promise<T> {
  const res = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });
  const text = await res.text();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      `ไม่สามารถอ่านคำตอบจาก Google Apps Script ได้ (HTTP ${res.status})`
    );
  }
  if (!parsed.ok) {
    throw new Error(
      String(parsed.error || 'การเชื่อมต่อ Google Apps Script ไม่สำเร็จ')
    );
  }
  return parsed as T;
}

export async function fetchGoogleServerStatus(): Promise<GoogleServerStatus> {
  const fallbackUrl = getFallbackAppsScriptUrl();
  try {
    const res = await fetch('/api/google/status');
    if (res.ok && isJsonResponse(res)) {
      const data = (await res.json()) as GoogleServerStatus;
      if (!data.configured && fallbackUrl) {
        return {
          ...data,
          configured: true,
          mode: 'apps_script',
        };
      }
      return data;
    }
  } catch {
    // Ignore network/proxy error and check fallback
  }

  if (fallbackUrl) {
    return {
      configured: true,
      mode: 'apps_script',
      serviceAccountEmail: null,
      defaultSpreadsheetId: DEFAULT_SPREADSHEET_ID,
      defaultDriveFolderId: DEFAULT_DRIVE_FOLDER_ID,
    };
  }

  return {
    configured: false,
    mode: 'unconfigured',
    serviceAccountEmail: null,
    defaultSpreadsheetId: DEFAULT_SPREADSHEET_ID,
    defaultDriveFolderId: DEFAULT_DRIVE_FOLDER_ID,
  };
}

export async function syncAllToGoogleSheets(
  spreadsheetId: string,
  payload: {
    children: ChildProfile[];
    chores: ChoreItem[];
    submissions: ChoreSubmission[];
    rewards: FamilyReward[];
    redemptions: RewardRedemption[];
  }
): Promise<{ spreadsheetTitle: string; updatedTabs: string[] }> {
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

  const fallbackUrl = getFallbackAppsScriptUrl();

  try {
    const res = await fetch('/api/google/sheets/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId,
        requiredTabs: REQUIRED_TABS,
        tabData,
      }),
    });

    if (isJsonResponse(res)) {
      const data = (await res.json()) as {
        ok?: boolean;
        unconfigured?: boolean;
        error?: string;
        spreadsheetTitle?: string;
        updatedTabs?: string[];
      };

      if (res.ok && data.ok) {
        return {
          spreadsheetTitle: data.spreadsheetTitle || 'Google Spreadsheet',
          updatedTabs: data.updatedTabs || REQUIRED_TABS,
        };
      }

      if ((!(data.unconfigured || res.status === 404)) || !fallbackUrl) {
        throw new Error(data.error || 'ไม่สามารถบันทึกข้อมูลลง Google Sheets ได้');
      }
    } else if (!fallbackUrl) {
      throw new Error(
        `ไม่พบ API หลังบ้าน (/api/google/sheets/sync สถานะ ${res.status}) กรุณาตั้งค่า GOOGLE_APPS_SCRIPT_URL`
      );
    }
  } catch (err) {
    if (!fallbackUrl) {
      throw err instanceof Error
        ? err
        : new Error('ไม่สามารถบันทึกข้อมูลลง Google Sheets ได้');
    }
  }

  const direct = await callAppsScriptDirect<{
    spreadsheetTitle?: string;
    updatedTabs?: string[];
  }>(fallbackUrl, {
    action: 'sync',
    spreadsheetId,
    requiredTabs: REQUIRED_TABS,
    tabData,
  });

  return {
    spreadsheetTitle: direct.spreadsheetTitle || 'Google Spreadsheet',
    updatedTabs: direct.updatedTabs || REQUIRED_TABS,
  };
}

interface SheetsLoadPayload {
  ok?: boolean;
  unconfigured?: boolean;
  error?: string;
  spreadsheetTitle?: string;
  availableTabs?: string[];
  valueRanges?: { range?: string; values?: string[][] }[];
}

export async function loadAllFromGoogleSheets(spreadsheetId: string): Promise<{
  spreadsheetTitle: string;
  availableTabs: string[];
  children?: ChildProfile[];
  chores?: ChoreItem[];
  submissions?: ChoreSubmission[];
  rewards?: FamilyReward[];
  redemptions?: RewardRedemption[];
}> {
  const fallbackUrl = getFallbackAppsScriptUrl();
  let data: SheetsLoadPayload | null = null;

  try {
    const res = await fetch('/api/google/sheets/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId,
        tabs: REQUIRED_TABS,
      }),
    });

    if (isJsonResponse(res)) {
      const json = (await res.json()) as SheetsLoadPayload;
      if (res.ok && json.ok) {
        data = json;
      } else if ((!(json.unconfigured || res.status === 404)) || !fallbackUrl) {
        throw new Error(json.error || 'ไม่สามารถอ่านข้อมูลจาก Google Sheets ได้');
      }
    } else if (!fallbackUrl) {
      throw new Error(
        `ไม่พบ API หลังบ้าน (/api/google/sheets/load สถานะ ${res.status}) กรุณาตั้งค่า GOOGLE_APPS_SCRIPT_URL`
      );
    }
  } catch (err) {
    if (!fallbackUrl) {
      throw err instanceof Error
        ? err
        : new Error('ไม่สามารถอ่านข้อมูลจาก Google Sheets ได้');
    }
  }

  if (!data) {
    data = await callAppsScriptDirect<SheetsLoadPayload>(fallbackUrl, {
      action: 'load',
      spreadsheetId,
      tabs: REQUIRED_TABS,
    });
  }

  const result: {
    spreadsheetTitle: string;
    availableTabs: string[];
    children?: ChildProfile[];
    chores?: ChoreItem[];
    submissions?: ChoreSubmission[];
    rewards?: FamilyReward[];
    redemptions?: RewardRedemption[];
  } = {
    spreadsheetTitle: data.spreadsheetTitle || 'Google Spreadsheet',
    availableTabs: data.availableTabs || [],
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
          pin: r[14] && /^\d{4}$/.test(r[14]) ? r[14] : '1111',
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

export const APPS_SCRIPT_CODE_GS = `function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents || '{}');
    var action = payload.action;

    if (action === 'load') {
      var ss = SpreadsheetApp.openById(payload.spreadsheetId);
      var availableTabs = ss.getSheets().map(function(s) { return s.getName(); });
      var tabs = payload.tabs || [];
      var valueRanges = [];
      tabs.forEach(function(tabName) {
        var sheet = ss.getSheetByName(tabName);
        if (sheet) {
          var values = sheet.getDataRange().getValues();
          valueRanges.push({
            range: tabName + '!A1:Z' + Math.max(values.length, 1),
            values: values.map(function(row) {
              return row.map(function(cell) { return cell === null || cell === undefined ? '' : String(cell); });
            })
          });
        }
      });
      return jsonOut({
        ok: true,
        spreadsheetTitle: ss.getName(),
        availableTabs: availableTabs,
        valueRanges: valueRanges
      });
    }

    if (action === 'sync') {
      var ssSync = SpreadsheetApp.openById(payload.spreadsheetId);
      var requiredTabs = payload.requiredTabs || [];
      requiredTabs.forEach(function(tabName) {
        if (!ssSync.getSheetByName(tabName)) {
          ssSync.insertSheet(tabName);
        }
      });
      (payload.tabData || []).forEach(function(item) {
        var tabName = String(item.range || '').split('!')[0];
        var sheet = ssSync.getSheetByName(tabName);
        if (!sheet) return;
        sheet.clearContents();
        var values = item.values || [];
        if (values.length > 0 && values[0].length > 0) {
          sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
        }
      });
      return jsonOut({
        ok: true,
        spreadsheetTitle: ssSync.getName(),
        updatedTabs: requiredTabs
      });
    }

    if (action === 'verifyDrive') {
      var folder = DriveApp.getFolderById(payload.folderId);
      return jsonOut({ ok: true, id: folder.getId(), name: folder.getName() });
    }

    if (action === 'uploadDrive') {
      var targetFolder = DriveApp.getFolderById(payload.folderId);
      var bytes = Utilities.base64Decode(payload.base64Data);
      var blob = Utilities.newBlob(bytes, payload.mimeType || 'image/jpeg', payload.fileName);
      var file = targetFolder.createFile(blob);
      if (payload.description) file.setDescription(payload.description);
      return jsonOut({
        ok: true,
        id: file.getId(),
        name: file.getName(),
        webViewLink: file.getUrl()
      });
    }

    return jsonOut({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;
