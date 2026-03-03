import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { EmployeeProfile } from "@/src/components/empleados/EmployeeProfile";
import { ArrowLeft } from "lucide-react";
import { getEmployeeProfileAction } from "@/src/actions/employee.actions";

export default async function EmpleadoPerfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { id } = await params;
  const { mes } = await searchParams;

  // Por defecto: mes actual
  const month = mes ?? format(new Date(), "yyyy-MM");

  const result = await getEmployeeProfileAction(id, month);
  if (!result.success) notFound();

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/empleados" className="btn-ghost btn-sm p-1.5">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="page-title">{result.data.employee.fullName}</h1>
            <p className="page-subtitle">Perfil del empleado</p>
          </div>
        </div>
      </div>
      <div className="page-content">
        <EmployeeProfile
          profile={result.data}
          currentMonth={month}
          employeeId={id}
        />
      </div>
    </div>
  );
}
