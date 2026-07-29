"use server";

import { createServerClient } from "@/src/lib/supabase/server";
import { requireManager } from "@/src/lib/auth/session";
import { toInternalEmail, USERNAME_REGEX } from "@/src/lib/auth/username";
import type {
  AppRole,
  CreateEmployeeAccountInput,
  EmployeeAccount,
} from "@/src/types/auth.types";

type Result<T> = { success: true; data: T } | { success: false; error: string };
type Ok = { success: true } | { success: false; error: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAccount(r: any): EmployeeAccount {
  return {
    id: r.id,
    employeeId: r.employee_id,
    authUserId: r.auth_user_id,
    username: r.username,
    appRole: r.app_role,
    active: r.active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function countActiveGerentes(
  supabase: ReturnType<typeof createServerClient>,
): Promise<number> {
  const { count } = await supabase
    .from("employee_accounts")
    .select("id", { count: "exact", head: true })
    .eq("app_role", "gerente")
    .eq("active", true);
  return count ?? 0;
}

export async function getEmployeeAccountAction(
  employeeId: string,
): Promise<Result<EmployeeAccount | null>> {
  try {
    await requireManager();
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("employee_accounts")
      .select("*")
      .eq("employee_id", employeeId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { success: true, data: data ? mapAccount(data) : null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function createEmployeeAccountAction(
  input: CreateEmployeeAccountInput,
): Promise<Ok> {
  try {
    await requireManager();

    const username = input.username.trim().toLowerCase();
    if (!USERNAME_REGEX.test(username)) {
      return {
        success: false,
        error:
          "El usuario debe tener 3 a 20 caracteres: minúsculas, números, '.', '_' o '-'.",
      };
    }
    if (input.password.length < 6) {
      return {
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres.",
      };
    }

    const supabase = createServerClient();

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("full_name")
      .eq("id", input.employeeId)
      .single();
    if (employeeError) throw new Error(employeeError.message);

    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email: toInternalEmail(username),
        password: input.password,
        email_confirm: true,
        user_metadata: {
          app_role: input.appRole,
          employee_id: input.employeeId,
          full_name: employee.full_name,
        },
      });

    if (createError) throw new Error(createError.message);
    const authUserId = created.user.id;

    const { error: insertError } = await supabase
      .from("employee_accounts")
      .insert({
        employee_id: input.employeeId,
        auth_user_id: authUserId,
        username,
        app_role: input.appRole,
        active: true,
      });

    if (insertError) {
      // Rollback best-effort: no dejar un auth user huérfano sin fila propia.
      await supabase.auth.admin.deleteUser(authUserId);
      throw new Error(insertError.message);
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function resetEmployeeAccountPasswordAction(
  authUserId: string,
  newPassword: string,
): Promise<Ok> {
  try {
    await requireManager();
    if (newPassword.length < 6) {
      return {
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres.",
      };
    }
    const supabase = createServerClient();
    const { error } = await supabase.auth.admin.updateUserById(authUserId, {
      password: newPassword,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateEmployeeAccountRoleAction(
  authUserId: string,
  newRole: AppRole,
): Promise<Ok> {
  try {
    await requireManager();
    const supabase = createServerClient();

    if (newRole !== "gerente") {
      const activeGerentes = await countActiveGerentes(supabase);
      const { data: current } = await supabase
        .from("employee_accounts")
        .select("app_role, active")
        .eq("auth_user_id", authUserId)
        .single();
      if (current?.app_role === "gerente" && current.active && activeGerentes <= 1) {
        return {
          success: false,
          error: "No podés dejar la app sin ningún gerente activo.",
        };
      }
    }

    // user_metadata se reemplaza entero al actualizar, así que hay que
    // fusionar con lo existente para no perder employee_id/full_name.
    const { data: existing, error: getUserError } =
      await supabase.auth.admin.getUserById(authUserId);
    if (getUserError) throw new Error(getUserError.message);

    const { error: authError } = await supabase.auth.admin.updateUserById(
      authUserId,
      {
        user_metadata: {
          ...existing.user.user_metadata,
          app_role: newRole,
        },
      },
    );
    if (authError) throw new Error(authError.message);

    const { error } = await supabase
      .from("employee_accounts")
      .update({ app_role: newRole })
      .eq("auth_user_id", authUserId);
    if (error) throw new Error(error.message);

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function setEmployeeAccountActiveAction(
  authUserId: string,
  active: boolean,
): Promise<Ok> {
  try {
    await requireManager();
    const supabase = createServerClient();

    if (!active) {
      const { data: current } = await supabase
        .from("employee_accounts")
        .select("app_role, active")
        .eq("auth_user_id", authUserId)
        .single();
      if (current?.app_role === "gerente" && current.active) {
        const activeGerentes = await countActiveGerentes(supabase);
        if (activeGerentes <= 1) {
          return {
            success: false,
            error: "No podés dejar la app sin ningún gerente activo.",
          };
        }
      }
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(
      authUserId,
      { ban_duration: active ? "none" : "876000h" },
    );
    if (authError) throw new Error(authError.message);

    const { error } = await supabase
      .from("employee_accounts")
      .update({ active })
      .eq("auth_user_id", authUserId);
    if (error) throw new Error(error.message);

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
