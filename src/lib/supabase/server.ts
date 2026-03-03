import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para uso en Server Components y Server Actions.
 * Usa la service role key — nunca exponer al cliente.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan variables de entorno de Supabase (URL o SERVICE_ROLE_KEY)",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
