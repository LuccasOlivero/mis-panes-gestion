"use server";

import { format, parseISO, startOfWeek, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { createServerClient } from "@/src/lib/supabase/server";
import { getRangeForPeriod, getPrevRange } from "@/src/lib/utils/dates";
import type {
  DashboardPeriod,
  DateRange,
  DashboardData,
  PeriodKPIs,
  PeriodComparison,
  DailyPoint,
  PaymentMethodSlice,
  ShiftSummaryRow,
  MovimientoRow,
} from "@/src/types/dashboard.types";

// ─── Única Server Action exportada ───────────────────────────────────────────
// Todas las funciones exportadas de "use server" DEBEN ser async.
// getRangeForPeriod y getPrevRange son funciones puras → viven en dates.ts

export async function getDashboardDataAction(
  period: DashboardPeriod,
  custom?: DateRange,
): Promise<
  { success: true; data: DashboardData } | { success: false; error: string }
> {
  try {
    const supabase = createServerClient();
    const range = getRangeForPeriod(period, custom);
    const prevRange = getPrevRange(period, range);

    // ── Fetch en paralelo: período actual + período anterior ──────────────────
    const [salesRes, expensesRes, prevSalesRes, prevExpensesRes, shiftsRes] =
      await Promise.all([
        supabase
          .from("sales")
          .select(
            "id, shift_id, product_name, price_type, payment_method, total, created_at, cancelled",
          )
          .gte("created_at", range.from)
          .lte("created_at", range.to)
          .eq("cancelled", false),

        supabase
          .from("expenses")
          .select(
            "id, shift_id, description, category, payment_method, amount, created_at, cancelled",
          )
          .gte("created_at", range.from)
          .lte("created_at", range.to)
          .eq("cancelled", false),

        supabase
          .from("sales")
          .select("total")
          .gte("created_at", prevRange.from)
          .lte("created_at", prevRange.to)
          .eq("cancelled", false),

        supabase
          .from("expenses")
          .select("amount")
          .gte("created_at", prevRange.from)
          .lte("created_at", prevRange.to)
          .eq("cancelled", false),

        supabase
          .from("shifts")
          .select("id, shift_type, manager_name, started_at, ended_at")
          .gte("started_at", range.from)
          .lte("started_at", range.to)
          .order("started_at", { ascending: false }),
      ]);

    if (salesRes.error) throw new Error(salesRes.error.message);
    if (expensesRes.error) throw new Error(expensesRes.error.message);
    if (shiftsRes.error) throw new Error(shiftsRes.error.message);

    const sales = salesRes.data ?? [];
    const expenses = expensesRes.data ?? [];
    const prevSales = prevSalesRes.data ?? [];
    const prevExpenses = prevExpensesRes.data ?? [];

    // ── KPIs período actual ───────────────────────────────────────────────────
    const totalVentas = sales.reduce((s, r) => s + (r.total ?? 0), 0);
    const totalGastos = expenses.reduce((s, r) => s + (r.amount ?? 0), 0);
    const balanceNeto = totalVentas - totalGastos;
    const cantVentas = sales.length;
    const cantGastos = expenses.length;
    const ticketPromedio = cantVentas > 0 ? totalVentas / cantVentas : 0;

    const kpis: PeriodKPIs = {
      totalVentas,
      totalGastos,
      balanceNeto,
      ticketPromedio,
      cantVentas,
      cantGastos,
    };

    // ── KPIs período anterior ─────────────────────────────────────────────────
    const prevTotalVentas = prevSales.reduce((s, r) => s + (r.total ?? 0), 0);
    const prevTotalGastos = prevExpenses.reduce(
      (s, r) => s + (r.amount ?? 0),
      0,
    );
    const prevBalanceNeto = prevTotalVentas - prevTotalGastos;

    function diffPct(current: number, prev: number): number | null {
      if (prev === 0) return null;
      return Math.round(((current - prev) / prev) * 100);
    }

    const comparison: PeriodComparison = {
      ventasDiffPct: diffPct(totalVentas, prevTotalVentas),
      gastosDiffPct: diffPct(totalGastos, prevTotalGastos),
      balanceDiffPct: diffPct(balanceNeto, prevBalanceNeto),
    };

    // ── Daily points para el gráfico ──────────────────────────────────────────
    const fromDate = parseISO(range.from);
    const toDate = parseISO(range.to);
    const days = eachDayOfInterval({ start: fromDate, end: toDate });

    const salesByDay: Record<string, number> = {};
    const expensesByDay: Record<string, number> = {};

    for (const s of sales) {
      const key = format(new Date(s.created_at), "yyyy-MM-dd");
      salesByDay[key] = (salesByDay[key] ?? 0) + (s.total ?? 0);
    }
    for (const e of expenses) {
      const key = format(new Date(e.created_at), "yyyy-MM-dd");
      expensesByDay[key] = (expensesByDay[key] ?? 0) + (e.amount ?? 0);
    }

    // Si > 14 días, agrupar por semana para no saturar el gráfico
    const shouldGroupByWeek = days.length > 14;

    let dailyPoints: DailyPoint[];

    if (!shouldGroupByWeek) {
      dailyPoints = days.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const label = format(d, "dd/MM", { locale: es });
        const ventas = salesByDay[key] ?? 0;
        const gastos = expensesByDay[key] ?? 0;
        return { date: label, ventas, gastos, balance: ventas - gastos };
      });
    } else {
      const weekMap: Record<
        string,
        { ventas: number; gastos: number; label: string }
      > = {};
      for (const d of days) {
        const weekStart = startOfWeek(d, { weekStartsOn: 1 });
        const key = format(weekStart, "yyyy-MM-dd");
        const dayKey = format(d, "yyyy-MM-dd");
        if (!weekMap[key]) {
          weekMap[key] = {
            ventas: 0,
            gastos: 0,
            label: format(weekStart, "dd/MM", { locale: es }),
          };
        }
        weekMap[key].ventas += salesByDay[dayKey] ?? 0;
        weekMap[key].gastos += expensesByDay[dayKey] ?? 0;
      }
      dailyPoints = Object.values(weekMap).map((w) => ({
        date: w.label,
        ventas: w.ventas,
        gastos: w.gastos,
        balance: w.ventas - w.gastos,
      }));
    }

    // ── Distribución por medio de pago ────────────────────────────────────────
    const paymentMap: Record<string, number> = {};
    for (const s of sales) {
      paymentMap[s.payment_method] =
        (paymentMap[s.payment_method] ?? 0) + (s.total ?? 0);
    }
    const paymentTotal = Object.values(paymentMap).reduce((a, b) => a + b, 0);

    const PAYMENT_LABELS: Record<string, string> = {
      efectivo: "Efectivo",
      debito: "Débito",
      credito: "Crédito",
      transferencia: "Transf.",
    };
    const paymentDist: PaymentMethodSlice[] = Object.entries(paymentMap)
      .map(([method, amount]) => ({
        method: PAYMENT_LABELS[method] ?? method,
        amount,
        pct: paymentTotal > 0 ? Math.round((amount / paymentTotal) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // ── Resumen por turno ─────────────────────────────────────────────────────
    const salesByShift: Record<string, { total: number; count: number }> = {};
    const expensesByShift: Record<string, number> = {};

    for (const s of sales) {
      if (!salesByShift[s.shift_id])
        salesByShift[s.shift_id] = { total: 0, count: 0 };
      salesByShift[s.shift_id].total += s.total ?? 0;
      salesByShift[s.shift_id].count += 1;
    }
    for (const e of expenses) {
      expensesByShift[e.shift_id] =
        (expensesByShift[e.shift_id] ?? 0) + (e.amount ?? 0);
    }

    const shiftRows: ShiftSummaryRow[] = (shiftsRes.data ?? []).map((s) => {
      const v = salesByShift[s.id]?.total ?? 0;
      const g = expensesByShift[s.id] ?? 0;
      return {
        shiftId: s.id,
        shiftType: s.shift_type,
        managerName: s.manager_name,
        startedAt: s.started_at,
        endedAt: s.ended_at ?? null,
        ventas: v,
        gastos: g,
        balance: v - g,
        cantVentas: salesByShift[s.id]?.count ?? 0,
      };
    });

    // ── Movimientos individuales (detalle expandible) ─────────────────────────
    const movimientos: MovimientoRow[] = [
      ...sales.map(
        (s): MovimientoRow => ({
          id: s.id,
          kind: "sale",
          description: s.product_name,
          amount: s.total ?? 0,
          category: s.price_type,
          payment: s.payment_method,
          shiftId: s.shift_id,
          createdAt: s.created_at,
          cancelled: false,
        }),
      ),
      ...expenses.map(
        (e): MovimientoRow => ({
          id: e.id,
          kind: "expense",
          description: e.description,
          amount: e.amount ?? 0,
          category: e.category,
          payment: e.payment_method,
          shiftId: e.shift_id,
          createdAt: e.created_at,
          cancelled: false,
        }),
      ),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      success: true,
      data: {
        period: range,
        prevPeriod: prevRange,
        kpis,
        comparison,
        dailyPoints,
        paymentDist,
        shiftRows,
        movimientos,
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
