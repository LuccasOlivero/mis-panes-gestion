import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import type { DashboardPeriod, DateRange } from "@/src/types/dashboard.types";

/**
 * Formatea solo la hora. Ej: "14:32"
 */
export function formatTime(dateStr: string): string {
  return format(new Date(dateStr), "HH:mm", { locale: es });
}

/**
 * Formatea fecha y hora completa. Ej: "25/02/2026 14:32"
 */
export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: es });
}

/**
 * Formatea solo la fecha. Ej: "25/02/2026"
 */
export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: es });
}

/**
 * Devuelve el rango de fechas ISO para un período dado.
 * Función pura — no es Server Action.
 */
export function getRangeForPeriod(
  period: DashboardPeriod,
  custom?: DateRange,
): DateRange {
  const now = new Date();
  switch (period) {
    case "today":
      return {
        from: startOfDay(now).toISOString(),
        to: endOfDay(now).toISOString(),
      };
    case "week":
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
        to: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
      };
    case "month":
      return {
        from: startOfMonth(now).toISOString(),
        to: endOfMonth(now).toISOString(),
      };
    case "custom":
      if (!custom) throw new Error("Rango personalizado requerido");
      return {
        from: startOfDay(parseISO(custom.from)).toISOString(),
        to: endOfDay(parseISO(custom.to)).toISOString(),
      };
  }
}

/**
 * Devuelve el período anterior equivalente en duración.
 * Función pura — no es Server Action.
 */
export function getPrevRange(
  period: DashboardPeriod,
  current: DateRange,
): DateRange {
  const now = new Date();
  switch (period) {
    case "today":
      return {
        from: startOfDay(subDays(now, 1)).toISOString(),
        to: endOfDay(subDays(now, 1)).toISOString(),
      };
    case "week":
      return {
        from: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }).toISOString(),
        to: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }).toISOString(),
      };
    case "month":
      return {
        from: startOfMonth(subMonths(now, 1)).toISOString(),
        to: endOfMonth(subMonths(now, 1)).toISOString(),
      };
    case "custom": {
      const fromDate = parseISO(current.from);
      const toDate = parseISO(current.to);
      const diffMs = toDate.getTime() - fromDate.getTime();
      return {
        from: new Date(fromDate.getTime() - diffMs).toISOString(),
        to: new Date(toDate.getTime() - diffMs).toISOString(),
      };
    }
  }
}
