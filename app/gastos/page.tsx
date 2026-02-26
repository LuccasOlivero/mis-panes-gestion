import Link from "next/link";
import { getOpenShiftAction } from "@/src/actions/shift.actions";
import {
  getExpensesAction,
  getCurrentShiftExpensesSummaryAction,
} from "@/src/actions/expense.actions";
import { TrendingDown, Plus, History, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/src/lib/utils/currency";
import { ExpensesTable } from "@/src/components/expenses/ExpensesTable";
import { expenseCategoryLabels } from "@/src/modules/expenses/domain/expense.entity";

export default async function GastosPage() {
  const [shiftResult, summaryResult, expensesResult] = await Promise.all([
    getOpenShiftAction(),
    getCurrentShiftExpensesSummaryAction(),
    getExpensesAction(),
  ]);

  const openShift = shiftResult.success ? shiftResult.data : null;
  const summary = summaryResult.success ? summaryResult.data : null;
  const expenses = expensesResult.success ? expensesResult.data : [];

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingDown className="size-5 text-stone-400" />
            <div>
              <h1 className="page-title">Gastos</h1>
              <p className="page-subtitle">
                Registro de egresos del turno actual
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/gastos/historial" className="btn-secondary btn-sm">
              <History className="size-3.5" />
              Historial
            </Link>
            {openShift && (
              <Link href="/gastos/nuevo" className="btn-primary btn-sm">
                <Plus className="size-3.5" />
                Nuevo gasto
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="page-content">
        {!openShift && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                No hay turno activo
              </p>
              <p className="mt-0.5 text-sm text-amber-700">
                Para registrar gastos primero debés{" "}
                <Link href="/turnos" className="font-medium underline">
                  iniciar un turno
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card">
              <span className="stat-label">Total egresos (turno)</span>
              <span className="stat-value text-red-600">
                {formatCurrency(summary.totalAmount)}
              </span>
            </div>
            {Object.entries(summary.byCategory)
              .slice(0, 2)
              .map(([cat, amount]) => (
                <div key={cat} className="stat-card">
                  <span className="stat-label">
                    {expenseCategoryLabels[
                      cat as keyof typeof expenseCategoryLabels
                    ] ?? cat}
                  </span>
                  <span className="stat-value">{formatCurrency(amount)}</span>
                </div>
              ))}
          </div>
        )}

        <ExpensesTable expenses={expenses} showCancelButton={!!openShift} />
      </div>
    </div>
  );
}
