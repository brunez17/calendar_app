export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type ReservationKind = 'reserved' | 'blocked';

export type PaymentInfo = {
  status: PaymentStatus;
  amount: number | null;
  currency: string;
  notes: string | null;
};

export type Apartment = {
  id: string;
  name: string;
  color: string;
  icsUrl: string | null;
  createdAt: string;
};

export type Reservation = {
  id: string;
  apartmentId: string;
  uid: string;
  start: string;
  end: string;
  kind: ReservationKind;
  summary: string;
  airbnbUrl: string | null;
  phoneLast4: string | null;
  notes: string | null;
  contactId: string | null;
  paymentStatus: PaymentStatus;
  paymentAmount: number | null;
  paymentCurrency: string;
  paymentNotes: string | null;
  updatedAt: string;
};

export type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
};

export type AppMeta = {
  schemaVersion: number;
  updatedAt: string;
  lastDriveRevision: string | null;
  lastSyncedAt: string | null;
};

export type ParsedIcsEvent = {
  uid: string;
  start: string;
  end: string;
  kind: ReservationKind;
  summary: string;
  airbnbUrl: string | null;
  phoneLast4: string | null;
};

export type DriveSnapshot = {
  schemaVersion: number;
  updatedAt: string;
  apartments: Apartment[];
  reservations: Reservation[];
  contacts: Contact[];
};

export const SCHEMA_VERSION = 1;

export const DEFAULT_PAYMENT: PaymentInfo = {
  status: 'unpaid',
  amount: null,
  currency: 'ARS',
  notes: null,
};
