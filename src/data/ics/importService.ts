import * as FileSystem from 'expo-file-system/legacy';

import { parseIcs } from '@/src/data/ics/parser';
import * as apartmentsRepo from '@/src/data/repositories/apartments';
import * as reservationsRepo from '@/src/data/repositories/reservations';
import { mergeIcsEvents } from '@/src/domain/icsMerge';

export async function importIcsContent(
  apartmentId: string,
  content: string,
): Promise<{ inserted: number; updated: number; removed: number }> {
  const apartment = await apartmentsRepo.getApartment(apartmentId);
  if (!apartment) {
    throw new Error('Departamento no encontrado');
  }

  const events = parseIcs(content);
  const existing = await reservationsRepo.listReservationsByApartment(apartmentId);
  const { toInsert, toUpdate, removedUids } = mergeIcsEvents(
    apartmentId,
    existing,
    events,
  );

  await reservationsRepo.upsertManyReservations([...toInsert, ...toUpdate]);
  await reservationsRepo.deleteReservationsByUids(apartmentId, removedUids);

  return {
    inserted: toInsert.length,
    updated: toUpdate.length,
    removed: removedUids.length,
  };
}

export async function importIcsFromUri(
  apartmentId: string,
  uri: string,
): Promise<{ inserted: number; updated: number; removed: number }> {
  const content = await FileSystem.readAsStringAsync(uri);
  return importIcsContent(apartmentId, content);
}

export async function syncApartmentFromUrl(
  apartmentId: string,
  url?: string | null,
): Promise<{ inserted: number; updated: number; removed: number }> {
  const apartment = await apartmentsRepo.getApartment(apartmentId);
  if (!apartment) {
    throw new Error('Departamento no encontrado');
  }
  const icsUrl = url ?? apartment.icsUrl;
  if (!icsUrl) {
    throw new Error('Este departamento no tiene URL de calendario');
  }

  const res = await fetch(icsUrl);
  if (!res.ok) {
    throw new Error(`No se pudo descargar el calendario (${res.status})`);
  }
  const content = await res.text();

  if (url && url !== apartment.icsUrl) {
    await apartmentsRepo.upsertApartment({ ...apartment, icsUrl: url });
  }

  return importIcsContent(apartmentId, content);
}
