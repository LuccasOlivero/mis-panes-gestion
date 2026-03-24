export const dynamic = "force-dynamic"

import { getDeliveryOrdersAction } from "@/src/actions/delivery.actions"
import { DeliveryOrdersClient } from "@/src/components/reparto/DeliveryOrdersClient"
import { PackageSearch } from "lucide-react"

export default async function PedidosPage() {
  const result    = await getDeliveryOrdersAction()
  const pending   = result.success ? result.data.pending   : []
  const completed = result.success ? result.data.completed : []

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <PackageSearch className="size-5 text-stone-400" />
          <div>
            <h1 className="page-title">Pedidos</h1>
            <p className="page-subtitle">
              {pending.length} pendientes · {completed.length} completados
            </p>
          </div>
        </div>
      </div>
      <div className="page-content">
        <DeliveryOrdersClient pending={pending} completed={completed} />
      </div>
    </div>
  )
}
