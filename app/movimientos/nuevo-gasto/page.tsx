import { redirect } from "next/navigation";
import Link from "next/link";
import { getOpenShiftAction } from "@/src/actions/shift.actions";
import { NuevoGastoForm } from "@/src/components/movimientos/NuevoGastoForm";
import { ArrowLeft } from "lucide-react";

export default async function NuevoGastoPage() {
  const shiftResult = await getOpenShiftAction();
  const openShift = shiftResult.success ? shiftResult.data : null;

  if (!openShift) redirect("/movimientos");

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/movimientos" className="btn-ghost btn-sm p-1.5">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="page-title">Nuevo gasto</h1>
            <p className="page-subtitle">
              Turno activo: {openShift.managerName}
            </p>
          </div>
        </div>
      </div>
      <div className="page-content max-w-2xl">
        <NuevoGastoForm />
      </div>
    </div>
  );
}
