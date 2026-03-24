export const dynamic = "force-dynamic"

import { format } from "date-fns"
import {
  getDailyDeliverySummaryAction,
  getDeliveryClientsAction,
  getDeliveryNotesAction,
} from "@/src/actions/delivery.actions"
import { DeliveryPageClient } from "@/src/components/reparto/DeliveryPageClient"
import { Truck } from "lucide-react"

export default async function RepartoPage() {
  const today = format(new Date(), "yyyy-MM-dd")

  const [summaryRes, clientsRes, notesRes] = await Promise.all([
    getDailyDeliverySummaryAction(today),
    getDeliveryClientsAction(),
    getDeliveryNotesAction(),
  ])

  const summary = summaryRes.success ? summaryRes.data : {
    date:          today,
    totalSales:    0,
    totalExpenses: 0,
    netBalance:    0,
    salesCount:    0,
    sales:         [],
    expenses:      [],
  }

  const clients = clientsRes.success ? clientsRes.data : []
  const notes   = notesRes.success   ? notesRes.data   : []

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Truck className="size-5 text-stone-400" />
          <div>
            <h1 className="page-title">Reparto diario</h1>
            <p className="page-subtitle">Ventas y entregas del día</p>
          </div>
        </div>
      </div>
      <div className="page-content">
        <DeliveryPageClient
          initialSummary={summary}
          initialDate={today}
          clients={clients}
          notes={notes}
        />
      </div>
    </div>
  )
}
