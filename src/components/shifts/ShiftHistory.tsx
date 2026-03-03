import type { Shift } from "@/src/types/shift.types";
import { shiftTypeLabel } from "@/src/modules/shifts/domain/shift.entity";
import { formatDateTime } from "@/src/lib/utils/dates";
import { formatCurrency } from "@/src/lib/utils/currency";
import { ShiftTotals } from "@/src/actions/shift-totals.actions";

interface Props {
  shifts: Shift[];
  totals: ShiftTotals[];
}

export function ShiftHistory({ shifts, totals }: Props) {
  const totalsMap = Object.fromEntries(totals.map((t) => [t.shiftId, t]));

  if (shifts.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Historial de turnos</span>
        </div>
        <div className="card-body">
          <p className="py-8 text-center text-sm text-stone-400">
            No hay turnos registrados aún.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Historial de turnos</span>
        <span className="text-xs text-stone-400">
          {shifts.length} registros
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Responsable</th>
              <th>Apertura</th>
              <th>Cierre</th>
              <th>Estado</th>
              <th className="text-right">Ventas</th>
              <th className="text-right">Gastos</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => {
              const t = totalsMap[shift.id];
              const balance = t?.netBalance ?? 0;
              return (
                <tr key={shift.id}>
                  <td>
                    <span
                      className={
                        shift.shiftType === "morning"
                          ? "badge-morning"
                          : "badge-afternoon"
                      }
                    >
                      {shiftTypeLabel(shift.shiftType)}
                    </span>
                  </td>
                  <td className="font-medium">{shift.managerName}</td>
                  <td className="tabular-nums text-sm text-stone-500">
                    {formatDateTime(shift.startedAt)}
                  </td>
                  <td className="tabular-nums text-sm text-stone-500">
                    {shift.endedAt ? formatDateTime(shift.endedAt) : "—"}
                  </td>
                  <td>
                    <span
                      className={
                        shift.status === "open" ? "badge-open" : "badge-closed"
                      }
                    >
                      {shift.status === "open" ? "● Abierto" : "Cerrado"}
                    </span>
                  </td>

                  <td className="text-right tabular-nums text-sm font-medium">
                    <span className="text-green-600">
                      {t ? formatCurrency(t.totalSales) : "—"}
                    </span>
                  </td>
                  <td className="text-right tabular-nums text-sm font-medium">
                    <span className="text-red-600">
                      {t ? formatCurrency(t.totalExpenses) : "—"}
                    </span>
                  </td>
                  <td
                    className={"text-right tabular-nums text-sm font-semibold"}
                  >
                    <span
                      className={
                        balance >= 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {t ? formatCurrency(balance) : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
