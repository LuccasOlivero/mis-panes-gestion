import { getDashboardDataAction } from "@/src/actions/dashboard.actions"
import { DashboardClient }        from "@/src/components/dashboard/DashboardClient"
import { LayoutDashboard }        from "lucide-react"

export default async function DashboardPage() {
  const result = await getDashboardDataAction("month")

  // Fallback vacío si falla el fetch
  const data = result.success ? result.data : {
    period:          "month" as const,
    dateRange:       { from: "", to: "" },
    kpis:            { totalSales: 0, shiftSales: 0, deliverySales: 0, totalExpenses: 0, shiftExpenses: 0, deliveryExpenses: 0, netBalance: 0 },
    salesBySource:   [],
    salesByShiftType:[],
    expensesBySource:[],
    shifts:          [],
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="size-5 text-stone-400" />
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Resumen del negocio</p>
          </div>
        </div>
      </div>
      <div className="page-content">
        <DashboardClient initialData={data} />
      </div>
    </div>
  )
}
