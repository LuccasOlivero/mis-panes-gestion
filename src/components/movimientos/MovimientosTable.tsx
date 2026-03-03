"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSaleAction } from "@/src/actions/sale.actions";
import { cancelExpenseAction } from "@/src/actions/expense.actions";
import type { SaleWithShift } from "@/src/types/sale.types";
import type { ExpenseWithShift } from "@/src/types/expense.types";
import { formatCurrency } from "@/src/lib/utils/currency";
import { formatDateTime } from "@/src/lib/utils/dates";
import { expenseCategoryLabels } from "@/src/modules/expenses/domain/expense.entity";
import {
  XCircle,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  transferencia: "Transf.",
};
const PRICE_LABELS: Record<string, string> = {
  publico: "Público",
  negocio: "Negocio",
  repartidor: "Repartidor",
};

type Row =
  | { kind: "sale"; data: SaleWithShift; sortKey: string }
  | { kind: "expense"; data: ExpenseWithShift; sortKey: string };

interface CancelTarget {
  kind: "sale" | "expense";
  id: string;
}

interface Props {
  sales: SaleWithShift[];
  expenses: ExpenseWithShift[];
  showCancelButton?: boolean;
}

export function MovimientosTable({
  sales,
  expenses,
  showCancelButton = false,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelledBy, setCancelledBy] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Combinar ventas y gastos ordenados por fecha desc
  const rows: Row[] = [
    ...sales.map((s) => ({
      kind: "sale" as const,
      data: s,
      sortKey: s.createdAt,
    })),
    ...expenses.map((e) => ({
      kind: "expense" as const,
      data: e,
      sortKey: e.createdAt,
    })),
  ].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  function handleConfirmCancel() {
    if (!cancelTarget) return;
    setError(null);
    startTransition(async () => {
      const result =
        cancelTarget.kind === "sale"
          ? await cancelSaleAction({
              saleId: cancelTarget.id,
              cancellationReason: cancelReason,
              cancelledBy,
            })
          : await cancelExpenseAction({
              expenseId: cancelTarget.id,
              cancellationReason: cancelReason,
              cancelledBy,
            });

      if (!result.success) {
        setError(result.error);
      } else {
        setCancelTarget(null);
        setCancelReason("");
        setCancelledBy("");
        router.refresh();
      }
    });
  }

  if (rows.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Movimientos del turno</span>
        </div>
        <div className="card-body">
          <p className="py-8 text-center text-sm text-stone-400">
            No hay movimientos registrados en este turno todavía.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Movimientos del turno</span>
          <span className="text-xs text-stone-400">
            {rows.length} movimientos
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descripción / Producto</th>
                <th>Detalle</th>
                <th>Pago</th>
                <th className="text-right">Monto</th>
                <th>Hora</th>
                {showCancelButton && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                if (row.kind === "sale") {
                  const s = row.data;
                  return (
                    <tr
                      key={`s-${s.id}`}
                      className={s.cancelled ? "opacity-40" : ""}
                    >
                      <td>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <ArrowUpCircle className="size-3" />
                          Venta
                        </span>
                      </td>
                      <td className="max-w-[200px]">
                        <p className="truncate font-medium">{s.productName}</p>
                        <p className="text-xs text-stone-400">x{s.quantity}</p>
                      </td>
                      <td>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                          {PRICE_LABELS[s.priceType]}
                        </span>
                      </td>
                      <td>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                          {PAYMENT_LABELS[s.paymentMethod]}
                        </span>
                      </td>
                      <td className="text-right tabular-nums font-semibold text-amber-700">
                        +{formatCurrency(s.total)}
                      </td>
                      <td className="tabular-nums text-xs text-stone-400">
                        {formatDateTime(s.createdAt)}
                      </td>
                      {showCancelButton && (
                        <td>
                          {!s.cancelled && (
                            <button
                              className="btn-ghost btn-sm p-1 text-stone-300 hover:text-red-500"
                              onClick={() =>
                                setCancelTarget({ kind: "sale", id: s.id })
                              }
                              title="Anular venta"
                            >
                              <XCircle className="size-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                }

                const e = row.data;
                return (
                  <tr
                    key={`e-${e.id}`}
                    className={e.cancelled ? "opacity-40" : ""}
                  >
                    <td>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        <ArrowDownCircle className="size-3" />
                        Gasto
                      </span>
                    </td>
                    <td className="max-w-[200px]">
                      <p className="truncate font-medium">{e.description}</p>
                      {e.notes && (
                        <p className="truncate text-xs text-stone-400">
                          {e.notes}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                        {expenseCategoryLabels[e.category] ?? e.category}
                      </span>
                    </td>
                    <td>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                        {PAYMENT_LABELS[e.paymentMethod]}
                      </span>
                    </td>
                    <td className="text-right tabular-nums font-semibold text-red-600">
                      -{formatCurrency(e.amount)}
                    </td>
                    <td className="tabular-nums text-xs text-stone-400">
                      {formatDateTime(e.createdAt)}
                    </td>
                    {showCancelButton && (
                      <td>
                        {!e.cancelled && (
                          <button
                            className="btn-ghost btn-sm p-1 text-stone-300 hover:text-red-500"
                            onClick={() =>
                              setCancelTarget({ kind: "expense", id: e.id })
                            }
                            title="Anular gasto"
                          >
                            <XCircle className="size-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal anulación unificado */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="size-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">
              Anular {cancelTarget.kind === "sale" ? "venta" : "gasto"}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              El registro quedará marcado como anulado para auditoría. No se
              puede deshacer.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="form-label">Razón de anulación</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Error de carga, duplicado..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Anulado por</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tu nombre"
                  value={cancelledBy}
                  onChange={(e) => setCancelledBy(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                className="btn-danger flex-1"
                onClick={handleConfirmCancel}
                disabled={
                  isPending || !cancelReason.trim() || !cancelledBy.trim()
                }
              >
                {isPending ? "Anulando..." : "Confirmar anulación"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setCancelTarget(null);
                  setError(null);
                }}
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
