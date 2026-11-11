import { create } from 'zustand';

import { syncApartmentFromUrl, importIcsFromUri } from '@/src/data/ics/importService';
import { scheduleDrivePush, syncWithDrive } from '@/src/data/drive/sync';
import * as apartmentsRepo from '@/src/data/repositories/apartments';
import * as contactsRepo from '@/src/data/repositories/contacts';
import * as metaRepo from '@/src/data/repositories/meta';
import * as reservationsRepo from '@/src/data/repositories/reservations';
import { nextApartmentColor } from '@/src/domain/colors';
import { createId } from '@/src/domain/ids';
import type {
  Apartment,
  Contact,
  PaymentStatus,
  Reservation,
} from '@/src/domain/types';

type AppState = {
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  apartments: Apartment[];
  contacts: Contact[];
  reservationsByApartment: Record<string, Reservation[]>;
  selectedApartmentReservations: Reservation[];
  lastSyncedAt: string | null;
  getAccessToken: (() => string | null) | null;

  setAccessTokenGetter: (fn: () => string | null) => void;
  hydrate: () => Promise<void>;
  refreshApartments: () => Promise<void>;
  refreshContacts: () => Promise<void>;
  loadApartmentReservations: (apartmentId: string) => Promise<void>;
  createApartment: (input: {
    name: string;
    color?: string;
    icsUrl?: string | null;
  }) => Promise<Apartment>;
  updateApartment: (
    id: string,
    input: { name: string; color: string; icsUrl: string | null },
  ) => Promise<void>;
  deleteApartment: (id: string) => Promise<void>;
  importIcsFile: (apartmentId: string, uri: string) => Promise<string>;
  syncIcsUrl: (apartmentId: string, url?: string | null) => Promise<string>;
  updateReservation: (
    id: string,
    patch: Partial<
      Pick<
        Reservation,
        | 'notes'
        | 'contactId'
        | 'paymentStatus'
        | 'paymentAmount'
        | 'paymentCurrency'
        | 'paymentNotes'
      >
    >,
  ) => Promise<void>;
  getReservation: (id: string) => Promise<Reservation | null>;
  createContact: (input: {
    name: string;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
  }) => Promise<Contact>;
  updateContact: (
    id: string,
    input: {
      name: string;
      phone: string | null;
      email: string | null;
      notes: string | null;
    },
  ) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getContactReservations: (contactId: string) => Promise<Reservation[]>;
  syncDrive: () => Promise<string>;
  clearError: () => void;
};

function queuePush(get: () => AppState) {
  const getter = get().getAccessToken;
  if (!getter) return;
  scheduleDrivePush(getter);
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  loading: false,
  error: null,
  apartments: [],
  contacts: [],
  reservationsByApartment: {},
  selectedApartmentReservations: [],
  lastSyncedAt: null,
  getAccessToken: null,

  setAccessTokenGetter: (fn) => set({ getAccessToken: fn }),

  clearError: () => set({ error: null }),

  hydrate: async () => {
    set({ loading: true, error: null });
    try {
      const [apartments, contacts, meta] = await Promise.all([
        apartmentsRepo.listApartments(),
        contactsRepo.listContacts(),
        metaRepo.getMeta(),
      ]);
      set({
        apartments,
        contacts,
        lastSyncedAt: meta.lastSyncedAt,
        hydrated: true,
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Error al cargar datos' });
    } finally {
      set({ loading: false });
    }
  },

  refreshApartments: async () => {
    const apartments = await apartmentsRepo.listApartments();
    set({ apartments });
  },

  refreshContacts: async () => {
    const contacts = await contactsRepo.listContacts();
    set({ contacts });
  },

  loadApartmentReservations: async (apartmentId) => {
    const list = await reservationsRepo.listReservationsByApartment(apartmentId);
    set((state) => ({
      selectedApartmentReservations: list,
      reservationsByApartment: {
        ...state.reservationsByApartment,
        [apartmentId]: list,
      },
    }));
  },

  createApartment: async ({ name, color, icsUrl }) => {
    const apartments = get().apartments;
    const apartment: Apartment = {
      id: createId(),
      name: name.trim(),
      color: color ?? nextApartmentColor(apartments.length),
      icsUrl: icsUrl?.trim() || null,
      createdAt: new Date().toISOString(),
    };
    await apartmentsRepo.upsertApartment(apartment);
    await get().refreshApartments();
    queuePush(get);
    return apartment;
  },

  updateApartment: async (id, input) => {
    const current = await apartmentsRepo.getApartment(id);
    if (!current) throw new Error('Departamento no encontrado');
    await apartmentsRepo.upsertApartment({
      ...current,
      name: input.name.trim(),
      color: input.color,
      icsUrl: input.icsUrl?.trim() || null,
    });
    await get().refreshApartments();
    queuePush(get);
  },

  deleteApartment: async (id) => {
    await apartmentsRepo.deleteApartment(id);
    await get().refreshApartments();
    queuePush(get);
  },

  importIcsFile: async (apartmentId, uri) => {
    set({ loading: true, error: null });
    try {
      const result = await importIcsFromUri(apartmentId, uri);
      await get().loadApartmentReservations(apartmentId);
      queuePush(get);
      return `Importadas: ${result.inserted} nuevas, ${result.updated} actualizadas, ${result.removed} eliminadas`;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al importar ICS';
      set({ error: msg });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  syncIcsUrl: async (apartmentId, url) => {
    set({ loading: true, error: null });
    try {
      const result = await syncApartmentFromUrl(apartmentId, url);
      await get().refreshApartments();
      await get().loadApartmentReservations(apartmentId);
      queuePush(get);
      return `Sync: ${result.inserted} nuevas, ${result.updated} actualizadas, ${result.removed} eliminadas`;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al sincronizar URL';
      set({ error: msg });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  updateReservation: async (id, patch) => {
    const current = await reservationsRepo.getReservation(id);
    if (!current) throw new Error('Reserva no encontrada');
    const next: Reservation = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await reservationsRepo.upsertReservation(next);
    await get().loadApartmentReservations(current.apartmentId);
    queuePush(get);
  },

  getReservation: async (id) => reservationsRepo.getReservation(id),

  createContact: async (input) => {
    const contact: Contact = {
      id: createId(),
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
      createdAt: new Date().toISOString(),
    };
    await contactsRepo.upsertContact(contact);
    await get().refreshContacts();
    queuePush(get);
    return contact;
  },

  updateContact: async (id, input) => {
    const current = await contactsRepo.getContact(id);
    if (!current) throw new Error('Contacto no encontrado');
    await contactsRepo.upsertContact({
      ...current,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
    });
    await get().refreshContacts();
    queuePush(get);
  },

  deleteContact: async (id) => {
    await contactsRepo.deleteContact(id);
    await get().refreshContacts();
    queuePush(get);
  },

  getContactReservations: async (contactId) =>
    reservationsRepo.listReservationsByContact(contactId),

  syncDrive: async () => {
    const token = get().getAccessToken?.() ?? null;
    if (!token) {
      throw new Error('Iniciá sesión con Google para sincronizar Drive');
    }
    set({ loading: true, error: null });
    try {
      const result = await syncWithDrive(token);
      const meta = await metaRepo.getMeta();
      set({ lastSyncedAt: meta.lastSyncedAt });
      await get().hydrate();
      const label =
        result.direction === 'pulled'
          ? 'Datos bajados desde Drive'
          : result.direction === 'created'
            ? 'Archivo creado en Drive'
            : 'Datos subidos a Drive';
      return label;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error de sync con Drive';
      set({ error: msg });
      throw e;
    } finally {
      set({ loading: false });
    }
  },
}));

export type { PaymentStatus };
