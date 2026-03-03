"use server"

import { createServerClient } from "@/src/lib/supabase/server"

export interface ShiftTotals {
  shiftId: string
  totalSales: number
  totalExpenses: number
  netBalance: number
}

/**
 * Trae los totales de ventas y gastos para una lista de shift IDs.
 * Usa las vistas v_active_sales y v_active_expenses del esquema.
 * Se llama solo desde TurnosPage (Server Component).
 */
export async function getShiftsTotalsAction(
  shiftIds: string[]
): Promise<{ success: true; data: ShiftTotals[] } | { success: false; error: string }> {
  if (shiftIds.length === 0) return { success: true, data: [] }

  try {
    const supabase = createServerClient()

    const [salesRes, expensesRes] = await Promise.all([
      supabase
        .from("v_active_sales")
        .select("shift_id, total")
        .in("shift_id", shiftIds),
      supabase
        .from("v_active_expenses")
        .select("shift_id, amount")
        .in("shift_id", shiftIds),
    ])

    if (salesRes.error) throw new Error(salesRes.error.message)
    if (expensesRes.error) throw new Error(expensesRes.error.message)

    // Agrupar ventas por turno
    const salesByShift: Record<string, number> = {}
    for (const row of salesRes.data ?? []) {
      salesByShift[row.shift_id] = (salesByShift[row.shift_id] ?? 0) + (row.total ?? 0)
    }

    // Agrupar gastos por turno
    const expensesByShift: Record<string, number> = {}
    for (const row of expensesRes.data ?? []) {
      expensesByShift[row.shift_id] = (expensesByShift[row.shift_id] ?? 0) + (row.amount ?? 0)
    }

    const data: ShiftTotals[] = shiftIds.map((id) => {
      const totalSales    = salesByShift[id] ?? 0
      const totalExpenses = expensesByShift[id] ?? 0
      return {
        shiftId: id,
        totalSales,
        totalExpenses,
        netBalance: totalSales - totalExpenses,
      }
    })

    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
