import { notFound } from "next/navigation";
import Link from "next/link";
import { getEmployeeAction } from "@/src/actions/employee.actions";
import { AdvanceForm } from "@/src/components/empleados/AdvanceForm";
import { ArrowLeft } from "lucide-react";

export default async function AdelantoPage({
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
            <h1 className="page-title">Adelanto — {result.data.fullName}</h1>
            <p className="page-subtitle">Registrar adelanto de sueldo</p>
          </div>
        </div>
      </div>
      <div className="page-content max-w-xl">
        <AdvanceForm
          employeeId={id}
          employeeName={result.data.fullName}
          baseSalary={result.data.baseSalary}
        />
      </div>
    </div>
  );
}
