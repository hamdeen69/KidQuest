export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
}

export async function verifyDriveFolder(
  folderId: string
): Promise<{ id: string; name: string }> {
  const cleanId = folderId.trim();
  if (!cleanId) {
    throw new Error('กรุณาระบุ Google Drive Folder ID');
  }

  const res = await fetch('/api/google/drive/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId: cleanId }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    id?: string;
    name?: string;
    error?: string;
  };

  if (!res.ok || !data.ok || !data.id) {
    throw new Error(
      data.error ||
        `ไม่สามารถเข้าถึงโฟลเดอร์ Google Drive (${res.status}) กรุณาตรวจสอบ Folder ID`
    );
  }

  return { id: data.id, name: data.name || 'Google Drive Folder' };
}

export async function uploadChorePhotoToDrive(params: {
  dataUrl: string;
  fileBaseName: string;
  folderId: string;
  description?: string;
}): Promise<DriveUploadResult> {
  const { dataUrl, fileBaseName, folderId, description } = params;

  const res = await fetch('/api/google/drive/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataUrl,
      fileBaseName,
      folderId: folderId.trim(),
      description,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    id?: string;
    name?: string;
    webViewLink?: string;
    error?: string;
  };

  if (!res.ok || !data.ok || !data.id) {
    throw new Error(
      data.error || `อัปโหลดรูปไปยัง Google Drive ไม่สำเร็จ (${res.status})`
    );
  }

  return {
    id: data.id,
    name: data.name || fileBaseName,
    webViewLink:
      data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
  };
}
