"use client"

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { PieSlice } from "@/src/types/dashboard.types"

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

function formatPct(value: number, total: number) {
  if (total === 0) return "0%"
  return `${Math.round((value / total) * 100)}%`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-stone-800">{name}</p>
      <p className="tabular-nums text-stone-600">{formatCurrency(value)}</p>
    </div>
  )
}

interface SinglePieProps {
  title:  string
  data:   PieSlice[]
  empty?: string
}

function SinglePie({ title, data, empty = "Sin datos para este período" }: SinglePieProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const hasData = data.length > 0 && total > 0

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
        {hasData && (
          <span className="text-xs text-stone-400">{formatCurrency(total)}</span>
        )}
      </div>
      <div className="card-body">
        {!hasData ? (
          <p className="py-10 text-center text-sm text-stone-400">{empty}</p>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Leyenda manual con porcentajes */}
            <div className="space-y-2">
              {data.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-stone-600">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-stone-400 text-xs">{formatPct(entry.value, total)}</span>
                    <span className="font-medium text-stone-800">{formatCurrency(entry.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  salesBySource:    PieSlice[]
  salesByShiftType: PieSlice[]
  expensesBySource: PieSlice[]
}

export function PieCharts({ salesBySource, salesByShiftType, expensesBySource }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <SinglePie title="Ventas por fuente"   data={salesBySource} />
      <SinglePie title="Ventas por turno"    data={salesByShiftType} />
      <SinglePie title="Gastos por fuente"   data={expensesBySource} />
    </div>
  )
}
