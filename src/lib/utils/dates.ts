import {
  format,
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
} from "date-fns"
import { es } from "date-fns/locale"
import type { DashboardPeriod, DateRange } from "@/src/types/dashboard.types"

export function formatDate(value: string | Date): string {
  return format(new Date(value), "dd/MM/yyyy", { locale: es })
}

export function formatDateTime(value: string | Date): string {
  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: es })
}

export function formatTime(value: string | Date): string {
  return format(new Date(value), "HH:mm", { locale: es })
}

export function getRangeForPeriod(
  period: DashboardPeriod,
  custom?: DateRange
): DateRange {
  const now = new Date()
  switch (period) {
    case "today":
      return {
        from: format(startOfDay(now), "yyyy-MM-dd"),
        to:   format(endOfDay(now),   "yyyy-MM-dd"),
      }
    case "week":
      return {
        from: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        to:   format(endOfWeek(now,   { weekStartsOn: 1 }), "yyyy-MM-dd"),
      }
    case "month":
      return {
        from: format(startOfMonth(now), "yyyy-MM-dd"),
        to:   format(endOfMonth(now),   "yyyy-MM-dd"),
      }
    case "custom":
      return custom ?? getRangeForPeriod("month")
  }
}
