import * as apartmentsRepo from '@/src/data/repositories/apartments';
import * as contactsRepo from '@/src/data/repositories/contacts';
import * as metaRepo from '@/src/data/repositories/meta';
import * as reservationsRepo from '@/src/data/repositories/reservations';
import {
  downloadSnapshot,
  findAppDataFile,
  uploadSnapshot,
} from '@/src/data/drive/client';
import type { DriveSnapshot } from '@/src/domain/types';
import { SCHEMA_VERSION } from '@/src/domain/types';

export async function exportLocalSnapshot(): Promise<DriveSnapshot> {
  const meta = await metaRepo.getMeta();
  const [apartments, reservations, contacts] = await Promise.all([
    apartmentsRepo.listApartments(),
    reservationsRepo.listAllReservations(),
    contactsRepo.listContacts(),
  ]);

  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: meta.updatedAt,
    apartments,
    reservations,
    contacts,
  };
}

export async function importSnapshot(snapshot: DriveSnapshot): Promise<void> {
  // Contacts first (FK from reservations), then apartments, then reservations
  await contactsRepo.replaceAllContacts(snapshot.contacts ?? []);
  await apartmentsRepo.replaceAllApartments(snapshot.apartments ?? []);
  await reservationsRepo.replaceAllReservations(snapshot.reservations ?? []);
  await metaRepo.setMeta({
    schemaVersion: snapshot.schemaVersion ?? SCHEMA_VERSION,
    updatedAt: snapshot.updatedAt ?? new Date().toISOString(),
  });
}

/**
 * Pull-then-push sync. Newest updatedAt wins.
 */
export async function syncWithDrive(accessToken: string): Promise<{
  direction: 'pulled' | 'pushed' | 'created';
  updatedAt: string;
}> {
  const local = await exportLocalSnapshot();
  const remoteFile = await findAppDataFile(accessToken);

  if (!remoteFile) {
    const uploaded = await uploadSnapshot(accessToken, local, null);
    const now = new Date().toISOString();
    await metaRepo.setMeta({
      lastDriveRevision: uploaded.id,
      lastSyncedAt: now,
      updatedAt: local.updatedAt,
    });
    return { direction: 'created', updatedAt: now };
  }

  const remote = await downloadSnapshot(accessToken, remoteFile.id);
  const localTime = Date.parse(local.updatedAt);
  const remoteTime = Date.parse(remote.updatedAt || '1970-01-01');

  if (remoteTime > localTime) {
    await importSnapshot(remote);
    const now = new Date().toISOString();
    await metaRepo.setMeta({
      lastDriveRevision: remoteFile.id,
      lastSyncedAt: now,
      updatedAt: remote.updatedAt,
    });
    return { direction: 'pulled', updatedAt: now };
  }

  const uploaded = await uploadSnapshot(accessToken, local, remoteFile.id);
  const now = new Date().toISOString();
  await metaRepo.setMeta({
    lastDriveRevision: uploaded.id,
    lastSyncedAt: now,
  });
  return { direction: 'pushed', updatedAt: now };
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleDrivePush(
  getAccessToken: () => string | null,
  delayMs = 1000,
): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await syncWithDrive(token);
    } catch (e) {
      console.warn('Drive push failed', e);
    }
  }, delayMs);
}
