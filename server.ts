import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
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
