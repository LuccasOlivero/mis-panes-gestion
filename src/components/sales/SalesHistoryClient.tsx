"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import type { Sale } from "@/src/types/sale.types";
import type { Shift } from "@/src/types/shift.types";
import { formatCurrency } from "@/src/lib/utils/currency";
import { formatDateTime } from "@/src/lib/utils/dates";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const col = createColumnHelper<Sale>();

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

const columns = [
  col.accessor("createdAt", {
    header: "Fecha / Hora",
    cell: (i) => (
      <span className="tabular-nums text-xs text-stone-500">
        {formatDateTime(i.getValue())}
      </span>
    ),
  }),
  col.accessor("productName", {
    header: "Producto",
    cell: (i) => <span className="font-medium">{i.getValue()}</span>,
  }),
  col.accessor("priceType", {
    header: "Tipo",
    cell: (i) => (
      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
        {PRICE_LABELS[i.getValue()]}
      </span>
    ),
  }),
  col.accessor("quantity", {
    header: "Cant.",
    cell: (i) => (
      <span className="block text-right tabular-nums">{i.getValue()}</span>
    ),
  }),
  col.accessor("unitPrice", {
    header: "Precio",
    cell: (i) => (
      <span className="block text-right tabular-nums">
        {formatCurrency(i.getValue())}
      </span>
    ),
  }),
  col.accessor("discount", {
    header: "Desc.",
    cell: (i) => (
      <span className="block text-right tabular-nums text-stone-400">
        {i.getValue() > 0 ? formatCurrency(i.getValue()) : "—"}
      </span>
    ),
  }),
  col.accessor("total", {
    header: "Total",
    cell: (i) => (
      <span className="block text-right tabular-nums font-semibold">
        {formatCurrency(i.getValue())}
      </span>
    ),
  }),
  col.accessor("paymentMethod", {
    header: "Pago",
    cell: (i) => (
      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
        {PAYMENT_LABELS[i.getValue()]}
      </span>
    ),
  }),
  col.accessor("managerName", {
    header: "Responsable",
    cell: (i) => <span className="text-xs text-stone-500">{i.getValue()}</span>,
  }),
  col.accessor("cancelled", {
    header: "Estado",
    cell: (i) =>
      i.getValue() ? (
        <span className="badge-cancelled">Anulada</span>
      ) : (
        <span className="badge-active">Activa</span>
      ),
  }),
];

interface Props {
  sales: Sale[];
  shifts: Shift[];
}

export function SalesHistoryClient({ sales, shifts }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "cancelled"
  >("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (shiftFilter && s.shiftId !== shiftFilter) return false;
      if (statusFilter === "active" && s.cancelled) return false;
      if (statusFilter === "cancelled" && !s.cancelled) return false;
      if (dateFrom && new Date(s.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(s.createdAt) > new Date(dateTo + "T23:59:59"))
        return false;
      return true;
    });
  }, [sales, shiftFilter, statusFilter, dateFrom, dateTo]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const totalActive = filtered
    .filter((s) => !s.cancelled)
    .reduce((a, s) => a + s.total, 0);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <input
              type="text"
              className="form-input"
              placeholder="Buscar producto..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
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
              <option value="active">Solo activas</option>
              <option value="cancelled">Solo anuladas</option>
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
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
            <span className="text-xs text-stone-500">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
            <span className="text-sm font-semibold text-amber-700">
              Total activas: {formatCurrency(totalActive)}
            </span>
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
