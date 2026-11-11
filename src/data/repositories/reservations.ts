import { getDb } from '@/src/data/db';
import type { Reservation, ReservationKind, PaymentStatus } from '@/src/domain/types';

type ReservationRow = {
  id: string;
  apartment_id: string;
  uid: string;
  start: string;
  end: string;
  kind: ReservationKind;
  summary: string;
  airbnb_url: string | null;
  phone_last4: string | null;
  notes: string | null;
  contact_id: string | null;
  payment_status: PaymentStatus;
  payment_amount: number | null;
  payment_currency: string;
  payment_notes: string | null;
  updated_at: string;
};

function mapReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    apartmentId: row.apartment_id,
    uid: row.uid,
    start: row.start,
    end: row.end,
    kind: row.kind,
    summary: row.summary,
    airbnbUrl: row.airbnb_url,
    phoneLast4: row.phone_last4,
    notes: row.notes,
    contactId: row.contact_id,
    paymentStatus: row.payment_status,
    paymentAmount: row.payment_amount,
    paymentCurrency: row.payment_currency,
    paymentNotes: row.payment_notes,
    updatedAt: row.updated_at,
  };
}

const UPSERT_SQL = `
  INSERT INTO reservations (
    id, apartment_id, uid, start, end, kind, summary, airbnb_url, phone_last4,
    notes, contact_id, payment_status, payment_amount, payment_currency,
    payment_notes, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    apartment_id = excluded.apartment_id,
    uid = excluded.uid,
    start = excluded.start,
    end = excluded.end,
    kind = excluded.kind,
    summary = excluded.summary,
    airbnb_url = excluded.airbnb_url,
    phone_last4 = excluded.phone_last4,
    notes = excluded.notes,
    contact_id = excluded.contact_id,
    payment_status = excluded.payment_status,
    payment_amount = excluded.payment_amount,
    payment_currency = excluded.payment_currency,
    payment_notes = excluded.payment_notes,
    updated_at = excluded.updated_at
`;

function bindReservation(r: Reservation): (string | number | null)[] {
  return [
    r.id,
    r.apartmentId,
    r.uid,
    r.start,
    r.end,
    r.kind,
    r.summary,
    r.airbnbUrl,
    r.phoneLast4,
    r.notes,
    r.contactId,
    r.paymentStatus,
    r.paymentAmount,
    r.paymentCurrency,
    r.paymentNotes,
    r.updatedAt,
  ];
}

export async function listReservationsByApartment(
  apartmentId: string,
): Promise<Reservation[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ReservationRow>(
    'SELECT * FROM reservations WHERE apartment_id = ? ORDER BY start ASC',
    apartmentId,
  );
  return rows.map(mapReservation);
}

export async function listReservationsByContact(
  contactId: string,
): Promise<Reservation[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ReservationRow>(
    'SELECT * FROM reservations WHERE contact_id = ? ORDER BY start DESC',
    contactId,
  );
  return rows.map(mapReservation);
}

export async function listAllReservations(): Promise<Reservation[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ReservationRow>(
    'SELECT * FROM reservations ORDER BY start ASC',
  );
  return rows.map(mapReservation);
}

export async function getReservation(id: string): Promise<Reservation | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ReservationRow>(
    'SELECT * FROM reservations WHERE id = ?',
    id,
  );
  return row ? mapReservation(row) : null;
}

export async function upsertReservation(reservation: Reservation): Promise<void> {
  const db = await getDb();
  await db.runAsync(UPSERT_SQL, ...bindReservation(reservation));
  await touchMeta();
}

export async function upsertManyReservations(
  reservations: Reservation[],
): Promise<void> {
  if (reservations.length === 0) return;
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const r of reservations) {
      await db.runAsync(UPSERT_SQL, ...bindReservation(r));
    }
  });
  await touchMeta();
}

export async function deleteReservationsByUids(
  apartmentId: string,
  uids: string[],
): Promise<void> {
  if (uids.length === 0) return;
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const uid of uids) {
      await db.runAsync(
        'DELETE FROM reservations WHERE apartment_id = ? AND uid = ?',
        apartmentId,
        uid,
      );
    }
  });
  await touchMeta();
}

export async function replaceAllReservations(
  reservations: Reservation[],
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM reservations');
    for (const r of reservations) {
      await db.runAsync(UPSERT_SQL, ...bindReservation(r));
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
