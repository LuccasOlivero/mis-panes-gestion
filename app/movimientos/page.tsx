import Link from "next/link";
import { getOpenShiftAction } from "@/src/actions/shift.actions";
import {
  getCurrentShiftSalesSummaryAction,
  getSalesAction,
} from "@/src/actions/sale.actions";
import { getExpensesAction } from "@/src/actions/expense.actions";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  AlertTriangle,
  LayoutList,
} from "lucide-react";
import { formatCurrency } from "@/src/lib/utils/currency";
import { MovimientosTable } from "@/src/components/movimientos/MovimientosTable";

export default async function MovimientosPage() {
  const [shiftResult, salesSummaryResult, salesResult, expensesResult] =
    await Promise.all([
      getOpenShiftAction(),
      getCurrentShiftSalesSummaryAction(),
      getSalesAction(),
      getExpensesAction(),
    ]);

  const openShift = shiftResult.success ? shiftResult.data : null;
  const salesSummary = salesSummaryResult.success
    ? salesSummaryResult.data
    : null;
  const sales = salesResult.success ? salesResult.data : [];
  const expenses = expensesResult.success ? expensesResult.data : [];

  const totalSales = salesSummary?.totalAmount ?? 0;
  const totalExpenses = expenses
    .filter((e) => !e.cancelled)
    .reduce((s, e) => s + e.amount, 0);
  const netBalance = totalSales - totalExpenses;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutList className="size-5 text-stone-400" />
            <div>
              <h1 className="page-title">Movimientos</h1>
              <p className="page-subtitle">
                {openShift
                  ? `Turno activo — ${openShift.managerName}`
                  : "Sin turno activo"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/movimientos/historial"
              className="btn-secondary btn-sm"
            >
              <History className="size-3.5" />
              Historial
            </Link>
            {openShift && (
              <>
                <Link
                  href="/movimientos/nueva-venta"
                  className="btn-primary btn-sm"
                >
                  <ArrowUpCircle className="size-3.5" />
                  Nueva venta
                </Link>
                <Link
                  href="/movimientos/nuevo-gasto"
                  className="btn-secondary btn-sm"
                >
                  <ArrowDownCircle className="size-3.5" />
                  Nuevo gasto
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Alerta sin turno */}
        {!openShift && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                No hay turno activo
              </p>
              <p className="mt-0.5 text-sm text-amber-700">
                Para registrar movimientos primero debés{" "}
                <Link href="/turnos" className="font-medium underline">
                  iniciar un turno
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        {/* Stats del turno */}
        {openShift && (
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card">
              <span className="stat-label">Ventas del turno</span>
              <span className="stat-value text-amber-700">
                {formatCurrency(totalSales)}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Gastos del turno</span>
              <span className="stat-value text-red-600">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Balance neto</span>
              <span
                className={`stat-value ${netBalance >= 0 ? "text-green-700" : "text-red-700"}`}
              >
                {formatCurrency(netBalance)}
              </span>
            </div>
          </div>
        )}

        {/* Tabla unificada del turno */}
        <MovimientosTable
          sales={sales}
          expenses={expenses}
          showCancelButton={!!openShift}
        />
      </div>
    </div>
  );
}
