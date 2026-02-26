"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSaleAction } from "@/src/actions/sale.actions";
import type { SaleWithShift } from "@/src/types/sale.types";
import { formatCurrency } from "@/src/lib/utils/currency";
import { formatDateTime } from "@/src/lib/utils/dates";
import { XCircle, AlertCircle } from "lucide-react";

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  transferencia: "Transf.",
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  publico: "Público",
  negocio: "Negocio",
  repartidor: "Repartidor",
};

interface Props {
  sales: SaleWithShift[];
  showCancelButton?: boolean;
}

export function SalesTable({ sales, showCancelButton = false }: Props) {
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
      const result = await cancelSaleAction({
        saleId: cancelTarget,
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

  if (sales.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Ventas del turno</span>
        </div>
        <div className="card-body">
          <p className="py-8 text-center text-sm text-stone-400">
            No hay ventas registradas en este turno.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Ventas del turno</span>
          <span className="text-xs text-stone-400">{sales.length} ventas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th className="text-right">Cant.</th>
                <th className="text-right">Precio</th>
                <th className="text-right">Desc.</th>
                <th className="text-right">Total</th>
                <th>Pago</th>
                <th>Hora</th>
                {showCancelButton && <th />}
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  className={sale.cancelled ? "opacity-40" : ""}
                >
                  <td className="max-w-[180px] truncate font-medium">
                    {sale.productName}
                  </td>
                  <td>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                      {PRICE_TYPE_LABELS[sale.priceType]}
                    </span>
                  </td>
                  <td className="text-right tabular-nums">{sale.quantity}</td>
                  <td className="text-right tabular-nums">
                    {formatCurrency(sale.unitPrice)}
                  </td>
                  <td className="text-right tabular-nums text-stone-400">
                    {sale.discount > 0 ? formatCurrency(sale.discount) : "—"}
                  </td>
                  <td className="text-right tabular-nums font-semibold">
                    {formatCurrency(sale.total)}
                  </td>
                  <td>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                      {PAYMENT_LABELS[sale.paymentMethod]}
                    </span>
                  </td>
                  <td className="text-xs tabular-nums text-stone-400">
                    {formatDateTime(sale.createdAt)}
                  </td>
                  {showCancelButton && (
                    <td>
                      {!sale.cancelled && (
                        <button
                          className="btn-ghost btn-sm p-1 text-red-400 hover:text-red-600"
                          onClick={() => setCancelTarget(sale.id)}
                          title="Anular venta"
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
              Anular venta
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              La venta quedará registrada como anulada para auditoría. No se
              puede deshacer.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="form-label">Razón de anulación</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Error en el precio, devolución..."
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
