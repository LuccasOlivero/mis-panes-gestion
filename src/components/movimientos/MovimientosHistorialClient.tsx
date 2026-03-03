"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import type { Sale } from "@/src/types/sale.types";
import type { ExpenseWithShift } from "@/src/types/expense.types";
import type { Shift } from "@/src/types/shift.types";
import { formatCurrency } from "@/src/lib/utils/currency";
import { formatDateTime } from "@/src/lib/utils/dates";
import { expenseCategoryLabels } from "@/src/modules/expenses/domain/expense.entity";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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

// Tipo unificado para TanStack Table
type Row = {
  id: string;
  kind: "sale" | "expense";
  createdAt: string;
  description: string; // productName para ventas, description para gastos
  detail: string; // priceType para ventas, category para gastos
  paymentMethod: string;
  amount: number; // total para ventas, amount para gastos
  sign: "+" | "-";
  managerName: string;
  shiftId: string;
  cancelled: boolean;
};

const col = createColumnHelper<Row>();

const columns = [
  col.accessor("createdAt", {
    header: "Fecha / Hora",
    cell: (i) => (
      <span className="tabular-nums text-xs text-stone-500">
        {formatDateTime(i.getValue())}
      </span>
    ),
  }),
  col.accessor("kind", {
    header: "Tipo",
    cell: (i) =>
      i.getValue() === "sale" ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          <ArrowUpCircle className="size-3" /> Venta
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
          <ArrowDownCircle className="size-3" /> Gasto
        </span>
      ),
  }),
  col.accessor("description", {
    header: "Descripción",
    cell: (i) => <span className="font-medium">{i.getValue()}</span>,
  }),
  col.accessor("detail", {
    header: "Detalle",
    cell: (i) => (
      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
        {PRICE_LABELS[i.getValue()] ??
          expenseCategoryLabels[
            i.getValue() as keyof typeof expenseCategoryLabels
          ] ??
          i.getValue()}
      </span>
    ),
  }),
  col.accessor("paymentMethod", {
    header: "Pago",
    cell: (i) => (
      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
        {PAYMENT_LABELS[i.getValue()] ?? i.getValue()}
      </span>
    ),
  }),
  col.accessor("managerName", {
    header: "Responsable",
    cell: (i) => <span className="text-xs text-stone-500">{i.getValue()}</span>,
  }),
  col.accessor("amount", {
    header: "Monto",
    cell: (i) => {
      const row = i.row.original;
      return (
        <span
          className={`block text-right tabular-nums font-semibold ${row.kind === "sale" ? "text-amber-700" : "text-red-600"}`}
        >
          {row.sign}
          {formatCurrency(i.getValue())}
        </span>
      );
    },
  }),
  col.accessor("cancelled", {
    header: "Estado",
    cell: (i) =>
      i.getValue() ? (
        <span className="badge-cancelled">Anulado</span>
      ) : (
        <span className="badge-active">Activo</span>
      ),
  }),
];

interface Props {
  sales: Sale[];
  expenses: ExpenseWithShift[];
  shifts: Shift[];
}

export function MovimientosHistorialClient({ sales, expenses, shifts }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [shiftFilter, setShiftFilter] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "sale" | "expense">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "cancelled"
  >("all");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Construir rows unificados
  const allRows: Row[] = useMemo(
    () => [
      ...sales.map(
        (s): Row => ({
          id: `s-${s.id}`,
          kind: "sale",
          createdAt: s.createdAt,
          description: s.productName,
          detail: s.priceType,
          paymentMethod: s.paymentMethod,
          amount: s.total,
          sign: "+",
          managerName: s.managerName,
          shiftId: s.shiftId,
          cancelled: s.cancelled,
        }),
      ),
      ...expenses.map(
        (e): Row => ({
          id: `e-${e.id}`,
          kind: "expense",
          createdAt: e.createdAt,
          description: e.description,
          detail: e.category,
          paymentMethod: e.paymentMethod,
          amount: e.amount,
          sign: "-",
          managerName: e.managerName,
          shiftId: e.shiftId,
          cancelled: e.cancelled,
        }),
      ),
    ],
    [sales, expenses],
  );

  const filtered = useMemo(() => {
    return allRows.filter((r) => {
      if (kindFilter !== "all" && r.kind !== kindFilter) return false;
      if (shiftFilter && r.shiftId !== shiftFilter) return false;
      if (statusFilter === "active" && r.cancelled) return false;
      if (statusFilter === "cancelled" && !r.cancelled) return false;
      if (paymentFilter && r.paymentMethod !== paymentFilter) return false;
      if (dateFrom && new Date(r.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.createdAt) > new Date(dateTo + "T23:59:59"))
        return false;
      return true;
    });
  }, [
    allRows,
    kindFilter,
    shiftFilter,
    statusFilter,
    paymentFilter,
    dateFrom,
    dateTo,
  ]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
    getRowId: (row) => row.id,
  });

  // Totales calculados sobre resultados filtrados (sin anulados)
  const totalSales = filtered
    .filter((r) => r.kind === "sale" && !r.cancelled)
    .reduce((s, r) => s + r.amount, 0);
  const totalExpenses = filtered
    .filter((r) => r.kind === "expense" && !r.cancelled)
    .reduce((s, r) => s + r.amount, 0);
  const balance = totalSales - totalExpenses;

  function resetFilters() {
    setSorting([{ id: "createdAt", desc: true }]);
    setShiftFilter("");
    setKindFilter("all");
    setStatusFilter("all");
    setPaymentFilter("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <select
              className="form-select"
              value={kindFilter}
              onChange={(e) =>
                setKindFilter(e.target.value as typeof kindFilter)
              }
            >
              <option value="all">Ventas y gastos</option>
              <option value="sale">Solo ventas</option>
              <option value="expense">Solo gastos</option>
            </select>

            <select
              className="form-select"
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
            >
              <option value="">Todos los turnos</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shiftType === "morning" ? "Mañana" : "Tarde"} —{" "}
                  {s.managerName}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo activos</option>
              <option value="cancelled">Solo anulados</option>
            </select>

            <select
              className="form-select"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="">Todos los medios de pago</option>
              <option value="efectivo">Efectivo</option>
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
              <option value="transferencia">Transferencia</option>
            </select>

            <input
              type="date"
              className="form-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="form-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Resumen + limpiar */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
            <div className="flex items-center gap-4">
              <span className="text-xs text-stone-400">
                {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}
              </span>
              <button
                className="text-xs text-stone-400 underline hover:text-stone-600"
                onClick={resetFilters}
              >
                Limpiar filtros
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-amber-700">
                +{formatCurrency(totalSales)}
              </span>
              <span className="font-medium text-red-600">
                -{formatCurrency(totalExpenses)}
              </span>
              <span
                className={`font-semibold ${balance >= 0 ? "text-green-700" : "text-red-700"}`}
              >
                = {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={
                        header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : ""
                      }
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" && (
                          <ChevronUp className="size-3" />
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <ChevronDown className="size-3" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.original.cancelled ? "opacity-50" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center text-sm text-stone-400"
                  >
                    No hay movimientos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3">
          <span className="text-xs text-stone-500">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {Math.max(table.getPageCount(), 1)}
          </span>
          <div className="flex items-center gap-1">
            <button
              className="btn-ghost btn-sm p-1.5"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              className="btn-ghost btn-sm p-1.5"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
