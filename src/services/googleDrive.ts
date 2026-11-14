import { callAppsScriptDirect } from './googleSheets';

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
}

function getFallbackAppsScriptUrl(): string {
  const url = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  return typeof url === 'string' ? url.trim().replace(/^["']|["']$/g, '') : '';
}

function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') || '';
  return ct.toLowerCase().includes('application/json');
}

export async function verifyDriveFolder(
  folderId: string
): Promise<{ id: string; name: string }> {
  const cleanId = folderId.trim();
  if (!cleanId) {
    throw new Error('กรุณาระบุ Google Drive Folder ID');
  }

  const fallbackUrl = getFallbackAppsScriptUrl();

  try {
    const res = await fetch('/api/google/drive/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: cleanId }),
    });

    if (isJsonResponse(res)) {
      const data = (await res.json()) as {
        ok?: boolean;
        unconfigured?: boolean;
        id?: string;
        name?: string;
        error?: string;
      };

      if (res.ok && data.ok && data.id) {
        return { id: data.id, name: data.name || 'Google Drive Folder' };
      }

      if (!data.unconfigured || !fallbackUrl) {
        throw new Error(
          data.error ||
            `ไม่สามารถเข้าถึงโฟลเดอร์ Google Drive (${res.status}) กรุณาตรวจสอบ Folder ID`
        );
      }
    } else if (!fallbackUrl) {
      throw new Error(
        `ไม่พบ API หลังบ้าน (/api/google/drive/verify สถานะ ${res.status}) กรุณาตั้งค่า GOOGLE_APPS_SCRIPT_URL`
      );
    }
  } catch (err) {
    if (!fallbackUrl) {
      throw err instanceof Error
        ? err
        : new Error('ไม่สามารถเข้าถึงโฟลเดอร์ Google Drive ได้');
    }
  }

  const direct = await callAppsScriptDirect<{ id: string; name?: string }>(
    fallbackUrl,
    {
      action: 'verifyDrive',
      folderId: cleanId,
    }
  );

  return { id: direct.id, name: direct.name || 'Google Drive Folder' };
}

export async function uploadChorePhotoToDrive(params: {
  dataUrl: string;
  fileBaseName: string;
  folderId: string;
  description?: string;
}): Promise<DriveUploadResult> {
  const { dataUrl, fileBaseName, folderId, description } = params;
  const cleanFolderId = folderId.trim();
  const fallbackUrl = getFallbackAppsScriptUrl();

  try {
    const res = await fetch('/api/google/drive/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl,
        fileBaseName,
        folderId: cleanFolderId,
        description,
      }),
    });

    if (isJsonResponse(res)) {
      const data = (await res.json()) as {
        ok?: boolean;
        unconfigured?: boolean;
        id?: string;
        name?: string;
        webViewLink?: string;
        error?: string;
      };

      if (res.ok && data.ok && data.id) {
        return {
          id: data.id,
          name: data.name || fileBaseName,
          webViewLink:
            data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
        };
      }

      if (!data.unconfigured || !fallbackUrl) {
        throw new Error(
          data.error || `อัปโหลดรูปไปยัง Google Drive ไม่สำเร็จ (${res.status})`
        );
      }
    } else if (!fallbackUrl) {
      throw new Error(
        `ไม่พบ API หลังบ้าน (/api/google/drive/upload สถานะ ${res.status}) กรุณาตั้งค่า GOOGLE_APPS_SCRIPT_URL`
      );
    }
  } catch (err) {
    if (!fallbackUrl) {
      throw err instanceof Error
        ? err
        : new Error('อัปโหลดรูปไปยัง Google Drive ไม่สำเร็จ');
    }
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('รูปแบบไฟล์รูปภาพไม่ถูกต้อง');
  }
  const mimeType = match[1] || 'image/jpeg';
  const base64Data = match[2];
  const ext = mimeType.includes('png')
    ? 'png'
    : mimeType.includes('webp')
    ? 'webp'
    : 'jpg';
  const safeName = `${fileBaseName.replace(/[\\/:*?"<>|]/g, '_')}.${ext}`;

  const direct = await callAppsScriptDirect<{
    id: string;
    name?: string;
    webViewLink?: string;
  }>(fallbackUrl, {
    action: 'uploadDrive',
    folderId: cleanFolderId,
    fileName: safeName,
    mimeType,
    base64Data,
    description: description || '',
  });

  return {
    id: direct.id,
    name: direct.name || safeName,
    webViewLink:
      direct.webViewLink || `https://drive.google.com/file/d/${direct.id}/view`,
  };
}
