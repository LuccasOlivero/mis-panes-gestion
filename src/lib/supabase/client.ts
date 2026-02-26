import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database.types";

// Cliente para uso en componentes cliente (lectura en tiempo real, etc.)
// Para mutaciones siempre usar Server Actions.
let client: ReturnType<typeof createClient<Database>> | null = null;

export function createBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Faltan variables de entorno de Supabase (browser)");
  }

  client = createClient<Database>(url, key);
  return client;
}
