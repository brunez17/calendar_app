import ICAL from 'ical.js';

import type { ParsedIcsEvent, ReservationKind } from '@/src/domain/types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateString(value: ICAL.Time): string {
  if (value.isDate) {
    return `${value.year}-${pad(value.month)}-${pad(value.day)}`;
  }
  const js = value.toJSDate();
  return `${js.getFullYear()}-${pad(js.getMonth() + 1)}-${pad(js.getDate())}`;
}

function inferKind(summary: string): ReservationKind {
  const lower = summary.toLowerCase();
  if (lower.includes('not available') || lower.includes('blocked')) {
    return 'blocked';
  }
  return 'reserved';
}

function parseDescription(description: string | null | undefined): {
  airbnbUrl: string | null;
  phoneLast4: string | null;
} {
  if (!description) {
    return { airbnbUrl: null, phoneLast4: null };
  }

  const normalized = description.replace(/\\n/g, '\n');
  const urlMatch = normalized.match(/https?:\/\/[^\s\\]+/i);
  const phoneMatch = normalized.match(
    /Phone Number \(Last 4 Digits\):\s*(\d{4})/i,
  );

  return {
    airbnbUrl: urlMatch?.[0] ?? null,
    phoneLast4: phoneMatch?.[1] ?? null,
  };
}

export function parseIcs(content: string): ParsedIcsEvent[] {
  const jcal = ICAL.parse(content);
  const comp = new ICAL.Component(jcal);
  const vevents = comp.getAllSubcomponents('vevent');
  const events: ParsedIcsEvent[] = [];

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);
    const uid = event.uid || `${event.summary}-${event.startDate}`;
    if (!event.startDate || !event.endDate) continue;

    const summary = event.summary || 'Reservation';
    const { airbnbUrl, phoneLast4 } = parseDescription(event.description);

    events.push({
      uid,
      start: toDateString(event.startDate),
      end: toDateString(event.endDate),
      kind: inferKind(summary),
      summary,
      airbnbUrl,
      phoneLast4,
    });
  }

  return events;
}
