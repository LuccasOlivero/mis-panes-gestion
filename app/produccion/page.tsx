export const dynamic = "force-dynamic"

import { format } from "date-fns"
import {
  getProductionRecordAction,
  getWeekProductionAction,
  getActiveEmployeeNamesAction,
} from "@/src/actions/production.actions"
import { getWeekRange } from "@/src/lib/utils/production.utils"
import { ProductionForm }      from "@/src/components/produccion/ProductionForm"
import { ProductionWeekTable } from "@/src/components/produccion/ProductionWeekTable"
import { ChefHat } from "lucide-react"

export default async function ProduccionPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>
}) {
  const { fecha } = await searchParams
  const today      = format(new Date(), "yyyy-MM-dd")
  const targetDate = fecha ?? today

  const currentWeek = getWeekRange(today)

  const [recordRes, weekRecordsRes, employeesRes] = await Promise.all([
    getProductionRecordAction(targetDate),
    getWeekProductionAction(currentWeek.from, currentWeek.to),
    getActiveEmployeeNamesAction(),
  ])

  const existingRecord  = recordRes.success      ? recordRes.data      : null
  const weekRecords     = weekRecordsRes.success  ? weekRecordsRes.data : []
  const employeeNames   = employeesRes.success    ? employeesRes.data   : []

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <ChefHat className="size-5 text-stone-400" />
          <div>
            <h1 className="page-title">Producción</h1>
            <p className="page-subtitle">Registro diario de latas por tipo de pan</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <ProductionForm
          existingRecord={existingRecord}
          initialDate={targetDate}
          employeeNames={employeeNames}
        />
        <ProductionWeekTable
          initialRecords={weekRecords}
          initialWeek={currentWeek}
          today={today}
        />
      </div>
    </div>
  )
}
