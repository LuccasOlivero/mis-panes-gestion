"use client";

import { useState } from "react";
import Link from "next/link";
import type { EmployeeProfileSummary } from "@/src/types/employee.types";
import {
  employeeRoleLabels,
  attendanceStatusLabels,
  attendanceStatusColors,
} from "@/src/modules/employees/domain/employee.entity";
import { formatCurrency } from "@/src/lib/utils/currency";
import { formatDate, formatDateTime, formatTime } from "@/src/lib/utils/dates";
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  ClipboardList,
  Clock,
  TrendingDown,
  Plus,
  Pencil,
} from "lucide-react";

type Tab = "asistencia" | "adelantos" | "sanciones" | "liquidaciones";

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
  profile: EmployeeProfileSummary;
  currentMonth: string; // "2026-02"
  employeeId: string;
}

export function EmployeeProfile({ profile, currentMonth, employeeId }: Props) {
  const [tab, setTab] = useState<Tab>("asistencia");
  const {
    employee,
    todayShift,
    monthShifts,
    advances,
    sanctions,
    salaryRecords,
    monthStats,
  } = profile;

  const [year, month] = currentMonth.split("-").map(Number);
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  // Navegación de mes
  const prevMonth =
    month === 1
      ? `${year - 1}-12`
      : `${year}-${String(month - 1).padStart(2, "0")}`;
  const nextMonth =
    month === 12
      ? `${year + 1}-01`
      : `${year}-${String(month + 1).padStart(2, "0")}`;

  const TABS: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: "asistencia", label: "Asistencia", icon: Calendar },
    { id: "adelantos", label: "Adelantos", icon: DollarSign },
    { id: "sanciones", label: "Sanciones", icon: AlertTriangle },
    { id: "liquidaciones", label: "Liquidaciones", icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      {/* Header del empleado */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl font-bold text-amber-700">
                {employee.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-stone-900">
                    {employee.fullName}
                  </h2>
                  {!employee.active && (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                      Inactivo
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm text-stone-500">
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {employeeRoleLabels[employee.role]}
                  </span>
                  <span>Ingresó {formatDate(employee.hireDate)}</span>
                  <span className="font-medium text-stone-700">
                    ${employee.baseSalary.toLocaleString("es-AR")} / mes
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/empleados/${employeeId}/fichaje`}
                className="btn-primary btn-sm"
              >
                <Clock className="size-3.5" />
                Fichar
              </Link>
              <Link
                href={`/empleados/${employeeId}/editar`}
                className="btn-ghost btn-sm"
              >
                <Pencil className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Fichaje de hoy */}
          <div className="mt-4 rounded-xl border border-stone-100 bg-stone-50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
              Hoy
            </p>
            {todayShift ? (
              <div className="flex items-center gap-4 text-sm">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${attendanceStatusColors[todayShift.status]}`}
                >
                  {attendanceStatusLabels[todayShift.status]}
                </span>
                <span className="text-stone-600">
                  Entrada: <strong>{formatTime(todayShift.checkIn)}</strong>
                </span>
                {todayShift.checkOut ? (
                  <span className="text-stone-600">
                    Salida: <strong>{formatTime(todayShift.checkOut)}</strong>
                    {todayShift.hoursWorked && (
                      <span className="ml-2 text-stone-400">
                        ({todayShift.hoursWorked}hs)
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    Sin salida registrada
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No fichó hoy todavía.</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-stone-200 bg-white p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === id
                ? "bg-amber-600 text-white shadow-sm"
                : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Asistencia ─────────────────────────────────────────────────── */}
      {tab === "asistencia" && (
        <div className="space-y-4">
          {/* Navegador de mes */}
          <div className="flex items-center justify-between">
            <Link
              href={`/empleados/${employeeId}?mes=${prevMonth}`}
              className="btn-ghost btn-sm"
            >
              ← Anterior
            </Link>
            <span className="text-sm font-semibold text-stone-700">
              {monthLabel}
            </span>
            <Link
              href={`/empleados/${employeeId}?mes=${nextMonth}`}
              className="btn-ghost btn-sm"
            >
              Siguiente →
            </Link>
          </div>

          {/* Stats del mes */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="stat-card">
              <span className="stat-label">Presentes</span>
              <span className="stat-value text-green-700">
                {monthStats.present}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Tardanzas</span>
              <span className="stat-value text-amber-700">
                {monthStats.late}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Aus. justificadas</span>
              <span className="stat-value text-blue-700">
                {monthStats.absentJustified}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Aus. injustificadas</span>
              <span className="stat-value text-red-600">
                {monthStats.absentUnjustified}
              </span>
            </div>
          </div>

          {/* Tabla de asistencia */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Registros de asistencia</span>
              <span className="text-xs text-stone-400">
                {monthStats.totalHours.toFixed(1)} hs totales
              </span>
            </div>
            {monthShifts.length === 0 ? (
              <div className="card-body">
                <p className="py-6 text-center text-sm text-stone-400">
                  Sin registros este mes.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Estado</th>
                      <th>Entrada</th>
                      <th>Salida</th>
                      <th className="text-right">Horas</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthShifts.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${attendanceStatusColors[s.status]}`}
                          >
                            {attendanceStatusLabels[s.status]}
                          </span>
                        </td>
                        <td className="tabular-nums text-sm text-stone-600">
                          {formatDateTime(s.checkIn)}
                        </td>
                        <td className="tabular-nums text-sm text-stone-600">
                          {s.checkOut ? (
                            formatDateTime(s.checkOut)
                          ) : (
                            <span className="text-amber-600">—</span>
                          )}
                        </td>
                        <td className="text-right tabular-nums text-sm font-medium">
                          {s.hoursWorked !== null ? `${s.hoursWorked}hs` : "—"}
                        </td>
                        <td className="text-xs text-stone-400">
                          {s.notes ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Adelantos ──────────────────────────────────────────────────── */}
      {tab === "adelantos" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={`/empleados/${employeeId}/adelanto`}
              className="btn-primary btn-sm"
            >
              <Plus className="size-3.5" />
              Registrar adelanto
            </Link>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Historial de adelantos</span>
              <span className="text-xs font-medium text-stone-500">
                Este mes: {formatCurrency(monthStats.totalAdvances)}
              </span>
            </div>
            {advances.length === 0 ? (
              <div className="card-body">
                <p className="py-6 text-center text-sm text-stone-400">
                  Sin adelantos registrados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Notas</th>
                      <th className="text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advances.map((a) => (
                      <tr key={a.id}>
                        <td className="text-sm text-stone-600">
                          {formatDate(a.date)}
                        </td>
                        <td className="text-sm text-stone-400">
                          {a.notes ?? "—"}
                        </td>
                        <td className="text-right tabular-nums font-semibold text-amber-700">
                          {formatCurrency(a.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Sanciones ──────────────────────────────────────────────────── */}
      {tab === "sanciones" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={`/empleados/${employeeId}/sancion`}
              className="btn-danger btn-sm"
            >
              <Plus className="size-3.5" />
              Registrar sanción
            </Link>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Historial de sanciones</span>
              {monthStats.totalPenalties > 0 && (
                <span className="text-xs font-medium text-red-600">
                  Este mes: -{formatCurrency(monthStats.totalPenalties)}
                </span>
              )}
            </div>
            {sanctions.length === 0 ? (
              <div className="card-body">
                <p className="py-6 text-center text-sm text-stone-400">
                  Sin sanciones registradas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Motivo</th>
                      <th className="text-right">Penalización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sanctions.map((s) => (
                      <tr key={s.id}>
                        <td className="text-sm text-stone-600">
                          {formatDate(s.date)}
                        </td>
                        <td className="text-sm text-stone-700">{s.reason}</td>
                        <td className="text-right tabular-nums text-sm font-medium text-red-600">
                          {s.penaltyAmount
                            ? `-${formatCurrency(s.penaltyAmount)}`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Liquidaciones ──────────────────────────────────────────────── */}
      {tab === "liquidaciones" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={`/empleados/${employeeId}/liquidacion`}
              className="btn-primary btn-sm"
            >
              <Plus className="size-3.5" />
              Registrar liquidación
            </Link>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Historial de liquidaciones</span>
            </div>
            {salaryRecords.length === 0 ? (
              <div className="card-body">
                <p className="py-6 text-center text-sm text-stone-400">
                  Sin liquidaciones registradas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th className="text-right">Sueldo acordado</th>
                      <th className="text-right">Adelantos</th>
                      <th className="text-right">Penalizaciones</th>
                      <th className="text-right">Pagado</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryRecords.map((r) => {
                      const [y, m] = r.period.split("-").map(Number);
                      return (
                        <tr key={r.id}>
                          <td className="font-medium">
                            {MONTH_NAMES[m - 1]} {y}
                          </td>
                          <td className="text-right tabular-nums text-sm">
                            {formatCurrency(r.salaryAmount)}
                          </td>
                          <td className="text-right tabular-nums text-sm text-amber-700">
                            {r.totalAdvances > 0
                              ? `-${formatCurrency(r.totalAdvances)}`
                              : "—"}
                          </td>
                          <td className="text-right tabular-nums text-sm text-red-600">
                            {r.totalPenalties > 0
                              ? `-${formatCurrency(r.totalPenalties)}`
                              : "—"}
                          </td>
                          <td className="text-right tabular-nums font-semibold text-green-700">
                            {formatCurrency(r.finalPaid)}
                          </td>
                          <td className="text-xs text-stone-400">
                            {r.notes ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
