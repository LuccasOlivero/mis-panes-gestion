"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSanctionAction } from "@/src/actions/employee.actions";
import { formatCurrency } from "@/src/lib/utils/currency";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface Props {
  employeeId: string;
  employeeName: string;
}

export function SanctionForm({ employeeId, employeeName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reason, setReason] = useState("");
  const [hasPenalty, setHasPenalty] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState("");

  function handleSubmit() {
    setError(null);
    if (!reason.trim()) {
      setError("El motivo de la sanción es obligatorio.");
      return;
    }
    const penalty = hasPenalty ? parseFloat(penaltyAmount) : undefined;
    if (hasPenalty && (!penalty || penalty <= 0)) {
      setError("Ingresá un monto de penalización válido.");
      return;
    }

    startTransition(async () => {
      const result = await createSanctionAction({
        employeeId,
        date,
        reason: reason.trim(),
        penaltyAmount: penalty,
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
          Sanción registrada
        </p>
        <p className="text-sm text-stone-500">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <AlertTriangle className="size-4 text-red-500" />
        <span className="card-title">Registrar sanción — {employeeName}</span>
      </div>
      <div className="card-body space-y-5">
        <div>
          <label className="form-label">Fecha</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">Motivo / descripción</label>
          <textarea
            className="form-input resize-none"
            rows={3}
            placeholder="Describí el motivo de la sanción..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        </div>

        {/* Toggle penalización económica */}
        <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4">
          <div>
            <p className="text-sm font-medium text-stone-700">
              Penalización económica
            </p>
            <p className="text-xs text-stone-400">
              Opcional — se descuenta en la liquidación
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setHasPenalty(!hasPenalty);
              setPenaltyAmount("");
            }}
            className={`relative h-6 w-11 rounded-full transition-colors ${hasPenalty ? "bg-red-500" : "bg-stone-300"}`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${hasPenalty ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        {hasPenalty && (
          <div>
            <label className="form-label">Monto de la penalización</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
                $
              </span>
              <input
                type="number"
                className="form-input pl-7"
                placeholder="0"
                min="0"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}

        {hasPenalty && parseFloat(penaltyAmount) > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4">
            <span className="text-sm font-medium text-stone-600">
              Penalización
            </span>
            <span className="text-2xl font-semibold tabular-nums text-red-600">
              -{formatCurrency(parseFloat(penaltyAmount))}
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
            className="btn-danger flex-1"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "Registrando..." : "Registrar sanción"}
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
