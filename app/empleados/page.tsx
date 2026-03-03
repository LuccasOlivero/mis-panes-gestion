import Link from "next/link";
import { employeeRoleLabels } from "@/src/modules/employees/domain/employee.entity";
import { getEmployeesAction } from "@/src/actions/employee.actions";
import { Users, Plus, UserCheck, UserX } from "lucide-react";
import { formatDate } from "@/src/lib/utils/dates";

export default async function EmpleadosPage() {
  const result = await getEmployeesAction();
  const employees = result.success ? result.data : [];

  const activos = employees.filter((e) => e.active);
  const inactivos = employees.filter((e) => !e.active);

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="size-5 text-stone-400" />
            <div>
              <h1 className="page-title">Empleados</h1>
              <p className="page-subtitle">
                {activos.length} activos · {inactivos.length} inactivos
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
        {/* Activos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Empleados activos</span>
            <span className="text-xs text-stone-400">
              {activos.length} empleados
            </span>
          </div>
          {activos.length === 0 ? (
            <div className="card-body">
              <p className="py-8 text-center text-sm text-stone-400">
                No hay empleados activos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Ingreso</th>
                    <th>Sueldo base</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {activos.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                            {emp.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{emp.fullName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                          {employeeRoleLabels[emp.role]}
                        </span>
                      </td>
                      <td className="text-sm text-stone-500">
                        {formatDate(emp.hireDate)}
                      </td>
                      <td className="tabular-nums text-sm font-medium text-stone-700">
                        ${emp.baseSalary.toLocaleString("es-AR")}
                      </td>
                      <td>
                        <Link
                          href={`/empleados/${emp.id}`}
                          className="btn-ghost btn-sm"
                        >
                          Ver perfil →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inactivos */}
        {inactivos.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Inactivos / bajas</span>
              <span className="text-xs text-stone-400">{inactivos.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Ingreso</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {inactivos.map((emp) => (
                    <tr key={emp.id} className="opacity-60">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-500">
                            {emp.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{emp.fullName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                          {employeeRoleLabels[emp.role]}
                        </span>
                      </td>
                      <td className="text-sm text-stone-400">
                        {formatDate(emp.hireDate)}
                      </td>
                      <td>
                        <Link
                          href={`/empleados/${emp.id}`}
                          className="btn-ghost btn-sm text-stone-400"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
