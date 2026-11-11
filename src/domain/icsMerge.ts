import { createId } from './ids';
import type { ParsedIcsEvent, Reservation } from './types';

export type MergeResult = {
  toInsert: Reservation[];
  toUpdate: Reservation[];
  removedUids: string[];
};

/**
 * Merge ICS events into existing reservations for one apartment.
 * Enriched fields (payment, contact, notes) are preserved on UID match.
 */
export function mergeIcsEvents(
  apartmentId: string,
  existing: Reservation[],
  events: ParsedIcsEvent[],
  now = new Date().toISOString(),
): MergeResult {
  const byUid = new Map(existing.map((r) => [r.uid, r]));
  const seen = new Set<string>();
  const toInsert: Reservation[] = [];
  const toUpdate: Reservation[] = [];

  for (const event of events) {
    seen.add(event.uid);
    const prev = byUid.get(event.uid);
    if (!prev) {
      toInsert.push({
        id: createId(),
        apartmentId,
        uid: event.uid,
        start: event.start,
        end: event.end,
        kind: event.kind,
        summary: event.summary,
        airbnbUrl: event.airbnbUrl,
        phoneLast4: event.phoneLast4,
        notes: null,
        contactId: null,
        paymentStatus: 'unpaid',
        paymentAmount: null,
        paymentCurrency: 'ARS',
        paymentNotes: null,
        updatedAt: now,
      });
      continue;
    }

    toUpdate.push({
      ...prev,
      start: event.start,
      end: event.end,
      kind: event.kind,
      summary: event.summary,
      airbnbUrl: event.airbnbUrl ?? prev.airbnbUrl,
      phoneLast4: event.phoneLast4 ?? prev.phoneLast4,
      updatedAt: now,
    });
  }

  const removedUids = existing
    .filter((r) => !seen.has(r.uid))
    .map((r) => r.uid);

  return { toInsert, toUpdate, removedUids };
}
