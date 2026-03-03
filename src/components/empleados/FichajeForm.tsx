"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  registerCheckInAction,
  registerCheckOutAction,
} from "@/src/actions/employee.actions";
import {
  attendanceStatusLabels,
  attendanceStatusColors,
} from "@/src/modules/employees/domain/employee.entity";
import type {
  EmployeeShift,
  AttendanceStatus,
} from "@/src/types/employee.types";
import { formatTime } from "@/src/lib/utils/dates";
import { Clock, CheckCircle2, AlertCircle, LogIn, LogOut } from "lucide-react";

const STATUSES: AttendanceStatus[] = [
  "presente",
  "tarde",
  "ausente_justificado",
  "ausente_injustificado",
];

interface Props {
  employeeId: string;
  employeeName: string;
  todayShift: EmployeeShift | null;
}

export function FichajeForm({ employeeId, employeeName, todayShift }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState<AttendanceStatus>("presente");
  const [notes, setNotes] = useState("");

  // Estado: sin fichaje hoy → entrada; tiene entrada sin salida → salida
  const hasCheckIn = !!todayShift;
  const hasCheckOut = !!todayShift?.checkOut;

  function handleCheckIn() {
    setError(null);
    startTransition(async () => {
      const result = await registerCheckInAction({
        employeeId,
        status,
        notes: notes.trim() || undefined,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess("Entrada registrada correctamente.");
        setTimeout(() => router.push(`/empleados/${employeeId}`), 1000);
      }
    });
  }

  function handleCheckOut() {
    if (!todayShift) return;
    setError(null);
    startTransition(async () => {
      const result = await registerCheckOutAction({ shiftId: todayShift.id });
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess("Salida registrada correctamente.");
        setTimeout(() => router.push(`/empleados/${employeeId}`), 1000);
      }
    });
  }

  if (success) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10">
        <CheckCircle2 className="size-12 text-green-500" />
        <p className="text-lg font-semibold text-stone-900">{success}</p>
        <p className="text-sm text-stone-500">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estado actual */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="size-6 text-amber-700" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">{employeeName}</p>
              {!hasCheckIn && (
                <p className="text-sm text-stone-500">
                  Sin entrada registrada hoy
                </p>
              )}
              {hasCheckIn && !hasCheckOut && (
                <p className="text-sm text-stone-600">
                  Entró a las <strong>{formatTime(todayShift!.checkIn)}</strong>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${attendanceStatusColors[todayShift!.status]}`}
                  >
                    {attendanceStatusLabels[todayShift!.status]}
                  </span>
                </p>
              )}
              {hasCheckIn && hasCheckOut && (
                <p className="text-sm text-stone-600">
                  Entrada <strong>{formatTime(todayShift!.checkIn)}</strong>
                  {" · "}
                  Salida <strong>{formatTime(todayShift!.checkOut!)}</strong>
                  {todayShift!.hoursWorked !== null && (
                    <span className="ml-2 text-stone-400">
                      ({todayShift!.hoursWorked}hs)
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de entrada */}
      {!hasCheckIn && (
        <div className="card">
          <div className="card-header">
            <LogIn className="size-4 text-stone-400" />
            <span className="card-title">Registrar entrada</span>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="form-label">Estado de asistencia</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-lg border py-2.5 text-sm font-medium transition-all ${
                      status === s
                        ? "border-amber-600 bg-amber-600 text-white"
                        : "border-stone-200 bg-white text-stone-600 hover:border-amber-400"
                    }`}
                  >
                    {attendanceStatusLabels[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">
                Notas{" "}
                <span className="font-normal text-stone-400">(opcional)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Llegó 15 min tarde por el colectivo..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && (
              <p className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full"
              onClick={handleCheckIn}
              disabled={isPending}
            >
              {isPending ? "Registrando..." : "Registrar entrada ahora"}
            </button>
          </div>
        </div>
      )}

      {/* Botón de salida */}
      {hasCheckIn && !hasCheckOut && (
        <div className="card">
          <div className="card-header">
            <LogOut className="size-4 text-stone-400" />
            <span className="card-title">Registrar salida</span>
          </div>
          <div className="card-body space-y-4">
            <p className="text-sm text-stone-500">
              Se registrará la salida con la hora exacta en este momento y se
              calcularán las horas trabajadas.
            </p>

            {error && (
              <p className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full"
              onClick={handleCheckOut}
              disabled={isPending}
            >
              {isPending ? "Registrando..." : "Registrar salida ahora"}
            </button>
          </div>
        </div>
      )}

      {/* Ya fichó entrada y salida */}
      {hasCheckIn && hasCheckOut && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          El fichaje del día está completo. Si necesitás corregirlo, hacelo
          desde la base de datos.
        </div>
      )}
    </div>
  );
}
