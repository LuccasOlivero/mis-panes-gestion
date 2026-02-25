import { Database } from "@/src/types/database.types";
import { createClient } from "@supabase/supabase-js";

// Cliente para uso en Server Actions y capa de infraestructura.
// Nunca importar este archivo desde componentes cliente.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Faltan variables de entorno de Supabase (server)");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}
