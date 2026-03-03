import Link from "next/link";
import { EmployeeForm } from "@/src/components/empleados/EmployeeForm";
import { ArrowLeft } from "lucide-react";

export default function NuevoEmpleadoPage() {
  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/empleados" className="btn-ghost btn-sm p-1.5">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="page-title">Nuevo empleado</h1>
            <p className="page-subtitle">Registrar un empleado en el sistema</p>
          </div>
        </div>
      </div>
      <div className="page-content max-w-2xl">
        <EmployeeForm />
      </div>
    </div>
  );
}
