"use server"

import { createServerClient } from "@/src/lib/supabase/server"
import { getRangeForPeriod } from "@/src/lib/utils/dates"
import type {
  DashboardPeriod,
  DateRange,
  DashboardData,
  DashboardKPIs,
  ShiftRow,
  PieSlice,
} from "@/src/types/dashboard.types"

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getDashboardDataAction(
  period: DashboardPeriod,
  custom?: DateRange
): Promise<Result<DashboardData>> {
  try {
    const supabase  = createServerClient()
    const dateRange = getRangeForPeriod(period, custom)
    const { from, to } = dateRange

    // ── Fetch en paralelo ────────────────────────────────────────────────────
    const [
      shiftsRes,
      shiftSalesRes,
      shiftExpensesRes,
      deliverySalesRes,
      deliveryExpensesRes,
    ] = await Promise.all([
      // Turnos del período
      supabase
        .from("shifts")
        .select("id, shift_type, manager_name, started_at, ended_at, status")
        .gte("started_at", `${from}T00:00:00`)
        .lte("started_at", `${to}T23:59:59`)
        .order("started_at", { ascending: false }),

      // Ventas de turno del período (no canceladas)
      supabase
        .from("sales")
        .select("shift_id, total, cancelled")
        .gte("created_at", `${from}T00:00:00`)
        .lte("created_at", `${to}T23:59:59`)
        .eq("cancelled", false),

      // Gastos de turno del período (no cancelados)
      supabase
        .from("expenses")
        .select("shift_id, amount, cancelled")
        .gte("created_at", `${from}T00:00:00`)
        .lte("created_at", `${to}T23:59:59`)
        .eq("cancelled", false),

      // Ventas de reparto del período
      supabase
        .from("delivery_sales")
        .select("total")
        .gte("sale_date", from)
        .lte("sale_date", to),

      // Gastos de reparto del período
      supabase
        .from("delivery_expenses")
        .select("total")
        .gte("expense_date", from)
        .lte("expense_date", to),
    ])

    if (shiftsRes.error)          throw new Error(shiftsRes.error.message)
    if (shiftSalesRes.error)      throw new Error(shiftSalesRes.error.message)
    if (shiftExpensesRes.error)   throw new Error(shiftExpensesRes.error.message)
    if (deliverySalesRes.error)   throw new Error(deliverySalesRes.error.message)
    if (deliveryExpensesRes.error) throw new Error(deliveryExpensesRes.error.message)

    const shifts          = shiftsRes.data          ?? []
    const shiftSales      = shiftSalesRes.data      ?? []
    const shiftExpenses   = shiftExpensesRes.data   ?? []
    const deliverySales   = deliverySalesRes.data   ?? []
    const deliveryExpenses = deliveryExpensesRes.data ?? []

    // ── KPIs ─────────────────────────────────────────────────────────────────
    const totalShiftSales      = shiftSales.reduce((s, r) => s + (r.total ?? 0), 0)
    const totalDeliverySales   = deliverySales.reduce((s, r) => s + (r.total ?? 0), 0)
    const totalShiftExpenses   = shiftExpenses.reduce((s, r) => s + (r.amount ?? 0), 0)
    const totalDeliveryExpenses = deliveryExpenses.reduce((s, r) => s + (r.total ?? 0), 0)

    const kpis: DashboardKPIs = {
      totalSales:       totalShiftSales + totalDeliverySales,
      shiftSales:       totalShiftSales,
      deliverySales:    totalDeliverySales,
      totalExpenses:    totalShiftExpenses + totalDeliveryExpenses,
      shiftExpenses:    totalShiftExpenses,
      deliveryExpenses: totalDeliveryExpenses,
      netBalance:       (totalShiftSales + totalDeliverySales) - (totalShiftExpenses + totalDeliveryExpenses),
    }

    // ── Torta 1: Ventas por fuente ────────────────────────────────────────────
    const salesBySource: PieSlice[] = [
      { name: "Turnos",  value: totalShiftSales,    color: "#f59e0b" },
      { name: "Reparto", value: totalDeliverySales, color: "#0ea5e9" },
    ].filter((s) => s.value > 0)

    // ── Torta 2: Ventas por turno (mañana vs tarde) ───────────────────────────
    // Construir mapa shiftId → shiftType
    const shiftTypeMap = new Map<string, string>(
      shifts.map((s) => [s.id, s.shift_type])
    )

    let morningSales = 0
    let afternoonSales = 0
    for (const sale of shiftSales) {
      const type = shiftTypeMap.get(sale.shift_id)
      if (type === "morning")   morningSales   += sale.total ?? 0
      if (type === "afternoon") afternoonSales += sale.total ?? 0
    }

    const salesByShiftType: PieSlice[] = [
      { name: "Turno mañana", value: morningSales,   color: "#f59e0b" },
      { name: "Turno tarde",  value: afternoonSales, color: "#fb923c" },
    ].filter((s) => s.value > 0)

    // ── Torta 3: Gastos por fuente (turnos vs reparto) ────────────────────────
    const expensesBySource: PieSlice[] = [
      { name: "Gastos turnos",  value: totalShiftExpenses,    color: "#f97316" },
      { name: "Gastos reparto", value: totalDeliveryExpenses, color: "#0ea5e9" },
    ].filter((s) => s.value > 0)

    // ── Tabla de turnos ───────────────────────────────────────────────────────
    const salesByShift   = new Map<string, number>()
    const expensesByShift = new Map<string, number>()
    const salesCountByShift = new Map<string, number>()

    for (const sale of shiftSales) {
      salesByShift.set(sale.shift_id, (salesByShift.get(sale.shift_id) ?? 0) + (sale.total ?? 0))
      salesCountByShift.set(sale.shift_id, (salesCountByShift.get(sale.shift_id) ?? 0) + 1)
    }
    for (const exp of shiftExpenses) {
      expensesByShift.set(exp.shift_id, (expensesByShift.get(exp.shift_id) ?? 0) + (exp.amount ?? 0))
    }

    const shiftRows: ShiftRow[] = shifts.map((s) => {
      const sales    = salesByShift.get(s.id)    ?? 0
      const expenses = expensesByShift.get(s.id) ?? 0
      return {
        shiftId:     s.id,
        shiftType:   s.shift_type,
        managerName: s.manager_name,
        startedAt:   s.started_at,
        endedAt:     s.ended_at ?? null,
        sales,
        expenses,
        balance:     sales - expenses,
        salesCount:  salesCountByShift.get(s.id) ?? 0,
      }
    })

    return {
      success: true,
      data: {
        period,
        dateRange,
        kpis,
        salesBySource,
        salesByShiftType,
        expensesBySource,
        shifts: shiftRows,
      },
    }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
