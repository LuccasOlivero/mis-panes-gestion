"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { openShiftAction, closeShiftAction } from "@/src/actions/shift.actions"
import type { OpenShiftSummary } from "@/src/types/shift.types"
import { shiftTypeLabel } from "@/src/modules/shifts/domain/shift.entity"
import { formatTime } from "@/src/lib/utils/dates"
import { Play, Square, Clock, User, AlertCircle } from "lucide-react"

interface Props {
  openShift: OpenShiftSummary | null
}

export function ShiftControls({ openShift }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [managerName, setManagerName] = useState("")
  const [shiftType, setShiftType] = useState<"morning" | "afternoon">("morning")
  const [showForm, setShowForm] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  function handleOpen() {
    if (!managerName.trim()) {
      setError("El nombre del responsable es obligatorio.")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await openShiftAction({ shiftType, managerName: managerName.trim() })
      if (!result.success) {
        setError(result.error)
      } else {
        setShowForm(false)
        setManagerName("")
        router.refresh()
      }
    })
  }

  function handleClose() {
    if (!openShift) return
    startTransition(async () => {
      const result = await closeShiftAction(openShift.id)
      if (!result.success) {
        setError(result.error)
      } else {
        setShowCloseConfirm(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Estado actual</span>
        </div>

        <div className="card-body">
          {openShift ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-3 shrink-0 animate-pulse rounded-full bg-green-500" />
                <div>
                  <p className="text-base font-semibold text-stone-900">
                    {shiftTypeLabel(openShift.shiftType)} — en curso
                  </p>
                  <div className="mt-1 flex items-center gap-4 text-sm text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <User className="size-3.5" />
                      {openShift.managerName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      Desde las {formatTime(openShift.startedAt)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="btn-danger"
                onClick={() => setShowCloseConfirm(true)}
                disabled={isPending}
              >
                <Square className="size-4" />
                Cerrar turno
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-3 shrink-0 rounded-full bg-stone-300" />
                <div>
                  <p className="text-base font-semibold text-stone-500">Sin turno activo</p>
                  <p className="mt-0.5 text-sm text-stone-400">
                    No se pueden registrar ventas ni gastos
                  </p>
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={() => setShowForm(!showForm)}
                disabled={isPending}
              >
                <Play className="size-4" />
                Iniciar turno
              </button>
            </div>
          )}
        </div>

        {/* Formulario de apertura */}
        {showForm && !openShift && (
          <div className="border-t border-stone-100 bg-amber-50/50 px-6 py-5">
            <p className="mb-4 text-sm font-medium text-stone-700">Datos del nuevo turno</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Tipo de turno</label>
                <select
                  className="form-select"
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as "morning" | "afternoon")}
                >
                  <option value="morning">Turno Mañana</option>
                  <option value="afternoon">Turno Tarde</option>
                </select>
              </div>
              <div>
                <label className="form-label">Responsable del turno</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nombre completo"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleOpen()}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button className="btn-primary" onClick={handleOpen} disabled={isPending}>
                {isPending ? "Iniciando..." : "Confirmar apertura"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => { setShowForm(false); setError(null) }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal confirmación de cierre */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100">
              <Square className="size-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">¿Cerrar el turno?</h2>
            <p className="mt-1.5 text-sm text-stone-500">
              Se registrará el cierre de{" "}
              <strong>{openShift && shiftTypeLabel(openShift.shiftType)}</strong>.
              No se podrán registrar ventas ni gastos hasta iniciar uno nuevo.
            </p>

            {error && (
              <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                className="btn-danger flex-1"
                onClick={handleClose}
                disabled={isPending}
              >
                {isPending ? "Cerrando..." : "Sí, cerrar turno"}
              </button>
              <button
                className="btn-secondary flex-1"
                onClick={() => { setShowCloseConfirm(false); setError(null) }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
