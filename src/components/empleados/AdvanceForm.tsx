"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createAdvanceAction } from "@/src/actions/employee.actions"
import { formatCurrency } from "@/src/lib/utils/currency"
import { format } from "date-fns"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface Props {
  employeeId:   string
  employeeName: string
  baseSalary:   number
}

export function AdvanceForm({ employeeId, employeeName, baseSalary }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [amount, setAmount] = useState("")
  const [date,   setDate]   = useState(format(new Date(), "yyyy-MM-dd"))
  const [notes,  setNotes]  = useState("")

  function handleSubmit() {
    setError(null)
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      setError("Ingresá un monto válido mayor a 0.")
      return
    }
    startTransition(async () => {
      const result = await createAdvanceAction({
        employeeId,
        date,
        amount: amt,
        notes: notes.trim() || undefined,
      })
      if (!result.success) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => router.push(`/empleados/${employeeId}`), 900)
      }
    })
  }

  if (success) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10">
        <CheckCircle2 className="size-12 text-green-500" />
        <p className="text-lg font-semibold text-stone-900">Adelanto registrado</p>
        <p className="text-sm text-stone-500">Redirigiendo...</p>
      </div>
    )
  }

  const amt = parseFloat(amount) || 0

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Adelanto de sueldo — {employeeName}</span>
      </div>
      <div className="card-body space-y-5">

        <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-sm text-stone-500">
          Sueldo base: <strong className="text-stone-700">{formatCurrency(baseSalary)}</strong>
        </div>

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
          <label className="form-label">Monto del adelanto</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">$</span>
            <input
              type="number"
              className="form-input pl-7"
              placeholder="0"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="form-label">
            Notas <span className="font-normal text-stone-400">(opcional)</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Motivo del adelanto..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {amt > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-amber-50 p-4">
            <span className="text-sm font-medium text-stone-600">Monto a registrar</span>
            <span className="text-2xl font-semibold tabular-nums text-amber-700">{formatCurrency(amt)}</span>
          </div>
        )}

        {error && (
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="size-4 shrink-0" />{error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button className="btn-primary flex-1" onClick={handleSubmit} disabled={isPending || amt <= 0}>
            {isPending ? "Registrando..." : `Registrar adelanto · ${formatCurrency(amt)}`}
          </button>
          <button className="btn-secondary" onClick={() => router.push(`/empleados/${employeeId}`)} disabled={isPending}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
