import { createSessionClient } from "@/src/lib/supabase/session-server";
import type { AppRole, CurrentSession } from "@/src/types/auth.types";

/**
 * Sesión actual, o null si no hay usuario logueado. Usa `getUser()` (no
 * `getSession()`): hace un round-trip real al servidor de Auth, así que un
 * cambio de rol o una desactivación de cuenta se reflejan en el request
 * siguiente, no recién cuando expire el JWT guardado en la cookie.
 */
export async function getCurrentSession(): Promise<CurrentSession | null> {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const metadata = user.user_metadata as {
    app_role?: AppRole;
    employee_id?: string;
    full_name?: string;
  };

  if (!metadata.app_role || !metadata.employee_id) return null;

  return {
    authUserId: user.id,
    employeeId: metadata.employee_id,
    fullName: metadata.full_name ?? "",
    appRole: metadata.app_role,
  };
}

/**
 * Guard para Server Actions sensibles: tira si quien invoca no es gerente.
 * Se usa como defensa en profundidad además del bloqueo de rutas en proxy.ts,
 * por si alguien invoca la action directamente sin pasar por la página.
 */
export async function requireManager(): Promise<CurrentSession> {
  const session = await getCurrentSession();
  if (!session || session.appRole !== "gerente") {
    throw new Error("No tenés permisos para realizar esta acción.");
  }
  return session;
}
