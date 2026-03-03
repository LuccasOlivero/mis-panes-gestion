import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getEmployeeAction,
  getTodayShiftAction,
} from "@/src/actions/employee.actions";
import { FichajeForm } from "@/src/components/empleados/FichajeForm";
import { ArrowLeft } from "lucide-react";

export default async function FichajePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [empResult, shiftResult] = await Promise.all([
    getEmployeeAction(id),
    getTodayShiftAction(id),
  ]);

  if (!empResult.success) notFound();

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href={`/empleados/${id}`} className="btn-ghost btn-sm p-1.5">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="page-title">Fichaje — {empResult.data.fullName}</h1>
            <p className="page-subtitle">Registrar entrada o salida</p>
          </div>
        </div>
      </div>
      <div className="page-content max-w-xl">
        <FichajeForm
          employeeId={id}
          employeeName={empResult.data.fullName}
          todayShift={shiftResult.success ? shiftResult.data : null}
        />
      </div>
    </div>
  );
}
