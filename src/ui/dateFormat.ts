import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDay(isoDate: string): string {
  const d = parseISO(isoDate);
  if (!isValid(d)) return isoDate;
  return format(d, "d MMM yyyy", { locale: es });
}

export function formatRange(start: string, end: string): string {
  return `${formatDay(start)} → ${formatDay(end)}`;
}

export function paymentLabel(status: string): string {
  switch (status) {
    case 'paid':
      return 'Pagado';
    case 'partial':
      return 'Parcial';
    default:
      return 'Sin pagar';
  }
}
