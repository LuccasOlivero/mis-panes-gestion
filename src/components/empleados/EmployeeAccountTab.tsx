"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import {
  createEmployeeAccountAction,
  resetEmployeeAccountPasswordAction,
  setEmployeeAccountActiveAction,
  updateEmployeeAccountRoleAction,
} from "@/src/actions/employee-account.actions";
import type { AppRole, EmployeeAccount } from "@/src/types/auth.types";

interface Props {
  employeeId: string;
  account: EmployeeAccount | null;
}

export function EmployeeAccountTab({ employeeId, account }: Props) {
  if (!account) {
    return <CreateAccountForm employeeId={employeeId} />;
  }
  return <ManageAccount account={account} />;
}

function CreateAccountForm({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [appRole, setAppRole] = useState<AppRole>("cajera");

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createEmployeeAccountAction({
        employeeId,
        username,
        password,
        appRole,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="card">
      <div className="card-header">
        <KeyRound className="size-4 text-stone-400" />
        <span className="card-title">Crear acceso</span>
      </div>
      <div className="card-body space-y-4">
        <p className="text-sm text-stone-500">
          Este empleado todavía no tiene usuario para ingresar a la app.
        </p>

        <div>
          <label className="form-label">Usuario</label>
          <input
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ej: jperez"
          />
        </div>

        <div>
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">Rol</label>
          <select
            className="form-input"
            value={appRole}
            onChange={(e) => setAppRole(e.target.value as AppRole)}
          >
            <option value="cajera">Empleada de caja</option>
            <option value="gerente">Gerente</option>
          </select>
        </div>

        {error && (
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={isPending || !username || !password}
        >
          {isPending ? "Creando..." : "Crear acceso"}
        </button>
      </div>
    </div>
  );
}

function ManageAccount({ account }: { account: EmployeeAccount }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  function handleRoleChange(newRole: AppRole) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateEmployeeAccountRoleAction(
        account.authUserId,
        newRole,
      );
      if (!result.success) setError(result.error);
      else router.refresh();
    });
  }

  function handleResetPassword() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await resetEmployeeAccountPasswordAction(
        account.authUserId,
        newPassword,
      );
      if (!result.success) setError(result.error);
      else {
        setNewPassword("");
        setSuccess("Contraseña actualizada.");
      }
    });
  }

  function handleToggleActive() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await setEmployeeAccountActiveAction(
        account.authUserId,
        !account.active,
      );
      if (!result.success) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="card">
      <div className="card-header">
        <KeyRound className="size-4 text-stone-400" />
        <span className="card-title">Acceso a la app</span>
      </div>
      <div className="card-body space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4">
          <div>
            <p className="text-sm font-medium text-stone-900">
              {account.username}
            </p>
            <p className="text-xs text-stone-400">
              {account.active ? "Activo" : "Desactivado"}
            </p>
          </div>
          <button
            className={account.active ? "btn-danger btn-sm" : "btn-primary btn-sm"}
            onClick={handleToggleActive}
            disabled={isPending}
          >
            {account.active ? "Desactivar" : "Activar"}
          </button>
        </div>

        <div>
          <label className="form-label">Rol</label>
          <select
            className="form-input"
            value={account.appRole}
            onChange={(e) => handleRoleChange(e.target.value as AppRole)}
            disabled={isPending}
          >
            <option value="cajera">Empleada de caja</option>
            <option value="gerente">Gerente</option>
          </select>
        </div>

        <div>
          <label className="form-label">Restablecer contraseña</label>
          <div className="flex gap-2">
            <input
              type="password"
              className="form-input"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              className="btn-secondary shrink-0"
              onClick={handleResetPassword}
              disabled={isPending || newPassword.length < 6}
            >
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="size-4 shrink-0" />
            {success}
          </p>
        )}
      </div>
    </div>
  );
}
