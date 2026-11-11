import { getDb } from '@/src/data/db';
import type { AppMeta } from '@/src/domain/types';
import { SCHEMA_VERSION } from '@/src/domain/types';

type MetaRow = {
  schema_version: number;
  updated_at: string;
  last_drive_revision: string | null;
  last_synced_at: string | null;
};

export async function getMeta(): Promise<AppMeta> {
  const db = await getDb();
  const row = await db.getFirstAsync<MetaRow>(
    'SELECT schema_version, updated_at, last_drive_revision, last_synced_at FROM meta WHERE id = 1',
  );
  if (!row) {
    return {
      schemaVersion: SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      lastDriveRevision: null,
      lastSyncedAt: null,
    };
  }
  return {
    schemaVersion: row.schema_version,
    updatedAt: row.updated_at,
    lastDriveRevision: row.last_drive_revision,
    lastSyncedAt: row.last_synced_at,
  };
}

export async function setMeta(partial: Partial<AppMeta>): Promise<void> {
  const current = await getMeta();
  const next: AppMeta = {
    schemaVersion: partial.schemaVersion ?? current.schemaVersion,
    updatedAt: partial.updatedAt ?? current.updatedAt,
    lastDriveRevision:
      partial.lastDriveRevision !== undefined
        ? partial.lastDriveRevision
        : current.lastDriveRevision,
    lastSyncedAt:
      partial.lastSyncedAt !== undefined
        ? partial.lastSyncedAt
        : current.lastSyncedAt,
  };
  const db = await getDb();
  await db.runAsync(
    `UPDATE meta
     SET schema_version = ?, updated_at = ?, last_drive_revision = ?, last_synced_at = ?
     WHERE id = 1`,
    next.schemaVersion,
    next.updatedAt,
    next.lastDriveRevision,
    next.lastSyncedAt,
  );
}
