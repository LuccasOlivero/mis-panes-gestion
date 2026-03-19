import { startOfWeek, endOfWeek, addWeeks, format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import type { WeekRange } from "@/src/types/production.types"

export function getWeekRange(referenceDate: string, offsetWeeks = 0): WeekRange {
  const base = addWeeks(parseISO(referenceDate), offsetWeeks)
  const from = startOfWeek(base, { weekStartsOn: 1 })
  const to   = endOfWeek(base,   { weekStartsOn: 1 })

  const fromFmt = format(from, "d", { locale: es })
  const toFmt   = format(to, "d MMM yyyy", { locale: es })

  return {
    from:  format(from, "yyyy-MM-dd"),
    to:    format(to,   "yyyy-MM-dd"),
    label: `${fromFmt} – ${toFmt}`,
  }
}
