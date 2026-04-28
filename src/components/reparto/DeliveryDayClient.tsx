"use client"

import { useState, useTransition } from "react"
import type { Dispatch, SetStateAction } from "react"
import {
  createDeliverySaleAction,
  createDeliveryClientAction,
  deleteDeliverySaleAction,
  createDeliveryExpenseAction,
  deleteDeliveryExpenseAction,
} from "@/src/actions/delivery.actions"
import type {
  DeliveryClient,
  DeliverySale,
  DeliveryExpense,
} from "@/src/types/delivery.types"
import { formatCurrency } from "@/src/lib/utils/currency"
import { formatDateTime } from "@/src/lib/utils/dates"
import {
  Plus, Trash2, User, UserPlus, AlertCircle,
  ArrowUpCircle, Truck, TrendingDown, Wallet,
} from "lucide-react"

interface Props {
  sales:        DeliverySale[]
  setSales:     Dispatch<SetStateAction<DeliverySale[]>>
  expenses:     DeliveryExpense[]
  setExpenses:  Dispatch<SetStateAction<DeliveryExpense[]>>
  clients:      DeliveryClient[]
  selectedDate: string
  onDateChange: (date: string) => void
}

export function DeliveryDayClient({
  sales, setSales,
  expenses, setExpenses,
  clients: initialClients,
  selectedDate,
  onDateChange,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [clients, setClients] = useState<DeliveryClient[]>(initialClients)

  // Totales derivados directamente del estado
  const totalSales    = sales.reduce((s, r) => s + r.total, 0)
  const totalExpenses = expenses.reduce((s, r) => s + r.total, 0)
  const netBalance    = totalSales - totalExpenses
  const isPositive    = netBalance >= 0

  // ── Ventas ──────────────────────────────────────────────────────────────────
  const [saleMode,       setSaleMode]       = useState<"fixed" | "temp" | null>(null)
  const [selectedClient, setSelectedClient] = useState("")
  const [tempName,       setTempName]       = useState("")
  const [saleTotal,      setSaleTotal]      = useState("")
  const [saleNotes,      setSaleNotes]      = useState("")
  const [saleError,      setSaleError]      = useState<string | null>(null)
  const [showNewClient,  setShowNewClient]  = useState(false)
  const [newClientName,  setNewClientName]  = useState("")
  const [clientError,    setClientError]    = useState<string | null>(null)

  // ── Gastos ──────────────────────────────────────────────────────────────────
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseName,     setExpenseName]     = useState("")
  const [expenseTotal,    setExpenseTotal]    = useState("")
  const [expenseError,    setExpenseError]    = useState<string | null>(null)

  function resetSaleForm() {
    setSaleMode(null); setSelectedClient(""); setTempName("")
    setSaleTotal(""); setSaleNotes(""); setSaleError(null)
  }

  // ── Agregar venta — optimista ───────────────────────────────────────────────
  function handleAddSale() {
    setSaleError(null)
    const amt = parseFloat(saleTotal)
    if (!amt || amt <= 0)                        { setSaleError("Ingresá un total válido."); return }
    if (saleMode === "fixed" && !selectedClient) { setSaleError("Seleccioná un cliente."); return }
    if (saleMode === "temp" && !tempName.trim()) { setSaleError("Escribí el nombre del cliente."); return }

    const clientName = saleMode === "fixed"
      ? (clients.find((c) => c.id === selectedClient)?.name ?? "Cliente")
      : tempName.trim()

    const tempId = `temp-${Date.now()}`
    const optimistic: DeliverySale = {
      id:             tempId,
      saleDate:       selectedDate,
      clientId:       saleMode === "fixed" ? selectedClient : null,
      clientTempName: saleMode === "temp"  ? tempName.trim() : null,
      clientName,
      isTemp:         saleMode === "temp",
      total:          amt,
      notes:          saleNotes.trim() || null,
      createdAt:      new Date().toISOString(),
    }

    // Capturar valores antes de resetear
    const capturedMode   = saleMode!
    const capturedClient = selectedClient
    const capturedTemp   = tempName.trim()
    const capturedNotes  = saleNotes.trim()

    setSales((prev) => [...prev, optimistic])
    resetSaleForm()

    startTransition(async () => {
      const result = await createDeliverySaleAction({
        saleDate:       selectedDate,
        clientId:       capturedMode === "fixed" ? capturedClient : undefined,
        clientTempName: capturedMode === "temp"  ? capturedTemp   : undefined,
        total:          amt,
        notes:          capturedNotes || undefined,
      })
      if (!result.success) {
        setSales((prev) => prev.filter((s) => s.id !== tempId))
        setSaleError(result.error)
      }
    })
  }

  // ── Eliminar venta — optimista ──────────────────────────────────────────────
  function handleDeleteSale(saleId: string) {
    const removed = sales.find((s) => s.id === saleId)
    setSales((prev) => prev.filter((s) => s.id !== saleId))
    startTransition(async () => {
      const result = await deleteDeliverySaleAction(saleId)
      if (!result.success && removed) {
        setSales((prev) => [...prev, removed])
      }
    })
  }

  // ── Agregar cliente ─────────────────────────────────────────────────────────
  function handleAddClient() {
    setClientError(null)
    if (!newClientName.trim()) { setClientError("Escribí un nombre."); return }
    startTransition(async () => {
      const result = await createDeliveryClientAction({ name: newClientName.trim() })
      if (!result.success) {
        setClientError(result.error)
      } else {
        setClients((prev) => [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)))
        setNewClientName(""); setShowNewClient(false)
        setSelectedClient(result.data.id); setSaleMode("fixed")
      }
    })
  }

  // ── Agregar gasto — optimista ───────────────────────────────────────────────
  function handleAddExpense() {
    setExpenseError(null)
    const amt = parseFloat(expenseTotal)
    if (!expenseName.trim()) { setExpenseError("Escribí el nombre del gasto."); return }
    if (!amt || amt <= 0)    { setExpenseError("Ingresá un monto válido."); return }

    const capturedName  = expenseName.trim()
    const capturedTotal = amt

    const tempId = `temp-${Date.now()}`
    const optimistic: DeliveryExpense = {
      id:          tempId,
      expenseDate: selectedDate,
      name:        capturedName,
      total:       capturedTotal,
      createdAt:   new Date().toISOString(),
    }

    setExpenses((prev) => [...prev, optimistic])
    setExpenseName(""); setExpenseTotal(""); setShowExpenseForm(false)

    startTransition(async () => {
      const result = await createDeliveryExpenseAction({
        expenseDate: selectedDate,
        name:        capturedName,
        total:       capturedTotal,
      })
      if (!result.success) {
        setExpenses((prev) => prev.filter((e) => e.id !== tempId))
        setExpenseError(result.error)
        setShowExpenseForm(true)
      }
    })
  }

  // ── Eliminar gasto — optimista ──────────────────────────────────────────────
  function handleDeleteExpense(expenseId: string) {
    const removed = expenses.find((e) => e.id === expenseId)
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
    startTransition(async () => {
      const result = await deleteDeliveryExpenseAction(expenseId)
      if (!result.success && removed) {
        setExpenses((prev) => [...prev, removed])
      }
    })
  }

  const saleAmt    = parseFloat(saleTotal)    || 0
  const expenseAmt = parseFloat(expenseTotal) || 0

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Ventas del día</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-amber-700 sm:text-4xl">{formatCurrency(totalSales)}</p>
                <p className="mt-1.5 text-xs text-stone-400">{sales.length} {sales.length === 1 ? "entrega" : "entregas"}</p>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <Truck className="size-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Gastos del día</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-red-600 sm:text-4xl">{formatCurrency(totalExpenses)}</p>
                <p className="mt-1.5 text-xs text-stone-400">{expenses.length} {expenses.length === 1 ? "gasto" : "gastos"}</p>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <TrendingDown className="size-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Ganancia neta</p>
                <p className={`mt-2 text-3xl font-bold tabular-nums sm:text-4xl ${isPositive ? "text-green-700" : "text-red-600"}`}>
                  {formatCurrency(netBalance)}
                </p>
                <p className="mt-1.5 text-xs text-stone-400">ventas − gastos</p>
              </div>
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${isPositive ? "bg-green-50" : "bg-red-50"}`}>
                <Wallet className={`size-5 ${isPositive ? "text-green-600" : "text-red-500"}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-stone-600">Fecha:</label>
        <input
          type="date"
          className="form-input w-auto"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      {/* Tabla de ventas */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-amber-500" />
            <span className="card-title">Entregas</span>
          </div>
          <span className="text-xs text-stone-400">{sales.length} registradas</span>
        </div>

        {sales.length === 0 ? (
          <div className="card-body">
            <p className="py-5 text-center text-sm text-stone-400">Sin entregas para esta fecha.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Cliente</th><th>Notas</th><th className="text-right">Total</th><th>Hora</th><th /></tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className={sale.id.startsWith("temp-") ? "opacity-50" : ""}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
                          sale.isTemp ? "bg-stone-100 text-stone-500" : "bg-amber-100 text-amber-700"
                        }`}>
                          {sale.isTemp ? "T" : sale.clientName.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium">{sale.clientName}</span>
                        {sale.isTemp && (
                          <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-xs text-stone-400">temporal</span>
                        )}
                      </div>
                    </td>
                    <td className="text-xs text-stone-400">{sale.notes ?? "—"}</td>
                    <td className="text-right tabular-nums font-semibold text-amber-700">{formatCurrency(sale.total)}</td>
                    <td className="tabular-nums text-xs text-stone-400">{formatDateTime(sale.createdAt)}</td>
                    <td>
                      <button
                        className="btn-ghost btn-sm p-1 text-stone-300 hover:text-red-500"
                        onClick={() => handleDeleteSale(sale.id)}
                        disabled={sale.id.startsWith("temp-")}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-stone-200 bg-amber-50/50">
                  <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-stone-700">Total ventas</td>
                  <td className="px-4 py-3 text-right tabular-nums text-lg font-bold text-amber-700">{formatCurrency(totalSales)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Tabla de gastos */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <TrendingDown className="size-4 text-red-400" />
            <span className="card-title">Gastos del reparto</span>
          </div>
          <button className="btn-secondary btn-sm" onClick={() => setShowExpenseForm(!showExpenseForm)}>
            <Plus className="size-3.5" /> Agregar gasto
          </button>
        </div>

        {showExpenseForm && (
          <div className="border-b border-stone-100 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="form-label">Nombre del gasto</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Combustible, envases..."
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="w-full sm:w-36">
                <label className="form-label">Monto</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">$</span>
                  <input
                    type="number"
                    className="form-input pl-7"
                    placeholder="0"
                    min="0"
                    value={expenseTotal}
                    onChange={(e) => setExpenseTotal(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-danger btn-sm"
                  onClick={handleAddExpense}
                  disabled={expenseAmt <= 0}
                >
                  {`Registrar · ${formatCurrency(expenseAmt)}`}
                </button>
                <button className="btn-ghost btn-sm" onClick={() => { setShowExpenseForm(false); setExpenseError(null) }}>✕</button>
              </div>
            </div>
            {expenseError && (
              <p className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="size-4 shrink-0" />{expenseError}
              </p>
            )}
          </div>
        )}

        {expenses.length === 0 ? (
          <div className="card-body">
            <p className="py-5 text-center text-sm text-stone-400">Sin gastos para esta fecha.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Concepto</th><th>Hora</th><th className="text-right">Total</th><th /></tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} className={exp.id.startsWith("temp-") ? "opacity-50" : ""}>
                    <td className="font-medium">{exp.name}</td>
                    <td className="tabular-nums text-xs text-stone-400">{formatDateTime(exp.createdAt)}</td>
                    <td className="text-right tabular-nums font-semibold text-red-600">{formatCurrency(exp.total)}</td>
                    <td>
                      <button
                        className="btn-ghost btn-sm p-1 text-stone-300 hover:text-red-500"
                        onClick={() => handleDeleteExpense(exp.id)}
                        disabled={exp.id.startsWith("temp-")}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-stone-200 bg-red-50/50">
                  <td className="px-4 py-3 text-sm font-semibold text-stone-700">Total gastos</td>
                  <td />
                  <td className="px-4 py-3 text-right tabular-nums text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Registrar entrega */}
      <div className="card">
        <div className="card-header">
          <ArrowUpCircle className="size-4 text-amber-600" />
          <span className="card-title">Registrar entrega</span>
        </div>
        <div className="card-body space-y-4">

          {!saleMode && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-stone-200 p-4 transition-all hover:border-amber-400 hover:bg-amber-50"
                onClick={() => setSaleMode("fixed")}
              >
                <User className="size-6 text-amber-600" />
                <span className="text-sm font-medium text-stone-700">Cliente fijo</span>
                <span className="text-xs text-stone-400">Seleccionar de la lista</span>
              </button>
              <button
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-stone-200 p-4 transition-all hover:border-stone-400 hover:bg-stone-50"
                onClick={() => setSaleMode("temp")}
              >
                <UserPlus className="size-6 text-stone-500" />
                <span className="text-sm font-medium text-stone-700">Cliente temporal</span>
                <span className="text-xs text-stone-400">Sin guardar en lista</span>
              </button>
            </div>
          )}

          {saleMode === "fixed" && (
            <div className="space-y-3">
              <div>
                <label className="form-label">Cliente</label>
                <div className="flex gap-2">
                  <select
                    className="form-select flex-1"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button className="btn-secondary btn-sm whitespace-nowrap" onClick={() => setShowNewClient(!showNewClient)}>
                    <Plus className="size-3.5" /> Nuevo
                  </button>
                </div>
              </div>
              {showNewClient && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-700">Agregar cliente fijo</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="form-input flex-1"
                      placeholder="Nombre del cliente"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddClient()}
                      autoFocus
                    />
                    <button className="btn-primary btn-sm" onClick={handleAddClient} disabled={isPending}>Agregar</button>
                    <button className="btn-ghost btn-sm" onClick={() => setShowNewClient(false)}>✕</button>
                  </div>
                  {clientError && <p className="text-xs text-red-600">{clientError}</p>}
                </div>
              )}
            </div>
          )}

          {saleMode === "temp" && (
            <div>
              <label className="form-label">Nombre del cliente temporal</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Almacén Don Pedro"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {saleMode && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="form-label">Total de la entrega</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">$</span>
                    <input
                      type="number"
                      className="form-input pl-7"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      value={saleTotal}
                      onChange={(e) => setSaleTotal(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Notas <span className="font-normal text-stone-400">(opcional)</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: 10 panes, 2 facturas..."
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                  />
                </div>
              </div>

              {saleAmt > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 p-3">
                  <span className="text-sm text-stone-600">Total a registrar</span>
                  <span className="tabular-nums text-xl font-bold text-amber-700">{formatCurrency(saleAmt)}</span>
                </div>
              )}

              {saleError && (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="size-4 shrink-0" />{saleError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  className="btn-primary flex-1"
                  onClick={handleAddSale}
                  disabled={saleAmt <= 0}
                >
                  {`Registrar entrega · ${formatCurrency(saleAmt)}`}
                </button>
                <button className="btn-secondary" onClick={resetSaleForm}>Cancelar</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
