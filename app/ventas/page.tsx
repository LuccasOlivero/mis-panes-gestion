import Link from "next/link";
import { getOpenShiftAction } from "@/src/actions/shift.actions";
import {
  getCurrentShiftSalesSummaryAction,
  getSalesAction,
} from "@/src/actions/sale.actions";
import { ShoppingCart, Plus, History, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/src/lib/utils/currency";
import { SalesTable } from "@/src/components/sales/SalesTable";

export default async function VentasPage() {
  const [shiftResult, summaryResult, salesResult] = await Promise.all([
    getOpenShiftAction(),
    getCurrentShiftSalesSummaryAction(),
    getSalesAction(),
  ]);

  const openShift = shiftResult.success ? shiftResult.data : null;
  const summary = summaryResult.success ? summaryResult.data : null;
  const sales = salesResult.success ? salesResult.data : [];

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="size-5 text-stone-400" />
            <div>
              <h1 className="page-title">Ventas</h1>
              <p className="page-subtitle">
                Registro de ventas del turno actual
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/ventas/historial" className="btn-secondary btn-sm">
              <History className="size-3.5" />
              Historial
            </Link>
            {openShift && (
              <Link href="/ventas/nueva" className="btn-primary btn-sm">
                <Plus className="size-3.5" />
                Nueva venta
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
                Para registrar ventas primero debés{" "}
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
              <span className="stat-label">Total del turno</span>
              <span className="stat-value text-amber-700">
                {formatCurrency(summary.totalAmount)}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Transacciones</span>
              <span className="stat-value">{summary.totalTransactions}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Efectivo</span>
              <span className="stat-value">
                {formatCurrency(summary.byPaymentMethod["efectivo"] ?? 0)}
              </span>
            </div>
          </div>
        )}

        <SalesTable sales={sales} showCancelButton={!!openShift} />
      </div>
    </div>
  );
}
