import {
  getOpenShiftAction,
  getShiftsAction,
} from "@/src/actions/shift.actions";
import { ShiftControls } from "@/src/components/shifts/ShiftControls";
import { ShiftHistory } from "@/src/components/shifts/ShiftHistory";
import { Clock } from "lucide-react";

/**
 * Next.js 15: esta página NO tiene parámetros dinámicos ([slug], etc.)
 * por lo que no necesita await en props. Solo aplica a rutas dinámicas.
 */
export default async function TurnosPage() {
  const [openResult, historyResult] = await Promise.all([
    getOpenShiftAction(),
    getShiftsAction(20),
  ]);

  const openShift = openResult.success ? openResult.data : null;
  const shifts = historyResult.success ? historyResult.data : [];

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Clock className="size-5 text-stone-400" />
          <div>
            <h1 className="page-title">Turnos</h1>
            <p className="page-subtitle">
              Control manual de apertura y cierre de caja
            </p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <ShiftControls openShift={openShift} />
        <ShiftHistory shifts={shifts} />
      </div>
    </div>
  );
}
