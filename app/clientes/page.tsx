export const dynamic = "force-dynamic"

import { getAllDeliveryClientsAction } from "@/src/actions/client.actions"
import { ClientesClient }             from "@/src/components/clientes/ClientesClient"
import { Users2 }                     from "lucide-react"

export default async function ClientesPage() {
  const result  = await getAllDeliveryClientsAction()
  const clients = result.success ? result.data : []

  const active = clients.filter((c) => c.active).length

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Users2 className="size-5 text-stone-400" />
          <div>
            <h1 className="page-title">Clientes</h1>
            <p className="page-subtitle">
              {active} activos · {clients.length - active} inactivos
            </p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <ClientesClient initialClients={clients} />
      </div>
    </div>
  )
}
