import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_SPREADSHEET_ID =
  process.env.GOOGLE_SHEET_ID?.trim() ||
  '10tp-V420fQeYGxfnYoNCRURqF9OPxRkG2tQsm2vht7w';
const DEFAULT_DRIVE_FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ||
  '11ntO9X4OFZXRSa33QjGQfSBf2eS0gzTF';

interface ServiceAccountCreds {
  clientEmail: string;
  privateKey: string;
}

function getServiceAccountCreds(): ServiceAccountCreds | null {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    try {
      let decoded = rawJson;
      if (!rawJson.startsWith('{')) {
        decoded = Buffer.from(rawJson, 'base64').toString('utf8');
      }
      const parsed = JSON.parse(decoded) as {
        client_email?: string;
        private_key?: string;
      };
      if (parsed.client_email && parsed.private_key) {
        return {
          clientEmail: parsed.client_email.trim(),
          privateKey: parsed.private_key.replace(/\\n/g, '\n'),
        };
      }
    } catch {
      // Ignore malformed JSON and fall through
    }
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (clientEmail && privateKey) {
    return {
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

function getAppsScriptUrl(): string | null {
  const raw = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  if (!raw) return null;
  return raw.replace(/^["']|["']$/g, '').trim() || null;
}

let cachedGoogleToken: { token: string; expiresAtMs: number; email: string } | null = null;

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function getServiceAccountAccessToken(creds: ServiceAccountCreds): Promise<string> {
  const nowMs = Date.now();
  if (
    cachedGoogleToken &&
    cachedGoogleToken.email === creds.clientEmail &&
    cachedGoogleToken.expiresAtMs - 60_000 > nowMs
  ) {
    return cachedGoogleToken.token;
  }

  const iat = Math.floor(nowMs / 1000);
  const exp = iat + 3600;
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: creds.clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp,
      iat,
    })
  );

  const unsignedJwt = `${header}.${claimSet}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();
  const signature = base64UrlEncode(signer.sign(creds.privateKey));
  const assertion = `${unsignedJwt}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });

  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
    error?: string;
  };

  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(
      tokenJson.error_description ||
        tokenJson.error ||
        'ไม่สามารถขอ Access Token จาก Google Service Account ได้'
    );
  }

  cachedGoogleToken = {
    token: tokenJson.access_token,
    expiresAtMs: nowMs + (tokenJson.expires_in || 3600) * 1000,
    email: creds.clientEmail,
  };

  return tokenJson.access_token;
}

async function callAppsScript(scriptUrl: string, payload: Record<string, unknown>) {
  if (!/^https:\/\/script\.google\.com\/.+/.test(scriptUrl)) {
    throw new Error(
      'GOOGLE_APPS_SCRIPT_URL ไม่ถูกต้อง (ต้องเป็น URL จาก https://script.google.com/... ที่ลงท้ายด้วย /exec)'
    );
  }
  if (scriptUrl.endsWith('/dev')) {
    throw new Error(
      'URL ลงท้ายด้วย /dev ไม่สามารถใช้งานข้ามระบบได้ กรุณาใช้ URL ที่ลงท้ายด้วย /exec จากการ Deploy Web App'
    );
  }

  const res = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const looksLikeHtml = text.trim().startsWith('<');
    throw new Error(
      looksLikeHtml
        ? `Apps Script ยังไม่ได้เปิดสิทธิ์สาธารณะ (HTTP ${res.status}): กรุณาตั้งค่า Deploy → Manage deployments → Who has access: Anyone (ทุกคน)`
        : `Apps Script ตอบกลับไม่ถูกต้อง (HTTP ${res.status}): กรุณาตรวจสอบ URL ที่ลงท้ายด้วย /exec`
    );
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Expose zero-login Google Sheets & Drive server configuration status (never returns private keys/secrets)
  app.get('/api/google/status', (_req, res) => {
    const sa = getServiceAccountCreds();
    const appsScriptUrl = getAppsScriptUrl();
    const mode = sa
      ? 'service_account'
      : appsScriptUrl
      ? 'apps_script'
      : 'unconfigured';

    res.json({
      configured: mode !== 'unconfigured',
      mode,
      serviceAccountEmail: sa?.clientEmail || null,
      defaultSpreadsheetId: DEFAULT_SPREADSHEET_ID,
      defaultDriveFolderId: DEFAULT_DRIVE_FOLDER_ID,
    });
  });

  // Load spreadsheet tabs without user Google login
  app.post('/api/google/sheets/load', async (req, res) => {
    try {
      const spreadsheetId =
        String(req.body?.spreadsheetId || '').trim() || DEFAULT_SPREADSHEET_ID;
      const tabs = Array.isArray(req.body?.tabs)
        ? (req.body.tabs as string[])
        : [
            'KidQuest_Children',
            'KidQuest_Chores',
            'KidQuest_Submissions',
            'KidQuest_Rewards',
            'KidQuest_Redemptions',
          ];

      const sa = getServiceAccountCreds();
      const appsScriptUrl = getAppsScriptUrl();

      if (sa) {
        const token = await getServiceAccountAccessToken(sa);
        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
            spreadsheetId
          )}?fields=properties.title,sheets.properties.title`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!metaRes.ok) {
          const errBody = (await metaRes.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(
            errBody?.error?.message ||
              `ไม่สามารถเข้าถึง Google Sheet (${metaRes.status}) กรุณาแชร์ชีตให้ ${sa.clientEmail} เป็น Editor`
          );
        }

        const meta = (await metaRes.json()) as {
          properties?: { title?: string };
          sheets?: { properties?: { title?: string } }[];
        };
        const spreadsheetTitle = meta.properties?.title || 'Google Spreadsheet';
        const availableTabs = (meta.sheets || [])
          .map((s) => s.properties?.title || '')
          .filter(Boolean);

        const presentTabs = tabs.filter((t) => availableTabs.includes(t));
        if (presentTabs.length === 0) {
          res.json({
            ok: true,
            spreadsheetTitle,
            availableTabs,
            valueRanges: [],
          });
          return;
        }

        const rangesQuery = presentTabs
          .map((t) => `ranges=${encodeURIComponent(`${t}!A1:Z500`)}`)
          .join('&');

        const valuesRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
            spreadsheetId
          )}/values:batchGet?${rangesQuery}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!valuesRes.ok) {
          const errBody = (await valuesRes.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(
            errBody?.error?.message || 'ไม่สามารถอ่านข้อมูลจาก Google Sheets ได้'
          );
        }

        const valuesData = (await valuesRes.json()) as {
          valueRanges?: { range?: string; values?: string[][] }[];
        };

        res.json({
          ok: true,
          spreadsheetTitle,
          availableTabs,
          valueRanges: valuesData.valueRanges || [],
        });
        return;
      }

      if (appsScriptUrl) {
        const result = await callAppsScript(appsScriptUrl, {
          action: 'load',
          spreadsheetId,
          tabs,
        });
        if (!result.ok) {
          throw new Error(String(result.error || 'Apps Script อ่านข้อมูลไม่สำเร็จ'));
        }
        res.json(result);
        return;
      }

      res.status(400).json({
        ok: false,
        unconfigured: true,
        error:
          'ยังไม่ได้ตั้งค่าบัญชีเชื่อมต่อเซิร์ฟเวอร์ (GOOGLE_SERVICE_ACCOUNT_JSON หรือ GOOGLE_APPS_SCRIPT_URL ใน Secrets)',
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets',
      });
    }
  });

  // Sync spreadsheet tabs without user Google login
  app.post('/api/google/sheets/sync', async (req, res) => {
    try {
      const spreadsheetId =
        String(req.body?.spreadsheetId || '').trim() || DEFAULT_SPREADSHEET_ID;
      const requiredTabs = Array.isArray(req.body?.requiredTabs)
        ? (req.body.requiredTabs as string[])
        : [];
      const tabData = Array.isArray(req.body?.tabData)
        ? (req.body.tabData as { range: string; values: (string | number)[][] }[])
        : [];

      const sa = getServiceAccountCreds();
      const appsScriptUrl = getAppsScriptUrl();

      if (sa) {
        const token = await getServiceAccountAccessToken(sa);
        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
            spreadsheetId
          )}?fields=properties.title,sheets.properties.title`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!metaRes.ok) {
          const errBody = (await metaRes.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(
            errBody?.error?.message ||
              `ไม่สามารถเข้าถึง Google Sheet (${metaRes.status}) กรุณาแชร์ชีตให้ ${sa.clientEmail} เป็น Editor`
          );
        }

        const meta = (await metaRes.json()) as {
          properties?: { title?: string };
          sheets?: { properties?: { title?: string } }[];
        };
        const spreadsheetTitle = meta.properties?.title || 'Google Spreadsheet';
        const existingTabs = (meta.sheets || [])
          .map((s) => s.properties?.title || '')
          .filter(Boolean);

        const missing = requiredTabs.filter((t) => !existingTabs.includes(t));
        if (missing.length > 0) {
          const addRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
              spreadsheetId
            )}:batchUpdate`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                requests: missing.map((title) => ({
                  addSheet: { properties: { title } },
                })),
              }),
            }
          );
          if (!addRes.ok) {
            const errBody = (await addRes.json().catch(() => ({}))) as {
              error?: { message?: string };
            };
            throw new Error(
              errBody?.error?.message || 'ไม่สามารถสร้างแท็บข้อมูลใน Google Sheets ได้'
            );
          }
        }

        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
            spreadsheetId
          )}/values:batchClear`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ranges: requiredTabs.map((t) => `${t}!A1:Z500`),
            }),
          }
        );

        const updateRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
            spreadsheetId
          )}/values:batchUpdate`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              valueInputOption: 'USER_ENTERED',
              data: tabData,
            }),
          }
        );

        if (!updateRes.ok) {
          const errBody = (await updateRes.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(
            errBody?.error?.message || 'ไม่สามารถบันทึกข้อมูลลง Google Sheets ได้'
          );
        }

        res.json({
          ok: true,
          spreadsheetTitle,
          updatedTabs: requiredTabs,
        });
        return;
      }

      if (appsScriptUrl) {
        const result = await callAppsScript(appsScriptUrl, {
          action: 'sync',
          spreadsheetId,
          requiredTabs,
          tabData,
        });
        if (!result.ok) {
          throw new Error(String(result.error || 'Apps Script บันทึกข้อมูลไม่สำเร็จ'));
        }
        res.json(result);
        return;
      }

      res.status(400).json({
        ok: false,
        unconfigured: true,
        error:
          'ยังไม่ได้ตั้งค่าบัญชีเชื่อมต่อเซิร์ฟเวอร์ (GOOGLE_SERVICE_ACCOUNT_JSON หรือ GOOGLE_APPS_SCRIPT_URL ใน Secrets)',
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดในการบันทึก Google Sheets',
      });
    }
  });

  // Verify Google Drive folder access without user Google login
  app.post('/api/google/drive/verify', async (req, res) => {
    try {
      const folderId =
        String(req.body?.folderId || '').trim() || DEFAULT_DRIVE_FOLDER_ID;
      if (!folderId) {
        res.status(400).json({
          ok: false,
          error: 'กรุณาระบุ Google Drive Folder ID',
        });
        return;
      }

      const sa = getServiceAccountCreds();
      const appsScriptUrl = getAppsScriptUrl();

      if (sa) {
        const token = await getServiceAccountAccessToken(sa);
        const driveRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
            folderId
          )}?fields=id,name,mimeType&supportsAllDrives=true`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!driveRes.ok) {
          const errBody = (await driveRes.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(
            errBody?.error?.message ||
              `ไม่สามารถเข้าถึงโฟลเดอร์ Drive (${driveRes.status}) กรุณาแชร์โฟลเดอร์ให้ ${sa.clientEmail} เป็น Editor`
          );
        }

        const data = (await driveRes.json()) as {
          id: string;
          name: string;
          mimeType?: string;
        };

        if (
          data.mimeType &&
          data.mimeType !== 'application/vnd.google-apps.folder'
        ) {
          throw new Error('ID ที่ระบุไม่ใช่โฟลเดอร์ Google Drive');
        }

        res.json({ ok: true, id: data.id, name: data.name });
        return;
      }

      if (appsScriptUrl) {
        const result = await callAppsScript(appsScriptUrl, {
          action: 'verifyDrive',
          folderId,
        });
        if (!result.ok) {
          throw new Error(String(result.error || 'Apps Script ตรวจสอบโฟลเดอร์ Drive ไม่สำเร็จ'));
        }
        res.json(result);
        return;
      }

      res.status(400).json({
        ok: false,
        unconfigured: true,
        error:
          'ยังไม่ได้ตั้งค่าบัญชีเชื่อมต่อเซิร์ฟเวอร์ (GOOGLE_SERVICE_ACCOUNT_JSON หรือ GOOGLE_APPS_SCRIPT_URL ใน Secrets)',
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'ไม่สามารถตรวจสอบโฟลเดอร์ Google Drive ได้',
      });
    }
  });

  // Upload chore proof photo directly to Google Drive folder without user Google login
  app.post('/api/google/drive/upload', async (req, res) => {
    try {
      const dataUrl = String(req.body?.dataUrl || '');
      const fileBaseName = String(req.body?.fileBaseName || `KidQuest_${Date.now()}`);
      const folderId =
        String(req.body?.folderId || '').trim() || DEFAULT_DRIVE_FOLDER_ID;
      const description = req.body?.description
        ? String(req.body.description)
        : undefined;

      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        res.status(400).json({ ok: false, error: 'รูปแบบไฟล์รูปภาพไม่ถูกต้อง' });
        return;
      }

      const mimeType = match[1] || 'image/jpeg';
      const base64Data = match[2];
      const ext = mimeType.includes('png')
        ? 'png'
        : mimeType.includes('webp')
        ? 'webp'
        : 'jpg';
      const safeName = `${fileBaseName.replace(/[\\/:*?"<>|]/g, '_')}.${ext}`;

      const sa = getServiceAccountCreds();
      const appsScriptUrl = getAppsScriptUrl();

      if (sa) {
        const token = await getServiceAccountAccessToken(sa);
        const metadata = {
          name: safeName,
          ...(folderId ? { parents: [folderId] } : {}),
          ...(description ? { description } : {}),
        };

        const buffer = Buffer.from(base64Data, 'base64');
        const form = new FormData();
        form.append(
          'metadata',
          new Blob([JSON.stringify(metadata)], { type: 'application/json' })
        );
        form.append('file', new Blob([buffer], { type: mimeType }), safeName);

        const uploadRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          }
        );

        if (!uploadRes.ok) {
          const errBody = (await uploadRes.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(
            errBody?.error?.message ||
              `อัปโหลดรูปไปยัง Google Drive ไม่สำเร็จ (${uploadRes.status})`
          );
        }

        const created = (await uploadRes.json()) as {
          id: string;
          name: string;
          webViewLink?: string;
        };

        res.json({
          ok: true,
          id: created.id,
          name: created.name || safeName,
          webViewLink:
            created.webViewLink ||
            `https://drive.google.com/file/d/${created.id}/view`,
        });
        return;
      }

      if (appsScriptUrl) {
        const result = await callAppsScript(appsScriptUrl, {
          action: 'uploadDrive',
          folderId,
          fileName: safeName,
          mimeType,
          base64Data,
          description: description || '',
        });
        if (!result.ok) {
          throw new Error(String(result.error || 'Apps Script อัปโหลดรูปไม่สำเร็จ'));
        }
        res.json(result);
        return;
      }

      res.status(400).json({
        ok: false,
        unconfigured: true,
        error:
          'ยังไม่ได้ตั้งค่าบัญชีเชื่อมต่อเซิร์ฟเวอร์ (GOOGLE_SERVICE_ACCOUNT_JSON หรือ GOOGLE_APPS_SCRIPT_URL ใน Secrets)',
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'อัปโหลดรูปไปยัง Google Drive ไม่สำเร็จ',
      });
    }
  });

  // Expose whether server-side Telegram environment variables are configured (never returns secret values)
  app.get('/api/telegram/status', (_req, res) => {
    const hasEnvToken = Boolean(process.env.TELEGRAM_TOKEN && process.env.TELEGRAM_TOKEN.trim());
    const hasEnvChatId = Boolean(process.env.TELEGRAM_CHAT_ID && process.env.TELEGRAM_CHAT_ID.trim());
    res.json({
      envConfigured: hasEnvToken && hasEnvChatId,
      hasEnvToken,
      hasEnvChatId,
    });
  });

  // Send a test notification to Telegram Bot API
  app.post('/api/telegram/test', async (req, res) => {
    try {
      const token = (req.body?.token as string | undefined)?.trim() || process.env.TELEGRAM_TOKEN?.trim();
      const chatId = (req.body?.chatId as string | undefined)?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();

      if (!token || !chatId) {
        res.status(400).json({
          ok: false,
          error: 'กรุณาระบุ TELEGRAM_TOKEN และ TELEGRAM_CHAT_ID ให้ครบถ้วนก่อนทดสอบส่งข้อความ',
        });
        return;
      }

      const text = [
        '🌟 <b>KidQuest Family — ทดสอบการเชื่อมต่อสำเร็จ!</b>',
        '',
        'ระบบแจ้งเตือนงานบ้านสำหรับผู้ปกครองพร้อมใช้งานแล้วค่ะ',
        'เมื่อเด็กๆ ส่งภาพถ่ายผลงาน คุณพ่อคุณแม่จะได้รับการแจ้งเตือนทันทีผ่านช่องทางนี้ 💛',
      ].join('\n');

      const tgRes = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });

      const data = (await tgRes.json()) as { ok: boolean; description?: string };
      if (!data.ok) {
        res.status(400).json({
          ok: false,
          error: data.description || 'ไม่สามารถส่งข้อความไปยัง Telegram ได้ กรุณาตรวจสอบ Token และ Chat ID',
        });
        return;
      }

      res.json({ ok: true, message: 'ส่งข้อความทดสอบไปยัง Telegram เรียบร้อยแล้ว!' });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ Telegram API',
      });
    }
  });

  // Send chore submission notification (with optional photo proof) to Telegram Bot API
  app.post('/api/telegram/notify', async (req, res) => {
    try {
      const {
        childName,
        ageGroupLabel,
        choreTitle,
        baseCoins,
        deadlineBonus,
        onTime,
        note,
        photoDataUrl,
        token: customToken,
        chatId: customChatId,
      } = req.body ?? {};

      const token = (customToken as string | undefined)?.trim() || process.env.TELEGRAM_TOKEN?.trim();
      const chatId = (customChatId as string | undefined)?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();

      if (!token || !chatId) {
        res.status(200).json({
          ok: false,
          skipped: true,
          reason: 'ยังไม่ได้ตั้งค่า TELEGRAM_TOKEN หรือ TELEGRAM_CHAT_ID',
        });
        return;
      }

      const safeChild = String(childName || 'น้อง').replace(/[<>&]/g, '');
      const safeChore = String(choreTitle || 'ภารกิจงานบ้าน').replace(/[<>&]/g, '');
      const safeAge = String(ageGroupLabel || '').replace(/[<>&]/g, '');
      const safeNote = note ? String(note).replace(/[<>&]/g, '') : '';

      const captionLines = [
        `✨ <b>มีภารกิจงานบ้านรอผู้ปกครองตรวจ!</b>`,
        ``,
        `👦👧 <b>ผู้ทำภารกิจ:</b> ${safeChild}${safeAge ? ` (${safeAge})` : ''}`,
        `🧹 <b>ภารกิจ:</b> ${safeChore}`,
        `🪙 <b>เหรียญพื้นฐาน:</b> ${Number(baseCoins || 0)} เหรียญ`,
      ];

      if (onTime && Number(deadlineBonus || 0) > 0) {
        captionLines.push(`⏰ <b>โบนัสตรงเวลา:</b> +${Number(deadlineBonus)} เหรียญ`);
      }
      if (safeNote) {
        captionLines.push(`💬 <b>ข้อความจากน้อง:</b> "${safeNote}"`);
      }
      captionLines.push('', 'กรุณาเปิดแอป KidQuest เพื่อตรวจให้คะแนนคุณภาพ (1-3 ดาว) และมอบเหรียญกำลังใจให้น้องนะครับ/คะ 🌟');

      const caption = captionLines.join('\n');

      // If a base64 photo proof is attached, send via Telegram sendPhoto
      if (typeof photoDataUrl === 'string' && photoDataUrl.startsWith('data:image/')) {
        const matches = photoDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = mimeType.split('/')[1] || 'jpg';
          const form = new FormData();
          form.append('chat_id', chatId);
          form.append('caption', caption);
          form.append('parse_mode', 'HTML');
          form.append('photo', new Blob([buffer], { type: mimeType }), `chore-proof.${ext}`);

          const tgPhotoRes = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendPhoto`, {
            method: 'POST',
            body: form,
          });
          const photoResult = (await tgPhotoRes.json()) as { ok: boolean; description?: string };
          if (photoResult.ok) {
            res.json({ ok: true, sentPhoto: true });
            return;
          }
          // Fall back to sendMessage if sendPhoto fails
        }
      }

      const tgRes = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: caption,
          parse_mode: 'HTML',
        }),
      });

      const data = (await tgRes.json()) as { ok: boolean; description?: string };
      if (!data.ok) {
        res.status(400).json({ ok: false, error: data.description || 'Telegram API error' });
        return;
      }

      res.json({ ok: true, sentPhoto: false });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to send Telegram notification',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KidQuest server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
