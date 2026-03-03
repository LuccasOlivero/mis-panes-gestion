import { getOpenShiftAction } from "@/src/actions/shift.actions"
import { shiftTypeLabel } from "@/src/modules/shifts/domain/shift.entity"
import { formatTime } from "@/src/lib/utils/dates"
import { Circle } from "lucide-react"

/**
 * Server Component asíncrono.
 * Se renderiza en servidor con datos frescos en cada request.
 * No tiene params ni searchParams — no aplica el cambio de Next.js 15.
 */
export async function ShiftStatusBadge() {
  const result = await getOpenShiftAction()
  const shift = result.success ? result.data : null

  if (!shift) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-stone-50 px-2 py-1.5">
        <Circle className="size-2.5 fill-stone-300 text-stone-300" />
        <span className="text-xs text-stone-400">Sin turno activo</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-green-50 px-2 py-1.5">
      <Circle className="size-2.5 animate-pulse fill-green-500 text-green-500" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-green-700">
          {shiftTypeLabel(shift.shiftType)}
        </p>
        <p className="truncate text-xs text-green-600">
          {shift.managerName} · desde {formatTime(shift.startedAt)}
        </p>
      </div>
    </div>
  )
}
