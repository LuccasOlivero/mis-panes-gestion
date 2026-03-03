import { notFound } from "next/navigation";
import Link from "next/link";
import { SanctionForm } from "@/src/components/empleados/SanctionForm";
import { ArrowLeft } from "lucide-react";
import { getEmployeeAction } from "@/src/actions/employee.actions";

export default async function SancionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEmployeeAction(id);
  if (!result.success) notFound();

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href={`/empleados/${id}`} className="btn-ghost btn-sm p-1.5">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="page-title">Sanción — {result.data.fullName}</h1>
            <p className="page-subtitle">
              Registrar sanción o llamado de atención
            </p>
          </div>
        </div>
      </div>
      <div className="page-content max-w-xl">
        <SanctionForm employeeId={id} employeeName={result.data.fullName} />
      </div>
    </div>
  );
}
