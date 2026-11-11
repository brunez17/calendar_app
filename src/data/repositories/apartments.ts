import { getDb } from '@/src/data/db';
import type { Apartment } from '@/src/domain/types';

type ApartmentRow = {
  id: string;
  name: string;
  color: string;
  ics_url: string | null;
  created_at: string;
};

function mapApartment(row: ApartmentRow): Apartment {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icsUrl: row.ics_url,
    createdAt: row.created_at,
  };
}

export async function listApartments(): Promise<Apartment[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ApartmentRow>(
    'SELECT * FROM apartments ORDER BY name COLLATE NOCASE ASC',
  );
  return rows.map(mapApartment);
}

export async function getApartment(id: string): Promise<Apartment | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ApartmentRow>(
    'SELECT * FROM apartments WHERE id = ?',
    id,
  );
  return row ? mapApartment(row) : null;
}

export async function upsertApartment(apartment: Apartment): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO apartments (id, name, color, ics_url, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       color = excluded.color,
       ics_url = excluded.ics_url`,
    apartment.id,
    apartment.name,
    apartment.color,
    apartment.icsUrl,
    apartment.createdAt,
  );
  await touchMeta();
}

export async function deleteApartment(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM apartments WHERE id = ?', id);
  await touchMeta();
}

export async function replaceAllApartments(apartments: Apartment[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM apartments');
    for (const a of apartments) {
      await db.runAsync(
        `INSERT INTO apartments (id, name, color, ics_url, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        a.id,
        a.name,
        a.color,
        a.icsUrl,
        a.createdAt,
      );
    }
  });
}

async function touchMeta(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE meta SET updated_at = ? WHERE id = 1`,
    new Date().toISOString(),
  );
}
