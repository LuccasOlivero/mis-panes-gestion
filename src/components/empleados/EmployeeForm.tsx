"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createEmployeeAction,
  updateEmployeeAction,
} from "@/src/actions/employee.actions";
import { employeeRoleLabels } from "@/src/modules/employees/domain/employee.entity";
import type { Employee, EmployeeRole } from "@/src/types/employee.types";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const ROLES = Object.entries(employeeRoleLabels) as [EmployeeRole, string][];

interface Props {
  employee?: Employee; // si viene → modo edición
}

export function EmployeeForm({ employee }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState(employee?.fullName ?? "");
  const [role, setRole] = useState<EmployeeRole>(employee?.role ?? "ayudante");
  const [hireDate, setHireDate] = useState(employee?.hireDate ?? "");
  const [baseSalary, setBaseSalary] = useState(
    String(employee?.baseSalary ?? ""),
  );
  const [active, setActive] = useState(employee?.active ?? true);

  const isEdit = !!employee;

  function handleSubmit() {
    setError(null);
    if (!fullName.trim() || !hireDate || !baseSalary) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    const salary = parseFloat(baseSalary);
    if (isNaN(salary) || salary < 0) {
      setError("El sueldo base debe ser un número válido.");
      return;
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateEmployeeAction(employee.id, {
            fullName: fullName.trim(),
            role,
            hireDate,
            baseSalary: salary,
            active,
          })
        : await createEmployeeAction({
            fullName: fullName.trim(),
            role,
            hireDate,
            baseSalary: salary,
          });

      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/empleados"), 900);
      }
    });
  }

  if (success) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10">
        <CheckCircle2 className="size-12 text-green-500" />
        <p className="text-lg font-semibold text-stone-900">
          {isEdit ? "Empleado actualizado" : "Empleado registrado"}
        </p>
        <p className="text-sm text-stone-500">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          {isEdit ? "Editar datos" : "Datos del empleado"}
        </span>
      </div>
      <div className="card-body space-y-5">
        <div>
          <label className="form-label">Nombre completo</label>
          <input
            type="text"
            className="form-input"
            placeholder="Juan García"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="form-label">Rol</label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {ROLES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`rounded-lg border py-2.5 text-sm font-medium transition-all ${
                  role === value
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-stone-200 bg-white text-stone-600 hover:border-amber-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Fecha de ingreso</label>
            <input
              type="date"
              className="form-input"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Sueldo base mensual</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
                $
              </span>
              <input
                type="number"
                className="form-input pl-7"
                placeholder="0"
                min="0"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isEdit && (
          <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4">
            <div>
              <p className="text-sm font-medium text-stone-700">
                Estado del empleado
              </p>
              <p className="text-xs text-stone-400">
                {active
                  ? "Activo — aparece en la lista principal"
                  : "Inactivo — dado de baja"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`relative h-6 w-11 rounded-full transition-colors ${active ? "bg-amber-600" : "bg-stone-300"}`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>
        )}

        {error && (
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            className="btn-primary flex-1"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending
              ? "Guardando..."
              : isEdit
                ? "Guardar cambios"
                : "Registrar empleado"}
          </button>
          <button
            className="btn-secondary"
            onClick={() => router.push("/empleados")}
            disabled={isPending}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
