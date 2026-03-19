"use client"

import { useState, useTransition } from "react"
import { getDashboardDataAction } from "@/src/actions/dashboard.actions"
import type { DashboardData, DashboardPeriod, DateRange } from "@/src/types/dashboard.types"
import { KpiCards }       from "./KpiCards"
import { PieCharts }      from "./PieCharts"
import { ShiftsTable }    from "./ShiftsTable"
import { PeriodSelector } from "./PeriodSelector"
import { Loader2 }        from "lucide-react"

interface Props { initialData: DashboardData }

export function DashboardClient({ initialData }: Props) {
  const [data,        setData]        = useState(initialData)
  const [period,      setPeriod]      = useState<DashboardPeriod>(initialData.period)
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined)
  const [isPending,   startTransition] = useTransition()

  function handlePeriodChange(newPeriod: DashboardPeriod, custom?: DateRange) {
    setPeriod(newPeriod)
    if (custom) setCustomRange(custom)

    // Solo hacer fetch si hay rango válido en custom
    if (newPeriod === "custom" && (!custom?.from || !custom?.to)) return

    startTransition(async () => {
      const result = await getDashboardDataAction(newPeriod, custom)
      if (result.success) setData(result.data)
    })
  }

  return (
    <div className="space-y-6">

      {/* Selector de período */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PeriodSelector
          period={period}
          customRange={customRange}
          onPeriodChange={handlePeriodChange}
        />
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <Loader2 className="size-4 animate-spin" />
            Actualizando...
          </div>
        )}
      </div>

      {/* KPIs */}
      <KpiCards kpis={data.kpis} />

      {/* Tortas */}
      <PieCharts
        salesBySource={data.salesBySource}
        salesByShiftType={data.salesByShiftType}
        expensesBySource={data.expensesBySource}
      />

      {/* Tabla de turnos */}
      <ShiftsTable shifts={data.shifts} />

    </div>
  )
}
