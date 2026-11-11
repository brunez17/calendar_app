import { getDb } from '@/src/data/db';
import type { Contact } from '@/src/domain/types';

type ContactRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};

function mapContact(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function listContacts(): Promise<Contact[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ContactRow>(
    'SELECT * FROM contacts ORDER BY name COLLATE NOCASE ASC',
  );
  return rows.map(mapContact);
}

export async function getContact(id: string): Promise<Contact | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ContactRow>(
    'SELECT * FROM contacts WHERE id = ?',
    id,
  );
  return row ? mapContact(row) : null;
}

export async function upsertContact(contact: Contact): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO contacts (id, name, phone, email, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       phone = excluded.phone,
       email = excluded.email,
       notes = excluded.notes`,
    contact.id,
    contact.name,
    contact.phone,
    contact.email,
    contact.notes,
    contact.createdAt,
  );
  await touchMeta();
}

export async function deleteContact(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM contacts WHERE id = ?', id);
  await touchMeta();
}

export async function replaceAllContacts(contacts: Contact[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM contacts');
    for (const c of contacts) {
      await db.runAsync(
        `INSERT INTO contacts (id, name, phone, email, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        c.id,
        c.name,
        c.phone,
        c.email,
        c.notes,
        c.createdAt,
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
