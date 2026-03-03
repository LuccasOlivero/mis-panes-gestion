import { notFound } from "next/navigation";
import Link from "next/link";
import { getEmployeeAction } from "@/src/actions/employee.actions";
import { EmployeeForm } from "@/src/components/empleados/EmployeeForm";
import { ArrowLeft } from "lucide-react";

// Next.js 15: params es una Promise en rutas dinámicas
export default async function EditarEmpleadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEmployeeAction(id);

  if (!result.success) notFound();
  const employee = result.data;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href={`/empleados/${id}`} className="btn-ghost btn-sm p-1.5">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="page-title">Editar — {employee.fullName}</h1>
            <p className="page-subtitle">Modificar datos del empleado</p>
          </div>
        </div>
      </div>
      <div className="page-content max-w-2xl">
        <EmployeeForm employee={employee} />
      </div>
    </div>
  );
}
