"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { upsertProductionRecordAction } from "@/src/actions/production.actions"
import {
  BREAD_TYPES, type BreadKey, type BreadQuantities, type ProductionRecord,
} from "@/src/types/production.types"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle2, AlertCircle, Save, User, X, Clock } from "lucide-react"

function emptyQuantities(): BreadQuantities {
  const q = {} as BreadQuantities
  for (const { key } of BREAD_TYPES) q[key] = 0
  return q
}

// ─── Modal de autor ───────────────────────────────────────────────────────────

interface AuthorModalProps {
  isEdit:        boolean
  employeeNames: string[]
  onConfirm:     (name: string) => void
  onCancel:      () => void
  isPending:     boolean
}

function AuthorModal({ isEdit, employeeNames, onConfirm, onCancel, isPending }: AuthorModalProps) {
  const [selected, setSelected] = useState("")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white shadow-xl">

        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100">
              <User className="size-5 text-amber-700" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">
                {isEdit ? "¿Quién está editando?" : "¿Quién está registrando?"}
              </p>
              <p className="text-xs text-stone-400">Se guardará con hora exacta</p>
            </div>
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
          {employeeNames.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-400">
              No hay empleados activos registrados.
            </p>
          ) : (
            employeeNames.map((name) => (
              <button
                key={name}
                onClick={() => setSelected(name)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                  selected === name
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:border-amber-400 hover:bg-amber-50"
                }`}
              >
                {name}
              </button>
            ))
          )}
        </div>

        <div className="flex gap-3 border-t border-stone-100 px-5 py-4">
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={() => selected && onConfirm(selected)}
            disabled={isPending || !selected}
          >
            {isPending
              ? <><span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Guardando...</>
              : <><CheckCircle2 className="size-4" />{isEdit ? "Confirmar edición" : "Confirmar registro"}</>
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

// ─── Formulario principal ─────────────────────────────────────────────────────

interface Props {
  existingRecord: ProductionRecord | null
  initialDate:    string
  employeeNames:  string[]
}

export function ProductionForm({ existingRecord, initialDate, employeeNames }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [date,      setDate]      = useState(initialDate)
  const [quantities, setQuantities] = useState<BreadQuantities>(
    existingRecord?.quantities ?? emptyQuantities()
  )
  const [notes,     setNotes]     = useState(existingRecord?.notes ?? "")
  const [showModal, setShowModal] = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const isEdit     = !!existingRecord
  const totalLatas = Object.values(quantities).reduce((s, v) => s + v, 0)

  function handleChange(key: BreadKey, value: string) {
    const num = parseInt(value, 10)
    setQuantities((prev) => ({ ...prev, [key]: isNaN(num) || num < 0 ? 0 : num }))
  }

  function handleDateChange(newDate: string) {
    setDate(newDate)
    router.push(`/produccion?fecha=${newDate}`)
  }

  function handleSaveClick() {
    setError(null)
    if (totalLatas === 0) { setError("Ingresá al menos una lata antes de guardar."); return }
    setShowModal(true)
  }

  function handleConfirm(authorName: string) {
    startTransition(async () => {
      const result = await upsertProductionRecordAction({
        recordDate: date,
        quantities,
        authorName,
        isEdit,
        notes: notes.trim() || undefined,
      })
      setShowModal(false)
      if (!result.success) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => { setSuccess(false); router.refresh() }, 1500)
      }
    })
  }

  // Texto de autoría para mostrar en el header del card
  const authorLabel = isEdit
    ? existingRecord.lastEditedBy
      ? `Última edición por ${existingRecord.lastEditedBy} · ${format(parseISO(existingRecord.updatedAt), "dd/MM/yy HH:mm", { locale: es })}`
      : existingRecord.recordedBy
      ? `Registrado por ${existingRecord.recordedBy} · ${format(parseISO(existingRecord.createdAt), "dd/MM/yy HH:mm", { locale: es })}`
      : null
    : null

  return (
    <>
      {showModal && (
        <AuthorModal
          isEdit={isEdit}
          employeeNames={employeeNames}
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
          isPending={isPending}
        />
      )}

      <div className="card">
        <div className="card-header">
          <div className="min-w-0 flex-1">
            <span className="card-title">
              {isEdit ? "Editar producción" : "Registrar producción"}
            </span>
            {authorLabel && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
                <Clock className="size-3 shrink-0" />
                {authorLabel}
              </p>
            )}
          </div>
          {totalLatas > 0 && (
            <span className="shrink-0 text-xs font-semibold text-amber-700">
              {totalLatas} latas
            </span>
          )}
        </div>

        <div className="card-body space-y-5">

          {/* Fecha */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="form-label mb-0 shrink-0">Fecha:</label>
            <input
              type="date"
              className="form-input w-auto"
              value={date}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => handleDateChange(e.target.value)}
            />
            {isEdit && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Editando registro existente
              </span>
            )}
          </div>

          {/* Grilla de panes */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {BREAD_TYPES.map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {label}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 font-semibold text-stone-500 transition-all hover:bg-stone-100 active:scale-95"
                    onClick={() => handleChange(key, String(Math.max(0, (quantities[key] ?? 0) - 1)))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    className="form-input min-w-0 flex-1 px-1 text-center text-lg font-bold tabular-nums text-stone-900"
                    value={quantities[key] === 0 ? "" : quantities[key]}
                    placeholder="0"
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                  <button
                    type="button"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 font-semibold text-stone-500 transition-all hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 active:scale-95"
                    onClick={() => handleChange(key, String((quantities[key] ?? 0) + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Notas */}
          <div>
            <label className="form-label">
              Notas <span className="font-normal text-stone-400">(opcional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Observaciones del día..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Resumen */}
          {totalLatas > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-stone-100 bg-stone-50 p-3 sm:grid-cols-3 lg:grid-cols-4">
              {BREAD_TYPES.filter(({ key }) => quantities[key] > 0).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="mr-2 truncate text-stone-500">{label}</span>
                  <span className="shrink-0 font-bold tabular-nums text-stone-900">{quantities[key]}</span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="size-4 shrink-0" />{error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="size-4 shrink-0" />
              {isEdit ? "Registro actualizado." : "Producción guardada."}
            </p>
          )}

          <button
            className="btn-primary flex w-full items-center justify-center gap-2"
            onClick={handleSaveClick}
            disabled={isPending}
          >
            <Save className="size-4" />
            {isEdit ? "Actualizar registro" : `Guardar producción${totalLatas > 0 ? ` · ${totalLatas} latas` : ""}`}
          </button>
        </div>
      </div>
    </>
  )
}
