"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { getWeekProductionAction } from "@/src/actions/production.actions"
import { getWeekRange } from "@/src/lib/utils/production.utils"
import { BREAD_TYPES, type ProductionRecord, type WeekRange } from "@/src/types/production.types"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, ChefHat } from "lucide-react"

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

// Genera los 7 días de la semana a partir del lunes
function getWeekDays(weekFrom: string): string[] {
  const days: string[] = []
  const from = parseISO(weekFrom)
  for (let i = 0; i < 7; i++) {
    const d = new Date(from)
    d.setDate(from.getDate() + i)
    days.push(format(d, "yyyy-MM-dd"))
  }
  return days
}

// Formatea "2026-03-19" → "19"
function dayNum(date: string) {
  return format(parseISO(date), "d", { locale: es })
}

interface Props {
  initialRecords: ProductionRecord[]
  initialWeek:    WeekRange
  today:          string
}

export function ProductionWeekTable({ initialRecords, initialWeek, today }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [week,    setWeek]    = useState(initialWeek)
  const [records, setRecords] = useState(initialRecords)

  // referencia para calcular offsets: siempre desde hoy
  const [weekOffset, setWeekOffset] = useState(0)

  function navigate(delta: number) {
    const newOffset = weekOffset + delta
    startTransition(async () => {
      const newWeek = getWeekRange(today, newOffset)
      const result  = await getWeekProductionAction(newWeek.from, newWeek.to)
      setWeekOffset(newOffset)
      setWeek(newWeek)
      if (result.success) setRecords(result.data)
    })
  }

  const days    = getWeekDays(week.from)
  // Mapa rápido: fecha → record
  const recMap  = new Map(records.map((r) => [r.recordDate, r]))
  // Totales por tipo de pan (solo días con registro)
  const totals  = Object.fromEntries(
    BREAD_TYPES.map(({ key }) => [
      key,
      records.reduce((s, r) => s + (r.quantities[key] ?? 0), 0),
    ])
  )
  const hasAny = records.length > 0

  return (
    <div className="card">
      {/* Header con navegación */}
      <div className="card-header">
        <span className="card-title hidden sm:block">Historial semanal</span>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            className="flex size-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 transition-colors"
            onClick={() => navigate(-1)}
            disabled={isPending}
            title="Semana anterior"
          >
            <ChevronLeft className="size-4" />
          </button>

          <span className="text-sm font-semibold text-stone-700 tabular-nums">
            {week.label}
          </span>

          <button
            className="flex size-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 transition-colors"
            onClick={() => navigate(1)}
            disabled={isPending || weekOffset >= 0}
            title="Semana siguiente"
          >
            <ChevronRight className="size-4" />
          </button>

          {weekOffset !== 0 && (
            <button
              className="btn-ghost btn-sm text-xs text-amber-600"
              onClick={() => navigate(-weekOffset)}
              disabled={isPending}
            >
              Hoy
            </button>
          )}
        </div>
      </div>

      {!hasAny ? (
        <div className="card-body">
          <div className="flex flex-col items-center gap-3 py-10">
            <ChefHat className="size-10 text-stone-200" />
            <p className="text-sm text-stone-400">Sin registros esta semana.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Tabla desktop */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-400 w-32">
                    Tipo
                  </th>
                  {days.map((d, i) => {
                    const isToday = d === today
                    const hasRec  = recMap.has(d)
                    return (
                      <th
                        key={d}
                        className={`px-2 py-3 text-center text-xs font-semibold w-16 ${
                          isToday ? "text-amber-700" : "text-stone-500"
                        }`}
                      >
                        <div>{DAY_LABELS[i]}</div>
                        <div className={`text-lg font-bold tabular-nums ${
                          isToday ? "text-amber-700" : hasRec ? "text-stone-800" : "text-stone-300"
                        }`}>
                          {dayNum(d)}
                        </div>
                      </th>
                    )
                  })}
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-stone-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {BREAD_TYPES.map(({ key, label }, idx) => (
                  <tr
                    key={key}
                    className={idx % 2 === 0 ? "bg-white" : "bg-stone-50/50"}
                  >
                    <td className="px-4 py-2.5 text-sm font-medium text-stone-700 whitespace-nowrap">
                      {label}
                    </td>
                    {days.map((d) => {
                      const rec = recMap.get(d)
                      const val = rec?.quantities[key] ?? null
                      return (
                        <td key={d} className="px-2 py-2.5 text-center">
                          {val === null ? (
                            <span className="text-stone-200">—</span>
                          ) : val === 0 ? (
                            <span className="text-stone-300">0</span>
                          ) : (
                            <span className="tabular-nums font-bold text-stone-900">{val}</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-center">
                      <span className={`tabular-nums font-bold text-sm ${totals[key] > 0 ? "text-amber-700" : "text-stone-300"}`}>
                        {totals[key] > 0 ? totals[key] : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Fila de totales */}
                <tr className="border-t-2 border-stone-200 bg-amber-50/50">
                  <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Total latas
                  </td>
                  {days.map((d) => {
                    const rec   = recMap.get(d)
                    const total = rec
                      ? Object.values(rec.quantities).reduce((s, v) => s + v, 0)
                      : null
                    return (
                      <td key={d} className="px-2 py-3 text-center">
                        {total === null ? (
                          <span className="text-stone-200">—</span>
                        ) : (
                          <span className="tabular-nums font-bold text-amber-700">{total}</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-3 py-3 text-center">
                    <span className="tabular-nums font-bold text-amber-700">
                      {records.reduce((s, r) => s + Object.values(r.quantities).reduce((a, b) => a + b, 0), 0)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notas de la semana — debajo de la tabla, formato "Día — nota" */}
          {records.some((r) => r.notes) && (
            <div className="border-t border-stone-100 px-4 py-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
                Notas de la semana
              </p>
              {days.map((d, i) => {
                const rec = recMap.get(d)
                if (!rec?.notes) return null
                return (
                  <div key={d} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 font-semibold text-stone-600 w-24">
                      {DAY_LABELS[i]} {dayNum(d)}
                    </span>
                    <span className="text-stone-500 italic">{rec.notes}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Vista mobile: cards por día */}
          <div className="sm:hidden divide-y divide-stone-100">
            {days.map((d, i) => {
              const rec     = recMap.get(d)
              const isToday = d === today
              const total   = rec ? Object.values(rec.quantities).reduce((s, v) => s + v, 0) : 0
              if (!rec) return null
              return (
                <div key={d} className={`px-4 py-4 ${isToday ? "bg-amber-50/40" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isToday ? "text-amber-700" : "text-stone-700"}`}>
                        {DAY_LABELS[i]} {dayNum(d)}
                      </span>
                      {isToday && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Hoy</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-amber-700">{total} latas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {BREAD_TYPES.filter(({ key }) => rec.quantities[key] > 0).map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-stone-500 truncate mr-2">{label}</span>
                        <span className="font-bold tabular-nums text-stone-900">{rec.quantities[key]}</span>
                      </div>
                    ))}
                  </div>
                  {rec.notes && (
                    <p className="mt-2 text-xs text-stone-400 italic">{rec.notes}</p>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
