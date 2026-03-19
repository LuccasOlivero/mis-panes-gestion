"use client"

import type { DashboardPeriod, DateRange } from "@/src/types/dashboard.types"

interface Props {
  period:        DashboardPeriod
  customRange:   DateRange | undefined
  onPeriodChange:(period: DashboardPeriod, custom?: DateRange) => void
}

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "today",  label: "Hoy" },
  { value: "week",   label: "Esta semana" },
  { value: "month",  label: "Este mes" },
  { value: "custom", label: "Personalizado" },
]

export function PeriodSelector({ period, customRange, onPeriodChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1 rounded-xl border border-stone-200 bg-white p-1">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onPeriodChange(value, customRange)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              period === value
                ? "bg-amber-600 text-white shadow-sm"
                : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="form-input w-auto text-sm"
            value={customRange?.from ?? ""}
            onChange={(e) =>
              onPeriodChange("custom", { from: e.target.value, to: customRange?.to ?? e.target.value })
            }
          />
          <span className="text-sm text-stone-400">→</span>
          <input
            type="date"
            className="form-input w-auto text-sm"
            value={customRange?.to ?? ""}
            onChange={(e) =>
              onPeriodChange("custom", { from: customRange?.from ?? e.target.value, to: e.target.value })
            }
          />
        </div>
      )}
    </div>
  )
}
