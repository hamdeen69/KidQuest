export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string; ext: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('รูปแบบไฟล์รูปภาพไม่ถูกต้อง');
  }
  const mimeType = match[1] || 'image/jpeg';
  const base64 = match[2];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const ext = mimeType.includes('png')
    ? 'png'
    : mimeType.includes('webp')
    ? 'webp'
    : 'jpg';
  return {
    blob: new Blob([bytes], { type: mimeType }),
    mimeType,
    ext,
  };
}

export async function verifyDriveFolder(
  folderId: string,
  accessToken: string
): Promise<{ id: string; name: string }> {
  const cleanId = folderId.trim();
  if (!cleanId) {
    throw new Error('กรุณาระบุ Google Drive Folder ID');
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      cleanId
    )}?fields=id,name,mimeType&supportsAllDrives=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message ||
        `ไม่สามารถเข้าถึงโฟลเดอร์ Google Drive (${res.status}) กรุณาตรวจสอบสิทธิ์หรือ Folder ID`
    );
  }

  const data = (await res.json()) as {
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

  return { id: data.id, name: data.name };
}

export async function uploadChorePhotoToDrive(params: {
  dataUrl: string;
  fileBaseName: string;
  folderId: string;
  accessToken: string;
  description?: string;
}): Promise<DriveUploadResult> {
  const { dataUrl, fileBaseName, folderId, accessToken, description } = params;
  const { blob, ext } = dataUrlToBlob(dataUrl);

  const safeName = `${fileBaseName.replace(/[\\/:*?"<>|]/g, '_')}.${ext}`;
  const cleanFolderId = folderId.trim();

  const metadata: {
    name: string;
    parents?: string[];
    description?: string;
  } = {
    name: safeName,
    ...(cleanFolderId ? { parents: [cleanFolderId] } : {}),
    ...(description ? { description } : {}),
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', blob, safeName);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message ||
        `อัปโหลดรูปไปยัง Google Drive ไม่สำเร็จ (${res.status})`
    );
  }

  const created = (await res.json()) as {
    id: string;
    name: string;
    webViewLink?: string;
  };

  return {
    id: created.id,
    name: created.name || safeName,
    webViewLink:
      created.webViewLink || `https://drive.google.com/file/d/${created.id}/view`,
  };
}
