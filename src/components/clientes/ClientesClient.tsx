"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import {
  getClientHistoryAction,
  updateDeliveryClientNameAction,
  deactivateDeliveryClientAction,
  reactivateDeliveryClientAction,
} from "@/src/actions/client.actions"
import { createDeliveryClientAction } from "@/src/actions/delivery.actions"
import type { DeliveryClient } from "@/src/types/delivery.types"
import type { ClientHistory } from "@/src/actions/client.actions"
import {
  Search, Plus, Pencil, UserX, UserCheck, CheckCircle2,
  AlertCircle, X, Package, TrendingUp, Calendar, ShoppingBag,
} from "lucide-react"

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })
}

// ─── Combobox de clientes ─────────────────────────────────────────────────────

interface ComboBoxProps {
  clients:          DeliveryClient[]
  selectedId:       string | null
  onSelect:         (id: string) => void
  onClientCreated:  (client: DeliveryClient) => void
}

function ClientComboBox({ clients, selectedId, onSelect, onClientCreated }: ComboBoxProps) {
  const [isPending, startTransition] = useTransition()
  const [query,     setQuery]        = useState("")
  const [open,      setOpen]         = useState(false)
  const [newName,   setNewName]      = useState("")
  const [showNew,   setShowNew]      = useState(false)
  const [error,     setError]        = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const selected  = clients.find((c) => c.id === selectedId)
  const activos   = clients.filter((c) => c.active)
  const filtered  = activos.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  )

  // Cerrar al click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleSelect(client: DeliveryClient) {
    onSelect(client.id)
    setQuery("")
    setOpen(false)
    setShowNew(false)
  }

  function handleCreate() {
    setError(null)
    if (!newName.trim()) { setError("Escribí un nombre."); return }
    startTransition(async () => {
      const result = await createDeliveryClientAction({ name: newName.trim() })
      if (!result.success) {
        setError(result.error)
      } else {
        onClientCreated(result.data)
        handleSelect(result.data)
        setNewName("")
        setShowNew(false)
      }
    })
  }

  return (
    <div ref={ref} className="relative">
      <label className="form-label">Seleccionar cliente</label>

      {/* Input trigger */}
      <div
        className="form-input flex cursor-pointer items-center justify-between gap-2"
        onClick={() => setOpen(!open)}
      >
        {selected ? (
          <span className="font-medium text-stone-900">{selected.name}</span>
        ) : (
          <span className="text-stone-400">Buscar cliente...</span>
        )}
        <Search className="size-4 shrink-0 text-stone-400" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-stone-200 bg-white shadow-xl">
          {/* Búsqueda */}
          <div className="border-b border-stone-100 p-2">
            <input
              type="text"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
              placeholder="Escribí para buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Lista */}
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && !showNew && (
              <p className="px-3 py-4 text-center text-sm text-stone-400">
                No hay clientes que coincidan.
              </p>
            )}
            {filtered.map((client) => (
              <button
                key={client.id}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-amber-50 ${
                  client.id === selectedId ? "bg-amber-50 font-semibold text-amber-700" : "text-stone-700"
                }`}
                onClick={() => handleSelect(client)}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                  {client.name.charAt(0).toUpperCase()}
                </span>
                {client.name}
              </button>
            ))}
          </div>

          {/* Agregar nuevo */}
          <div className="border-t border-stone-100 p-2">
            {!showNew ? (
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                onClick={() => setShowNew(true)}
              >
                <Plus className="size-4" /> Agregar nuevo cliente
              </button>
            ) : (
              <div className="space-y-2 p-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="form-input flex-1 text-sm"
                    placeholder="Nombre del cliente"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    autoFocus
                  />
                  <button className="btn-primary btn-sm" onClick={handleCreate} disabled={isPending}>
                    {isPending ? "..." : "Crear"}
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => { setShowNew(false); setNewName("") }}>
                    <X className="size-3.5" />
                  </button>
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Panel de detalle del cliente ────────────────────────────────────────────

interface ClientDetailProps {
  history:         ClientHistory
  onNameUpdated:   (id: string, name: string) => void
  onDeactivated:   (id: string) => void
  onReactivated:   (id: string) => void
}

function ClientDetail({ history, onNameUpdated, onDeactivated, onReactivated }: ClientDetailProps) {
  const [isPending, startTransition] = useTransition()
  const { client, sales, totalAmount, totalOrders, lastSaleDate } = history

  // Editar nombre
  const [editMode,  setEditMode]  = useState(false)
  const [editName,  setEditName]  = useState(client.name)
  const [editError, setEditError] = useState<string | null>(null)
  const [editOk,    setEditOk]    = useState(false)

  // Confirmación desactivar
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  function handleSaveName() {
    setEditError(null)
    if (!editName.trim()) { setEditError("El nombre no puede estar vacío."); return }
    startTransition(async () => {
      const result = await updateDeliveryClientNameAction(client.id, editName.trim())
      if (!result.success) {
        setEditError(result.error)
      } else {
        setEditOk(true)
        onNameUpdated(client.id, editName.trim())
        setTimeout(() => { setEditOk(false); setEditMode(false) }, 800)
      }
    })
  }

  function handleDeactivate() {
    startTransition(async () => {
      const result = await deactivateDeliveryClientAction(client.id)
      if (result.success) {
        onDeactivated(client.id)
        setConfirmDeactivate(false)
      }
    })
  }

  function handleReactivate() {
    startTransition(async () => {
      const result = await reactivateDeliveryClientAction(client.id)
      if (result.success) onReactivated(client.id)
    })
  }

  return (
    <div className="space-y-4">

      {/* Header del cliente */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl font-bold text-amber-700">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                {!editMode ? (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-stone-900">{client.name}</h2>
                    {!client.active && (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">Inactivo</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="form-input text-lg font-semibold"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      autoFocus
                    />
                    <button
                      className="btn-primary btn-sm"
                      onClick={handleSaveName}
                      disabled={isPending}
                    >
                      {editOk ? <CheckCircle2 className="size-4" /> : "Guardar"}
                    </button>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => { setEditMode(false); setEditName(client.name); setEditError(null) }}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
                {editError && <p className="mt-1 text-xs text-red-600">{editError}</p>}
                <p className="text-sm text-stone-400">Cliente fijo de reparto</p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              {!editMode && (
                <button
                  className="btn-secondary btn-sm flex items-center gap-1.5"
                  onClick={() => { setEditMode(true); setEditName(client.name) }}
                >
                  <Pencil className="size-3.5" /> Editar nombre
                </button>
              )}
              {client.active ? (
                <button
                  className="btn-ghost btn-sm flex items-center gap-1.5 text-red-500 hover:bg-red-50"
                  onClick={() => setConfirmDeactivate(true)}
                >
                  <UserX className="size-3.5" /> Desactivar
                </button>
              ) : (
                <button
                  className="btn-ghost btn-sm flex items-center gap-1.5 text-green-600 hover:bg-green-50"
                  onClick={handleReactivate}
                  disabled={isPending}
                >
                  <UserCheck className="size-3.5" /> Reactivar
                </button>
              )}
            </div>
          </div>

          {/* Confirmación desactivar */}
          {confirmDeactivate && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  ¿Desactivar a {client.name}?
                </p>
                <p className="text-xs text-red-600">
                  No aparecerá más en la lista del reparto. Su historial de ventas se mantiene.
                </p>
                <div className="mt-3 flex gap-2">
                  <button className="btn-danger btn-sm" onClick={handleDeactivate} disabled={isPending}>
                    {isPending ? "Desactivando..." : "Sí, desactivar"}
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => setConfirmDeactivate(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-amber-500" />
            <span className="stat-label">Total acumulado</span>
          </div>
          <span className="stat-value text-amber-700">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-sky-500" />
            <span className="stat-label">Entregas totales</span>
          </div>
          <span className="stat-value text-sky-700">{totalOrders}</span>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-stone-400" />
            <span className="stat-label">Última entrega</span>
          </div>
          <span className="text-lg font-bold text-stone-700">
            {lastSaleDate ? formatDate(lastSaleDate) : "—"}
          </span>
        </div>
      </div>

      {/* Historial de ventas */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-stone-400" />
            <span className="card-title">Historial de entregas</span>
          </div>
          <span className="text-xs text-stone-400">{totalOrders} registros</span>
        </div>

        {sales.length === 0 ? (
          <div className="card-body">
            <p className="py-8 text-center text-sm text-stone-400">Sin entregas registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Notas</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="text-sm text-stone-600 tabular-nums">
                      {formatDate(sale.saleDate)}
                    </td>
                    <td className="text-sm text-stone-400">
                      {sale.notes ?? "—"}
                    </td>
                    <td className="text-right tabular-nums font-semibold text-amber-700">
                      {formatCurrency(sale.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-stone-200 bg-amber-50/50">
                  <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-stone-700">
                    Total acumulado
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-lg font-bold text-amber-700">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

interface Props {
  initialClients: DeliveryClient[]
}

export function ClientesClient({ initialClients }: Props) {
  const [isPending, startTransition] = useTransition()
  const [clients,   setClients]      = useState<DeliveryClient[]>(initialClients)
  const [selectedId, setSelectedId]  = useState<string | null>(null)
  const [history,    setHistory]     = useState<ClientHistory | null>(null)
  const [loadError,  setLoadError]   = useState<string | null>(null)

  function handleSelect(id: string) {
    setSelectedId(id)
    setLoadError(null)
    startTransition(async () => {
      const result = await getClientHistoryAction(id)
      if (result.success) {
        setHistory(result.data)
      } else {
        setLoadError(result.error)
        setHistory(null)
      }
    })
  }

  function handleClientCreated(client: DeliveryClient) {
    setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)))
  }

  function handleNameUpdated(id: string, name: string) {
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, name } : c))
    setHistory((prev) => prev ? { ...prev, client: { ...prev.client, name } } : null)
  }

  function handleDeactivated(id: string) {
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, active: false } : c))
    setHistory((prev) => prev ? { ...prev, client: { ...prev.client, active: false } } : null)
  }

  function handleReactivated(id: string) {
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, active: true } : c))
    setHistory((prev) => prev ? { ...prev, client: { ...prev.client, active: true } } : null)
  }

  const activeCount   = clients.filter((c) => c.active).length
  const inactiveCount = clients.filter((c) => !c.active).length

  return (
    <div className="space-y-6">

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <div className="stat-card">
          <span className="stat-label">Clientes activos</span>
          <span className="stat-value text-amber-700">{activeCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Clientes inactivos</span>
          <span className="stat-value text-stone-400">{inactiveCount}</span>
        </div>
      </div>

      {/* Selector */}
      <div className="card">
        <div className="card-body">
          <ClientComboBox
            clients={clients}
            selectedId={selectedId}
            onSelect={handleSelect}
            onClientCreated={handleClientCreated}
          />
          {isPending && (
            <p className="mt-2 text-xs text-stone-400">Cargando historial...</p>
          )}
          {loadError && (
            <p className="mt-2 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="size-4 shrink-0" />{loadError}
            </p>
          )}
        </div>
      </div>

      {/* Detalle del cliente seleccionado */}
      {history && !isPending && (
        <ClientDetail
          history={history}
          onNameUpdated={handleNameUpdated}
          onDeactivated={handleDeactivated}
          onReactivated={handleReactivated}
        />
      )}

      {!selectedId && !isPending && (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center">
          <Search className="mx-auto mb-3 size-10 text-stone-200" />
          <p className="text-sm font-medium text-stone-400">
            Seleccioná un cliente para ver su historial
          </p>
        </div>
      )}
    </div>
  )
}
