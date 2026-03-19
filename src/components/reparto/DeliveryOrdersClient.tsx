"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  createDeliveryOrderAction,
  deleteDeliveryOrderAction,
  markOrderDeliveredAction,
} from "@/src/actions/delivery.actions"
import type { DeliveryOrder } from "@/src/types/delivery.types"
import { formatDate } from "@/src/lib/utils/dates"
import { format } from "date-fns"
import {
  Plus, Trash2, AlertCircle, CheckCircle2,
  Clock, PackageCheck, ChevronDown, ChevronRight,
  PackageSearch, Loader2,
} from "lucide-react"

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(n)
}

function DaysLeftBadge({ daysLeft }: { daysLeft: number }) {
  if (daysLeft < 0)  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Vencido</span>
  if (daysLeft === 0) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 animate-pulse">¡Hoy!</span>
  if (daysLeft === 1) return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">Mañana</span>
  if (daysLeft === 2) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">2 días</span>
  return <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">{daysLeft} días</span>
}

// ─── Dialog de confirmación ──────────────────────────────────────────────────
interface ConfirmDialogProps {
  order:     DeliveryOrder
  onConfirm: () => void
  onCancel:  () => void
  isPending: boolean
}

function ConfirmDeliverDialog({ order, onConfirm, onCancel, isPending }: ConfirmDialogProps) {
  const hasAmount = order.saleAmount > 0
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white shadow-xl">
        <div className="border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100">
              <PackageCheck className="size-5 text-amber-700" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">Confirmar entrega</p>
              <p className="text-xs text-stone-400">Se registrará como venta en reparto del día de hoy</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3">
          <div className="rounded-xl border border-stone-100 bg-stone-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">Cliente</span>
              <span className="font-medium text-stone-800">{order.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Pedido</span>
              <span className="font-medium text-stone-800 text-right max-w-[60%] truncate">{order.description}</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2">
              <span className="text-stone-500">Total a registrar</span>
              <span className={`text-lg font-bold tabular-nums ${hasAmount ? "text-amber-700" : "text-red-500"}`}>
                {formatCurrency(order.saleAmount)}
              </span>
            </div>
          </div>

          {!hasAmount && (
            <div className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>Este pedido no tiene total cargado. Se registrará una venta de <strong>$0</strong>. ¿Querés continuar igual?</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-stone-100 px-6 py-4">
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending
              ? <><Loader2 className="size-4 animate-spin" /> Registrando...</>
              : <><CheckCircle2 className="size-4" /> Confirmar entrega</>
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

// ─── Componente principal ────────────────────────────────────────────────────

interface Props {
  pending:   DeliveryOrder[]
  completed: DeliveryOrder[]
}

export function DeliveryOrdersClient({ pending: initialPending, completed: initialCompleted }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm,    setShowForm]    = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // Formulario nuevo pedido
  const [clientName,   setClientName]   = useState("")
  const [description,  setDescription]  = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [saleAmount,   setSaleAmount]   = useState("")

  // Confirmación de entrega
  const [confirmOrder, setConfirmOrder] = useState<DeliveryOrder | null>(null)
  const [delivering,   setDelivering]   = useState(false)

  function handleCreate() {
    setError(null)
    if (!clientName.trim())  { setError("El nombre del cliente es obligatorio."); return }
    if (!description.trim()) { setError("Escribí la descripción del pedido."); return }
    if (!deliveryDate)       { setError("Seleccioná una fecha de entrega."); return }

    startTransition(async () => {
      const result = await createDeliveryOrderAction({
        clientName:   clientName.trim(),
        description:  description.trim(),
        deliveryDate,
        saleAmount:   parseFloat(saleAmount) || 0,
      })
      if (!result.success) {
        setError(result.error)
      } else {
        setClientName(""); setDescription(""); setDeliveryDate(""); setSaleAmount("")
        setShowForm(false)
        router.refresh()
      }
    })
  }

  function handleDelete(orderId: string) {
    startTransition(async () => {
      await deleteDeliveryOrderAction(orderId)
      router.refresh()
    })
  }

  function handleDeliverClick(order: DeliveryOrder) {
    setConfirmOrder(order)
  }

  function handleConfirmDeliver() {
    if (!confirmOrder) return
    setDelivering(true)
    startTransition(async () => {
      const result = await markOrderDeliveredAction(confirmOrder.id)
      setDelivering(false)
      setConfirmOrder(null)
      if (!result.success) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const saleAmt = parseFloat(saleAmount) || 0

  return (
    <>
      {/* Confirmation dialog — rendered outside the card so it overlays everything */}
      {confirmOrder && (
        <ConfirmDeliverDialog
          order={confirmOrder}
          onConfirm={handleConfirmDeliver}
          onCancel={() => setConfirmOrder(null)}
          isPending={delivering}
        />
      )}

      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Pedidos</h2>
            <p className="text-sm text-stone-400">{initialPending.length} pendientes</p>
          </div>
          <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-3.5" />
            Nuevo pedido
          </button>
        </div>

        {/* Formulario nuevo pedido */}
        {showForm && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Nuevo pedido</span>
            </div>
            <div className="card-body space-y-4">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Cliente</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nombre del cliente"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="form-label">Fecha de entrega</label>
                  <input
                    type="date"
                    className="form-input"
                    value={deliveryDate}
                    min={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Descripción del pedido</label>
                <textarea
                  className="form-input resize-none"
                  rows={3}
                  placeholder="Ej: 50 medialunas de grasa, 20 facturas variadas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">
                  Total de la venta{" "}
                  <span className="font-normal text-stone-400">
                    (se registrará en reparto al marcar como entregado)
                  </span>
                </label>
                <div className="relative max-w-xs">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">$</span>
                  <input
                    type="number"
                    className="form-input pl-7"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                  />
                </div>
                {saleAmt > 0 && (
                  <p className="mt-1 text-xs text-stone-400">
                    Al entregar se sumará{" "}
                    <span className="font-semibold text-amber-700">{formatCurrency(saleAmt)}</span>{" "}
                    al reparto del día de entrega
                  </p>
                )}
              </div>

              {error && (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="size-4 shrink-0" />{error}
                </p>
              )}

              <div className="flex gap-3">
                <button className="btn-primary flex-1" onClick={handleCreate} disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar pedido"}
                </button>
                <button className="btn-secondary" onClick={() => { setShowForm(false); setError(null) }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de pedidos pendientes */}
        {initialPending.length === 0 ? (
          <div className="card">
            <div className="card-body">
              <div className="flex flex-col items-center gap-3 py-10">
                <PackageSearch className="size-10 text-stone-200" />
                <p className="text-sm text-stone-400">No hay pedidos pendientes.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {initialPending.map((order) => (
              <div
                key={order.id}
                className={`card border-l-4 ${
                  order.daysLeft <= 0  ? "border-l-red-500"
                  : order.daysLeft <= 1 ? "border-l-orange-500"
                  : order.daysLeft <= 2 ? "border-l-amber-500"
                  :                       "border-l-stone-200"
                }`}
              >
                <div className="card-body">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-stone-900">{order.clientName}</span>
                        <DaysLeftBadge daysLeft={order.daysLeft} />
                      </div>
                      <p className="mt-1 text-sm text-stone-600">{order.description}</p>
                      <div className="mt-2 flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs text-stone-400">
                          <Clock className="size-3" />
                          Entrega: {formatDate(order.deliveryDate)}
                        </span>
                        {order.saleAmount > 0 && (
                          <span className="text-xs font-semibold tabular-nums text-amber-700">
                            Venta: {formatCurrency(order.saleAmount)}
                          </span>
                        )}
                        {order.saleAmount === 0 && (
                          <span className="text-xs text-stone-400 italic">Sin total cargado</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botón entregar */}
                      <button
                        className="btn-primary btn-sm flex items-center gap-1.5"
                        onClick={() => handleDeliverClick(order)}
                        disabled={isPending}
                        title="Marcar como entregado y registrar venta"
                      >
                        <CheckCircle2 className="size-3.5" />
                        Entregar
                      </button>
                      {/* Botón eliminar */}
                      <button
                        className="p-1.5 text-stone-300 hover:text-red-500 transition-colors"
                        onClick={() => handleDelete(order.id)}
                        disabled={isPending}
                        title="Eliminar pedido"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Historial de completados */}
        {initialCompleted.length > 0 && (
          <div>
            <button
              className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              <PackageCheck className="size-4" />
              Historial de completados ({initialCompleted.length})
            </button>

            {showHistory && (
              <div className="mt-3 space-y-2">
                {initialCompleted.map((order) => (
                  <div key={order.id} className="card opacity-60">
                    <div className="card-body py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <CheckCircle2 className="size-4 text-green-500" />
                            <span className="font-medium text-stone-700">{order.clientName}</span>
                            {order.saleCreated && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                venta registrada
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-stone-500">{order.description}</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-stone-400 flex-wrap">
                            <span>Entrega: {formatDate(order.deliveryDate)}</span>
                            {order.saleAmount > 0 && (
                              <span className="tabular-nums font-medium text-amber-700">
                                {formatCurrency(order.saleAmount)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="p-1 text-stone-300 hover:text-red-500 transition-colors"
                          onClick={() => handleDelete(order.id)}
                          disabled={isPending}
                          title="Eliminar del historial"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
