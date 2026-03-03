"use client";

import { useState } from "react";
import type {
  ShiftSummaryRow,
  MovimientoRow,
} from "@/src/types/dashboard.types";
import { formatCurrency } from "@/src/lib/utils/currency";
import { formatDateTime } from "@/src/lib/utils/dates";
import { expenseCategoryLabels } from "@/src/modules/expenses/domain/expense.entity";
import {
  ChevronDown,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

const SHIFT_LABEL = { morning: "Mañana", afternoon: "Tarde" };
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

interface Props {
  shiftRows: ShiftSummaryRow[];
  movimientos: MovimientoRow[];
}

export function ShiftsTable({ shiftRows, movimientos }: Props) {
  const [expandedShift, setExpandedShift] = useState<string | null>(null);

  // Índice rápido: shiftId → movimientos
  const moviByShift: Record<string, MovimientoRow[]> = {};
  for (const m of movimientos) {
    if (!moviByShift[m.shiftId]) moviByShift[m.shiftId] = [];
    moviByShift[m.shiftId].push(m);
  }

  if (shiftRows.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Turnos del período</span>
        </div>
        <div className="card-body">
          <p className="py-8 text-center text-sm text-stone-400">
            No hay turnos en el período seleccionado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Turnos del período</span>
        <span className="text-xs text-stone-400">
          {shiftRows.length} turnos
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th />
              <th>Turno</th>
              <th>Responsable</th>
              <th>Apertura</th>
              <th>Cierre</th>
              <th className="text-right">Ventas</th>
              <th className="text-right">Gastos</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {shiftRows.map((shift) => {
              const isOpen = expandedShift === shift.shiftId;
              const detail = moviByShift[shift.shiftId] ?? [];

              return (
                <>
                  {/* Fila resumen */}
                  <tr
                    key={shift.shiftId}
                    className="cursor-pointer hover:bg-amber-50/40"
                    onClick={() =>
                      setExpandedShift(isOpen ? null : shift.shiftId)
                    }
                  >
                    <td className="w-8">
                      {detail.length > 0 ? (
                        isOpen ? (
                          <ChevronDown className="size-4 text-stone-400" />
                        ) : (
                          <ChevronRight className="size-4 text-stone-400" />
                        )
                      ) : null}
                    </td>
                    <td>
                      <span
                        className={
                          shift.shiftType === "morning"
                            ? "badge-morning"
                            : "badge-afternoon"
                        }
                      >
                        {SHIFT_LABEL[shift.shiftType]}
                      </span>
                    </td>
                    <td className="font-medium">{shift.managerName}</td>
                    <td className="tabular-nums text-xs text-stone-500">
                      {formatDateTime(shift.startedAt)}
                    </td>
                    <td className="tabular-nums text-xs text-stone-500">
                      {shift.endedAt ? (
                        formatDateTime(shift.endedAt)
                      ) : (
                        <span className="badge-open">● Abierto</span>
                      )}
                    </td>
                    <td className="text-right tabular-nums font-medium text-amber-700">
                      {formatCurrency(shift.ventas)}
                      <span className="ml-1.5 text-xs text-stone-400">
                        ({shift.cantVentas})
                      </span>
                    </td>
                    <td className="text-right tabular-nums font-medium text-red-600">
                      {formatCurrency(shift.gastos)}
                    </td>
                    <td
                      className={`text-right tabular-nums font-semibold ${shift.balance >= 0 ? "text-green-700" : "text-red-700"}`}
                    >
                      {formatCurrency(shift.balance)}
                    </td>
                  </tr>

                  {/* Detalle expandible */}
                  {isOpen && detail.length > 0 && (
                    <tr key={`${shift.shiftId}-detail`}>
                      <td colSpan={8} className="bg-stone-50 p-0">
                        <div className="border-t border-stone-100">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-stone-200">
                                <th className="py-2 pl-12 pr-4 text-left font-semibold uppercase tracking-wide text-stone-400">
                                  Tipo
                                </th>
                                <th className="py-2 px-4 text-left font-semibold uppercase tracking-wide text-stone-400">
                                  Descripción
                                </th>
                                <th className="py-2 px-4 text-left font-semibold uppercase tracking-wide text-stone-400">
                                  Detalle
                                </th>
                                <th className="py-2 px-4 text-left font-semibold uppercase tracking-wide text-stone-400">
                                  Pago
                                </th>
                                <th className="py-2 px-4 text-left font-semibold uppercase tracking-wide text-stone-400">
                                  Hora
                                </th>
                                <th className="py-2 px-4 text-right font-semibold uppercase tracking-wide text-stone-400">
                                  Monto
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {detail.map((m) => (
                                <tr
                                  key={m.id}
                                  className="border-b border-stone-100 last:border-0"
                                >
                                  <td className="py-2 pl-12 pr-4">
                                    {m.kind === "sale" ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                                        <ArrowUpCircle className="size-2.5" />{" "}
                                        Venta
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700">
                                        <ArrowDownCircle className="size-2.5" />{" "}
                                        Gasto
                                      </span>
                                    )}
                                  </td>
                                  <td className="max-w-[180px] truncate py-2 px-4 font-medium text-stone-700">
                                    {m.description}
                                  </td>
                                  <td className="py-2 px-4 text-stone-500">
                                    {m.kind === "sale"
                                      ? (PRICE_LABELS[m.category] ?? m.category)
                                      : (expenseCategoryLabels[
                                          m.category as keyof typeof expenseCategoryLabels
                                        ] ?? m.category)}
                                  </td>
                                  <td className="py-2 px-4 text-stone-500">
                                    {PAYMENT_LABELS[m.payment] ?? m.payment}
                                  </td>
                                  <td className="py-2 px-4 tabular-nums text-stone-400">
                                    {formatDateTime(m.createdAt)}
                                  </td>
                                  <td
                                    className={`py-2 px-4 text-right tabular-nums font-semibold ${m.kind === "sale" ? "text-amber-700" : "text-red-600"}`}
                                  >
                                    {m.kind === "sale" ? "+" : "-"}
                                    {formatCurrency(m.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
