import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
  formatDistanceToNow,
} from "date-fns";
import { es } from "date-fns/locale";

const LOCALE = es;
const TZ_OFFSET = "America/Argentina/Buenos_Aires";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: LOCALE });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: LOCALE });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm", { locale: LOCALE });
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { locale: LOCALE, addSuffix: true });
}

// Rangos para filtros de panel gerencial
export function getDayRange(date: Date = new Date()) {
  return { from: startOfDay(date), to: endOfDay(date) };
}

export function getWeekRange(date: Date = new Date()) {
  return {
    from: startOfWeek(date, { weekStartsOn: 1 }), // lunes
    to: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function getMonthRange(date: Date = new Date()) {
  return { from: startOfMonth(date), to: endOfMonth(date) };
}

// Formatea para queries SQL (ISO string sin ms)
export function toSQLTimestamp(date: Date): string {
  return date.toISOString();
}

export function isInRange(date: Date, from: Date, to: Date): boolean {
  return isWithinInterval(date, { start: from, end: to });
}

// Convierte string ISO de Supabase a Date
export function fromSupabase(isoString: string): Date {
  return parseISO(isoString);
}
