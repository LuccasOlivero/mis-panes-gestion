"use client"

import { useState, Fragment } from "react"
import type { ShiftRow } from "@/src/types/dashboard.types"
import { ChevronDown, ChevronRight, Sun, Sunset } from "lucide-react"

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  })
}

interface Props { shifts: ShiftRow[] }

export function ShiftsTable({ shifts }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (shifts.length === 0) {
    return (
      <div className="card">
        <div className="card-header"><span className="card-title">Turnos del período</span></div>
        <div className="card-body">
          <p className="py-8 text-center text-sm text-stone-400">Sin turnos en este período.</p>
        </div>
      </div>
    )
  }

  // Totales del período
  const totals = shifts.reduce(
    (acc, s) => ({ sales: acc.sales + s.sales, expenses: acc.expenses + s.expenses, balance: acc.balance + s.balance }),
    { sales: 0, expenses: 0, balance: 0 }
  )

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Turnos del período</span>
        <span className="text-xs text-stone-400">{shifts.length} turnos</span>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Turno</th>
              <th>Encargado</th>
              <th>Inicio</th>
              <th className="text-right">Ventas</th>
              <th className="text-right">Gastos</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <Fragment key={shift.shiftId}>
                <tr
                  className="cursor-pointer hover:bg-stone-50"
                  onClick={() => setExpanded(expanded === shift.shiftId ? null : shift.shiftId)}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      {expanded === shift.shiftId
                        ? <ChevronDown className="size-3.5 text-stone-400" />
                        : <ChevronRight className="size-3.5 text-stone-400" />
                      }
                      {shift.shiftType === "morning"
                        ? <Sun    className="size-3.5 text-amber-500" />
                        : <Sunset className="size-3.5 text-orange-400" />
                      }
                      <span className="text-sm font-medium">
                        {shift.shiftType === "morning" ? "Mañana" : "Tarde"}
                      </span>
                    </div>
                  </td>
                  <td className="text-sm text-stone-600">{shift.managerName}</td>
                  <td className="tabular-nums text-xs text-stone-500">{formatDateTime(shift.startedAt)}</td>
                  <td className="text-right tabular-nums font-medium text-amber-700">{formatCurrency(shift.sales)}</td>
                  <td className="text-right tabular-nums text-sm text-red-500">{formatCurrency(shift.expenses)}</td>
                  <td className={`text-right tabular-nums font-semibold ${shift.balance >= 0 ? "text-green-700" : "text-red-600"}`}>
                    {formatCurrency(shift.balance)}
                  </td>
                </tr>

                {expanded === shift.shiftId && (
                  <tr key={`${shift.shiftId}-detail`} className="bg-stone-50">
                    <td colSpan={6} className="px-6 py-3">
                      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1">Ventas</p>
                          <p className="tabular-nums font-semibold text-amber-700">{formatCurrency(shift.sales)}</p>
                          <p className="text-xs text-stone-400">{shift.salesCount} transacciones</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1">Gastos</p>
                          <p className="tabular-nums font-semibold text-red-500">{formatCurrency(shift.expenses)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1">Cierre</p>
                          <p className="text-xs text-stone-500">
                            {shift.endedAt ? formatDateTime(shift.endedAt) : <span className="text-amber-600">Turno abierto</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-stone-200 bg-stone-50 font-semibold">
              <td colSpan={3} className="px-4 py-3 text-sm text-stone-700">Totales del período</td>
              <td className="px-4 py-3 text-right tabular-nums text-amber-700">{formatCurrency(totals.sales)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-red-500">{formatCurrency(totals.expenses)}</td>
              <td className={`px-4 py-3 text-right tabular-nums ${totals.balance >= 0 ? "text-green-700" : "text-red-600"}`}>
                {formatCurrency(totals.balance)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
