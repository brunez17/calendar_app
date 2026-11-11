export const APARTMENT_COLORS = [
  '#1B6CA8',
  '#2A9D8F',
  '#E76F51',
  '#E9C46A',
  '#264653',
  '#9B5DE5',
  '#00BBF9',
  '#F15BB5',
] as const;

export function nextApartmentColor(index: number): string {
  return APARTMENT_COLORS[index % APARTMENT_COLORS.length];
}
