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
import type { ExpenseWithShift } from "@/src/types/expense.types";
import type { Shift } from "@/src/types/shift.types";
import type { ExpenseCategory } from "@/src/types/database.types";
import { formatCurrency } from "@/src/lib/utils/currency";
import { formatDateTime } from "@/src/lib/utils/dates";
import { expenseCategoryLabels } from "@/src/modules/expenses/domain/expense.entity";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

const col = createColumnHelper<ExpenseWithShift>();

const columns = [
  col.accessor("createdAt", {
    header: "Fecha / Hora",
    cell: (i) => (
      <span className="tabular-nums text-xs text-stone-500">
        {formatDateTime(i.getValue())}
      </span>
    ),
  }),
  col.accessor("description", {
    header: "Descripción",
    cell: (i) => <span className="font-medium">{i.getValue()}</span>,
  }),
  col.accessor("category", {
    header: "Categoría",
    cell: (i) => (
      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
        {expenseCategoryLabels[i.getValue()] ?? i.getValue()}
      </span>
    ),
  }),
  col.accessor("amount", {
    header: "Monto",
    cell: (i) => (
      <span className="block text-right tabular-nums font-semibold text-red-600">
        {formatCurrency(i.getValue())}
      </span>
    ),
  }),
  col.accessor("paymentMethod", {
    header: "Pago",
    cell: (i) => (
      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
        {i.getValue()}
      </span>
    ),
  }),
  col.accessor("managerName", {
    header: "Responsable",
    cell: (i) => <span className="text-xs text-stone-500">{i.getValue()}</span>,
  }),
  col.accessor("receiptUrl", {
    header: "Comp.",
    cell: (i) =>
      i.getValue() ? (
        <a
          href={i.getValue()!}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 hover:text-amber-700"
        >
          <ExternalLink className="size-3.5" />
        </a>
      ) : (
        <span className="text-xs text-stone-300">—</span>
      ),
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

const CATEGORIES = Object.entries(expenseCategoryLabels) as [
  ExpenseCategory,
  string,
][];

interface Props {
  expenses: ExpenseWithShift[];
  shifts: Shift[];
}

export function ExpensesHistoryClient({ expenses, shifts }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [shiftFilter, setShiftFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (shiftFilter && e.shiftId !== shiftFilter) return false;
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (dateFrom && new Date(e.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(e.createdAt) > new Date(dateTo + "T23:59:59"))
        return false;
      return true;
    });
  }, [expenses, shiftFilter, categoryFilter, dateFrom, dateTo]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const totalActive = filtered
    .filter((e) => !e.cancelled)
    .reduce((a, e) => a + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {CATEGORIES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
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
              {filtered.length} resultados
            </span>
            <span className="text-sm font-semibold text-red-600">
              Total: {formatCurrency(totalActive)}
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
