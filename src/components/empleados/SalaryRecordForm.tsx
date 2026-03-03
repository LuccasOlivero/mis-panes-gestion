"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSalaryRecordAction } from "@/src/actions/employee.actions";
import { formatCurrency } from "@/src/lib/utils/currency";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, ClipboardList } from "lucide-react";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

interface Props {
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  // Totales del mes actual como sugerencia informativa
  monthAdvances: number;
  monthPenalties: number;
}

export function SalaryRecordForm({
  employeeId,
  employeeName,
  baseSalary,
  monthAdvances,
  monthPenalties,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"));
  const [salaryAmount, setSalaryAmount] = useState(String(baseSalary));
  const [finalPaid, setFinalPaid] = useState("");
  const [notes, setNotes] = useState("");

  const salary = parseFloat(salaryAmount) || 0;
  const paid = parseFloat(finalPaid) || 0;
  const [y, m] = period.split("-").map(Number);
  const periodLabel = `${MONTH_NAMES[m - 1]} ${y}`;

  function handleSubmit() {
    setError(null);
    if (!period || salary <= 0) {
      setError("Completá el período y el sueldo acordado.");
      return;
    }
    if (paid <= 0) {
      setError("Ingresá el monto efectivamente pagado.");
      return;
    }
    startTransition(async () => {
      const result = await createSalaryRecordAction({
        employeeId,
        period,
        salaryAmount: salary,
        finalPaid: paid,
        notes: notes.trim() || undefined,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => router.push(`/empleados/${employeeId}`), 900);
      }
    });
  }

  if (success) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10">
        <CheckCircle2 className="size-12 text-green-500" />
        <p className="text-lg font-semibold text-stone-900">
          Liquidación registrada
        </p>
        <p className="text-sm text-stone-500">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <ClipboardList className="size-4 text-stone-400" />
        <span className="card-title">Liquidación — {employeeName}</span>
      </div>
      <div className="card-body space-y-5">
        <div>
          <label className="form-label">Período</label>
          <input
            type="month"
            className="form-input"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">
            Sueldo acordado para {periodLabel}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
              $
            </span>
            <input
              type="number"
              className="form-input pl-7"
              min="0"
              value={salaryAmount}
              onChange={(e) => setSalaryAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Resumen informativo del mes */}
        <div className="rounded-xl border border-stone-100 bg-stone-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Resumen del período
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-stone-600">Sueldo acordado</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(salary)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-600">Adelantos del período</span>
            <span className="font-medium tabular-nums text-amber-700">
              {monthAdvances > 0 ? `-${formatCurrency(monthAdvances)}` : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-600">Penalizaciones</span>
            <span className="font-medium tabular-nums text-red-600">
              {monthPenalties > 0 ? `-${formatCurrency(monthPenalties)}` : "—"}
            </span>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-semibold">
            <span className="text-stone-700">Referencia</span>
            <span className="tabular-nums text-green-700">
              {formatCurrency(
                Math.max(0, salary - monthAdvances - monthPenalties),
              )}
            </span>
          </div>
          <p className="text-xs text-stone-400">
            * El monto de referencia es informativo. Ingresás manualmente lo que
            se pagó.
          </p>
        </div>

        <div>
          <label className="form-label">Monto efectivamente pagado</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
              $
            </span>
            <input
              type="number"
              className="form-input pl-7"
              placeholder="0"
              min="0"
              value={finalPaid}
              onChange={(e) => setFinalPaid(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="form-label">
            Notas <span className="font-normal text-stone-400">(opcional)</span>
          </label>
          <textarea
            className="form-input resize-none"
            rows={2}
            placeholder="Observaciones sobre la liquidación..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {paid > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-4">
            <span className="text-sm font-medium text-stone-600">
              Registrar pago de
            </span>
            <span className="text-2xl font-semibold tabular-nums text-green-700">
              {formatCurrency(paid)}
            </span>
          </div>
        )}

        {error && (
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            className="btn-primary flex-1"
            onClick={handleSubmit}
            disabled={isPending || paid <= 0}
          >
            {isPending ? "Registrando..." : "Confirmar liquidación"}
          </button>
          <button
            className="btn-secondary"
            onClick={() => router.push(`/empleados/${employeeId}`)}
            disabled={isPending}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
