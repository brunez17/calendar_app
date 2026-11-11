import type { DriveSnapshot } from '@/src/domain/types';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const FILE_NAME = 'calendar_app_data.json';

type DriveFile = {
  id: string;
  name: string;
  modifiedTime?: string;
};

async function driveFetch(
  accessToken: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(url, { ...init, headers });
}

export async function findAppDataFile(
  accessToken: string,
): Promise<DriveFile | null> {
  const q = encodeURIComponent(`name = '${FILE_NAME}'`);
  const res = await driveFetch(
    accessToken,
    `${DRIVE_API}/files?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`,
  );
  if (!res.ok) {
    throw new Error(`Drive list failed: ${res.status}`);
  }
  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files?.[0] ?? null;
}

export async function downloadSnapshot(
  accessToken: string,
  fileId: string,
): Promise<DriveSnapshot> {
  const res = await driveFetch(
    accessToken,
    `${DRIVE_API}/files/${fileId}?alt=media`,
  );
  if (!res.ok) {
    throw new Error(`Drive download failed: ${res.status}`);
  }
  return (await res.json()) as DriveSnapshot;
}

export async function uploadSnapshot(
  accessToken: string,
  snapshot: DriveSnapshot,
  existingFileId: string | null,
): Promise<{ id: string; modifiedTime?: string }> {
  const metadata = {
    name: FILE_NAME,
    parents: existingFileId ? undefined : ['appDataFolder'],
    mimeType: 'application/json',
  };
  const boundary = `calendar_app_${Date.now()}`;
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(snapshot)}\r\n` +
    `--${boundary}--`;

  const url = existingFileId
    ? `${UPLOAD_API}/files/${existingFileId}?uploadType=multipart&fields=id,modifiedTime`
    : `${UPLOAD_API}/files?uploadType=multipart&fields=id,modifiedTime`;

  const res = await driveFetch(accessToken, url, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive upload failed: ${res.status} ${text}`);
  }

  return (await res.json()) as { id: string; modifiedTime?: string };
}
