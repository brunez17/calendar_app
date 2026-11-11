import * as SQLite from 'expo-sqlite';

import { SCHEMA_VERSION } from '@/src/domain/types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('calendar_app.db');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      schema_version INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      last_drive_revision TEXT,
      last_synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS apartments (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      ics_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY NOT NULL,
      apartment_id TEXT NOT NULL,
      uid TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      kind TEXT NOT NULL,
      summary TEXT NOT NULL,
      airbnb_url TEXT,
      phone_last4 TEXT,
      notes TEXT,
      contact_id TEXT,
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      payment_amount REAL,
      payment_currency TEXT NOT NULL DEFAULT 'ARS',
      payment_notes TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(apartment_id, uid),
      FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reservations_apartment
      ON reservations(apartment_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_start
      ON reservations(start);
  `);

  const meta = await db.getFirstAsync<{ schema_version: number }>(
    'SELECT schema_version FROM meta WHERE id = 1',
  );
  if (!meta) {
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO meta (id, schema_version, updated_at, last_drive_revision, last_synced_at)
       VALUES (1, ?, ?, NULL, NULL)`,
      SCHEMA_VERSION,
      now,
    );
  }
}

export async function resetDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM reservations;
    DELETE FROM contacts;
    DELETE FROM apartments;
    UPDATE meta SET updated_at = datetime('now'), last_drive_revision = NULL, last_synced_at = NULL WHERE id = 1;
  `);
}
