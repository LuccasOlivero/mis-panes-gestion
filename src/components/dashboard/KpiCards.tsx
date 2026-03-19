"use client"

import type { DashboardKPIs } from "@/src/types/dashboard.types"
import { ShoppingBag, Clock, Truck, Wallet } from "lucide-react"

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

interface Props { kpis: DashboardKPIs }

export function KpiCards({ kpis }: Props) {
  const isPositive = kpis.netBalance >= 0

  const cards = [
    {
      label:    "Ventas totales",
      value:    kpis.totalSales,
      sub:      `Turnos ${formatCurrency(kpis.shiftSales)} · Reparto ${formatCurrency(kpis.deliverySales)}`,
      icon:     ShoppingBag,
      bg:       "bg-amber-50",
      iconColor:"text-amber-600",
      valColor: "text-amber-700",
    },
    {
      label:    "Ventas turnos",
      value:    kpis.shiftSales,
      sub:      `Gastos: ${formatCurrency(kpis.shiftExpenses)}`,
      icon:     Clock,
      bg:       "bg-orange-50",
      iconColor:"text-orange-500",
      valColor: "text-orange-700",
    },
    {
      label:    "Ventas reparto",
      value:    kpis.deliverySales,
      sub:      `Gastos: ${formatCurrency(kpis.deliveryExpenses)}`,
      icon:     Truck,
      bg:       "bg-sky-50",
      iconColor:"text-sky-500",
      valColor: "text-sky-700",
    },
    {
      label:    "Balance neto",
      value:    kpis.netBalance,
      sub:      `Gastos totales: ${formatCurrency(kpis.totalExpenses)}`,
      icon:     Wallet,
      bg:       isPositive ? "bg-green-50"  : "bg-red-50",
      iconColor:isPositive ? "text-green-600" : "text-red-500",
      valColor: isPositive ? "text-green-700" : "text-red-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, sub, icon: Icon, bg, iconColor, valColor }) => (
        <div key={label} className="card">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{label}</p>
                <p className={`mt-2 text-2xl font-bold sm:text-3xl tabular-nums ${valColor}`}>
                  {formatCurrency(value)}
                </p>
                <p className="mt-1.5 text-xs text-stone-400 truncate">{sub}</p>
              </div>
              <div className={`ml-3 flex size-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`size-5 ${iconColor}`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
