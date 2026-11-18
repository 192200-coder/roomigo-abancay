/**
 * Utilidades de fechas para reservas por meses.
 *
 * Trabajan con cadenas ISO locales (YYYY-MM-DD) para evitar el desfase de
 * `toISOString()`, que usa UTC: en Perú (UTC-5) después de las 19:00 devolvía el día siguiente.
 */

export const BOOKING_MIN_MONTHS = 1;
export const BOOKING_MAX_MONTHS = 12;

/** Fecha local en formato YYYY-MM-DD. */
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Mañana en hora local (el backend exige una fecha de inicio futura). */
export function tomorrowIsoDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toLocalIsoDate(date);
}

/**
 * Suma meses a una fecha ISO con el mismo criterio que `LocalDate.plusMonths` en Java:
 * si el día no existe en el mes destino se usa el último día (31-ene + 1 mes = 28-feb).
 */
export function addMonthsIso(iso: string, months: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!match) return '';
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1 + months;
  const day = Number(match[3]);
  const lastDayOfTarget = new Date(year, monthIndex + 1, 0).getDate();
  return toLocalIsoDate(new Date(year, monthIndex, Math.min(day, lastDayOfTarget)));
}

/** Limita el número de meses al rango permitido. */
export function clampBookingMonths(months: number): number {
  if (!Number.isFinite(months)) return BOOKING_MIN_MONTHS;
  return Math.min(BOOKING_MAX_MONTHS, Math.max(BOOKING_MIN_MONTHS, Math.round(months)));
}
