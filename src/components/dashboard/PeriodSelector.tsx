"use client"

import type { DashboardPeriod, DateRange } from "@/src/types/dashboard.types"

const OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "today",  label: "Hoy" },
  { value: "week",   label: "Esta semana" },
  { value: "month",  label: "Este mes" },
  { value: "custom", label: "Personalizado" },
]

interface Props {
  period:     DashboardPeriod
  custom?:    DateRange
  onChange:   (period: DashboardPeriod, custom?: DateRange) => void
  isLoading?: boolean
}

export function PeriodSelector({ period, custom, onChange, isLoading }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">

      {/* Botones de período */}
      <div className="flex rounded-lg border border-stone-200 bg-white p-0.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value, opt.value === "custom" ? custom : undefined)}
            disabled={isLoading}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              period === opt.value
                ? "bg-amber-600 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Inputs de rango custom */}
      {period === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="form-input w-auto"
            value={custom?.from ?? ""}
            onChange={(e) =>
              onChange("custom", { from: e.target.value, to: custom?.to ?? e.target.value })
            }
          />
          <span className="text-sm text-stone-400">→</span>
          <input
            type="date"
            className="form-input w-auto"
            value={custom?.to ?? ""}
            onChange={(e) =>
              onChange("custom", { from: custom?.from ?? e.target.value, to: e.target.value })
            }
          />
        </div>
      )}

      {isLoading && (
        <div className="size-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      )}
    </div>
  )
}
