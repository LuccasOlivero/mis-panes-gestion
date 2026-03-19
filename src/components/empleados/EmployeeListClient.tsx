"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  registerCheckInAction,
  registerCheckOutAction,
} from "@/src/actions/employee-shift.actions"
import {
  employeeRoleLabels,
  attendanceStatusColors,
  attendanceStatusLabels,
} from "@/src/modules/employees/domain/employee.entity"
import type { Employee, EmployeeShift, AttendanceStatus } from "@/src/types/employee.types"
import { formatDate, formatTime } from "@/src/lib/utils/dates"
import { LogIn, LogOut, AlertCircle, CheckCircle2, X } from "lucide-react"

const STATUSES: AttendanceStatus[] = [
  "presente",
  "tarde",
  "ausente_justificado",
  "ausente_injustificado",
]

// ─── Modal de check-in — fixed, fuera de cualquier overflow ──────────────────

interface CheckInModalProps {
  employee:  Employee
  onConfirm: (status: AttendanceStatus) => void
  onCancel:  () => void
  isPending: boolean
}

function CheckInModal({ employee, onConfirm, onCancel, isPending }: CheckInModalProps) {
  const [status, setStatus] = useState<AttendanceStatus>("presente")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white shadow-xl">

        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <p className="font-semibold text-stone-900">Registrar entrada</p>
            <p className="text-xs text-stone-400">{employee.fullName}</p>
          </div>
          <button
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 transition-colors"
            onClick={onCancel}
            disabled={isPending}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">
            Estado de asistencia
          </p>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                status === s
                  ? "border-amber-600 bg-amber-600 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-amber-400 hover:bg-amber-50"
              }`}
            >
              {attendanceStatusLabels[s]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-stone-100 px-5 py-4 sm:flex-row">
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            onClick={() => onConfirm(status)}
            disabled={isPending}
          >
            {isPending
              ? <><span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Registrando...</>
              : <><CheckCircle2 className="size-4" />Registrar entrada</>
            }
          </button>
          <button className="btn-secondary" onClick={onCancel} disabled={isPending}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Fila — recibe callbacks, no maneja modal ─────────────────────────────────

interface EmployeeRowProps {
  employee:       Employee
  todayShift:     EmployeeShift | null
  onCheckInClick: (employee: Employee) => void
  onCheckOut:     () => void
  isPendingOut:   boolean
  feedback:       "checkin" | "checkout" | null
  error:          string | null
}

function EmployeeRow({ employee, todayShift, onCheckInClick, onCheckOut, isPendingOut, feedback, error }: EmployeeRowProps) {
  const hasCheckIn  = !!todayShift
  const hasCheckOut = !!todayShift?.checkOut

  return (
    <tr className={!employee.active ? "opacity-60" : undefined}>
      <td>
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
            {employee.fullName.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{employee.fullName}</span>
        </div>
      </td>
      <td>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
          {employeeRoleLabels[employee.role]}
        </span>
      </td>
      <td className="text-sm text-stone-500">{formatDate(employee.hireDate)}</td>
      <td>
        {!hasCheckIn && <span className="text-xs text-stone-400">Sin fichar</span>}
        {hasCheckIn && !hasCheckOut && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${attendanceStatusColors[todayShift!.status]}`}>
              {attendanceStatusLabels[todayShift!.status]}
            </span>
            <span className="text-xs text-stone-400">desde {formatTime(todayShift!.checkIn)}</span>
          </div>
        )}
        {hasCheckIn && hasCheckOut && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${attendanceStatusColors[todayShift!.status]}`}>
              {attendanceStatusLabels[todayShift!.status]}
            </span>
            <span className="text-xs text-stone-400">
              {formatTime(todayShift!.checkIn)} – {formatTime(todayShift!.checkOut!)}
              {todayShift!.hoursWorked !== null && ` · ${todayShift!.hoursWorked}hs`}
            </span>
          </div>
        )}
      </td>
      <td>
        <div className="flex items-center justify-end gap-2">
          {feedback === "checkin"  && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="size-3.5" />Entrada</span>}
          {feedback === "checkout" && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="size-3.5" />Salida</span>}
          {error && <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="size-3.5" />{error}</span>}

          {!feedback && employee.active && (
            <>
              {!hasCheckIn && (
                <button className="btn-primary btn-sm flex items-center gap-1.5" onClick={() => onCheckInClick(employee)}>
                  <LogIn className="size-3.5" /> Entrada
                </button>
              )}
              {hasCheckIn && !hasCheckOut && (
                <button className="btn-secondary btn-sm flex items-center gap-1.5" onClick={onCheckOut} disabled={isPendingOut}>
                  <LogOut className="size-3.5" />{isPendingOut ? "..." : "Salida"}
                </button>
              )}
            </>
          )}

          <Link href={`/empleados/${employee.id}`} className="btn-ghost btn-sm text-stone-400">
            Ver →
          </Link>
        </div>
      </td>
    </tr>
  )
}

// ─── Lista completa — modal centralizado fuera de cualquier overflow ──────────

interface Props {
  employees:   Employee[]
  todayShifts: Record<string, EmployeeShift>
}

export function EmployeeListClient({ employees, todayShifts }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [modalEmployee, setModalEmployee] = useState<Employee | null>(null)
  const [modalPending,  setModalPending]  = useState(false)
  const [feedbacks,  setFeedbacks]  = useState<Record<string, "checkin" | "checkout" | null>>({})
  const [errors,     setErrors]     = useState<Record<string, string | null>>({})
  const [pendingOut, setPendingOut] = useState<Record<string, boolean>>({})

  function setFeedback(id: string, v: "checkin" | "checkout" | null) { setFeedbacks((p) => ({ ...p, [id]: v })) }
  function setError(id: string, v: string | null) { setErrors((p) => ({ ...p, [id]: v })) }

  function handleModalConfirm(status: AttendanceStatus) {
    if (!modalEmployee) return
    const id = modalEmployee.id
    setModalPending(true)
    setError(id, null)
    startTransition(async () => {
      const result = await registerCheckInAction({ employeeId: id, status })
      setModalPending(false)
      setModalEmployee(null)
      if (!result.success) {
        setError(id, result.error)
      } else {
        setFeedback(id, "checkin")
        setTimeout(() => { setFeedback(id, null); router.refresh() }, 1200)
      }
    })
  }

  function handleCheckOut(emp: Employee, shift: EmployeeShift) {
    const id = emp.id
    setError(id, null)
    setPendingOut((p) => ({ ...p, [id]: true }))
    startTransition(async () => {
      const result = await registerCheckOutAction({ shiftId: shift.id })
      setPendingOut((p) => ({ ...p, [id]: false }))
      if (!result.success) {
        setError(id, result.error)
      } else {
        setFeedback(id, "checkout")
        setTimeout(() => { setFeedback(id, null); router.refresh() }, 1200)
      }
    })
  }

  const activos   = employees.filter((e) => e.active)
  const inactivos = employees.filter((e) => !e.active)

  const renderTable = (list: Employee[]) => (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr><th>Nombre</th><th>Rol</th><th>Ingreso</th><th>Hoy</th><th /></tr>
        </thead>
        <tbody>
          {list.map((emp) => {
            const shift = todayShifts[emp.id] ?? null
            return (
              <EmployeeRow
                key={emp.id}
                employee={emp}
                todayShift={shift}
                onCheckInClick={setModalEmployee}
                onCheckOut={() => shift && handleCheckOut(emp, shift)}
                isPendingOut={pendingOut[emp.id] ?? false}
                feedback={feedbacks[emp.id] ?? null}
                error={errors[emp.id] ?? null}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <>
      {/* Modal renderizado AQUÍ — fuera de overflow-x-auto, siempre visible */}
      {modalEmployee && (
        <CheckInModal
          employee={modalEmployee}
          onConfirm={handleModalConfirm}
          onCancel={() => setModalEmployee(null)}
          isPending={modalPending}
        />
      )}

      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Empleados activos</span>
            <span className="text-xs text-stone-400">{activos.length} empleados</span>
          </div>
          {activos.length === 0
            ? <div className="card-body"><p className="py-8 text-center text-sm text-stone-400">No hay empleados activos.</p></div>
            : renderTable(activos)
          }
        </div>

        {inactivos.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Inactivos / bajas</span>
              <span className="text-xs text-stone-400">{inactivos.length}</span>
            </div>
            {renderTable(inactivos)}
          </div>
        )}
      </div>
    </>
  )
}
