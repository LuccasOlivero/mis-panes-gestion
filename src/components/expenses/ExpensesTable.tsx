"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelExpenseAction } from "@/src/actions/expense.actions";
import type { ExpenseWithShift } from "@/src/types/expense.types";
import { formatCurrency } from "@/src/lib/utils/currency";
import { formatDateTime } from "@/src/lib/utils/dates";
import { expenseCategoryLabels } from "@/src/modules/expenses/domain/expense.entity";
import { XCircle, AlertCircle, ExternalLink } from "lucide-react";

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  transferencia: "Transf.",
};

interface Props {
  expenses: ExpenseWithShift[];
  showCancelButton?: boolean;
}

export function ExpensesTable({ expenses, showCancelButton = false }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelledBy, setCancelledBy] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCancelConfirm() {
    if (!cancelTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelExpenseAction({
        expenseId: cancelTarget,
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

  if (expenses.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Gastos del turno</span>
        </div>
        <div className="card-body">
          <p className="py-8 text-center text-sm text-stone-400">
            No hay gastos registrados en este turno.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Gastos del turno</span>
          <span className="text-xs text-stone-400">
            {expenses.length} registros
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Categoría</th>
                <th className="text-right">Monto</th>
                <th>Pago</th>
                <th>Responsable</th>
                <th>Hora</th>
                <th>Comp.</th>
                {showCancelButton && <th />}
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className={exp.cancelled ? "opacity-40" : ""}>
                  <td className="max-w-[200px] truncate font-medium">
                    {exp.description}
                  </td>
                  <td>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                      {expenseCategoryLabels[exp.category] ?? exp.category}
                    </span>
                  </td>
                  <td className="text-right tabular-nums font-semibold text-red-600">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                      {PAYMENT_LABELS[exp.paymentMethod] ?? exp.paymentMethod}
                    </span>
                  </td>
                  <td className="text-xs text-stone-500">{exp.managerName}</td>
                  <td className="text-xs tabular-nums text-stone-400">
                    {formatDateTime(exp.createdAt)}
                  </td>
                  <td>
                    {exp.receiptUrl ? (
                      <a
                        href={exp.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-600 hover:text-amber-700"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-stone-300">—</span>
                    )}
                  </td>
                  {showCancelButton && (
                    <td>
                      {!exp.cancelled && (
                        <button
                          className="btn-ghost btn-sm p-1 text-red-400 hover:text-red-600"
                          onClick={() => setCancelTarget(exp.id)}
                          title="Anular gasto"
                        >
                          <XCircle className="size-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal anulación */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="size-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">
              Anular gasto
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              El gasto quedará registrado como anulado para auditoría.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="form-label">Razón de anulación</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Carga duplicada, error de monto..."
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
                onClick={handleCancelConfirm}
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
