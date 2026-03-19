import { getUrgentOrdersAction } from "@/src/actions/delivery.actions"
import { AlertTriangle } from "lucide-react"

export async function OrdersUrgentBanner() {
  const result = await getUrgentOrdersAction()
  if (!result.success || result.data.length === 0) return null

  const orders = result.data

  return (
    <div className="border-b border-orange-200 bg-orange-50 px-4 py-2">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5 text-orange-700">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wide">Pedidos urgentes</span>
        </div>
        {orders.map((order) => (
          <span key={order.id} className="text-xs text-orange-700">
            {order.daysLeft === 0
              ? `¡Hoy! — ${order.clientName}`
              : order.daysLeft === 1
              ? `Mañana — ${order.clientName}`
              : `${order.daysLeft} días — ${order.clientName}`}
          </span>
        ))}
      </div>
    </div>
  )
}
