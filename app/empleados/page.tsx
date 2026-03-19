import Link from "next/link";
import { getEmployeesAction } from "@/src/actions/employee.actions";
import { Users, Plus } from "lucide-react";
import { getTodayShiftsAllAction } from "@/src/actions/employee-shift.actions";
import { EmployeeListClient } from "@/src/components/empleados/EmployeeListClient";

export default async function EmpleadosPage() {
  const result = await getEmployeesAction();
  const employees = result.success ? result.data : [];

  // Traer fichajes de hoy para todos los empleados en una sola query
  const ids = employees.map((e) => e.id);
  const shiftsRes = await getTodayShiftsAllAction(ids);
  const todayShifts = shiftsRes.success ? shiftsRes.data : {};

  const activos = employees.filter((e) => e.active).length;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="size-5 text-stone-400" />
            <div>
              <h1 className="page-title">Empleados</h1>
              <p className="page-subtitle">
                {activos} activos · {employees.length - activos} inactivos
              </p>
            </div>
          </div>
          <Link href="/empleados/nuevo" className="btn-primary btn-sm">
            <Plus className="size-3.5" />
            Nuevo empleado
          </Link>
        </div>
      </div>

      <div className="page-content">
        <EmployeeListClient employees={employees} todayShifts={todayShifts} />
      </div>
    </div>
  );
}
