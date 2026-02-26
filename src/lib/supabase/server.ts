import { createClient } from "@supabase/supabase-js";

// Cliente para uso en Server Actions y capa de infraestructura.
// Nunca importar este archivo desde componentes cliente.
//
// Nota: no usamos el genérico Database aquí porque los tipos
// auto-generados por Supabase CLI son la fuente de verdad en producción.
// Mientras tanto, cada repository tipea sus propias respuestas con los
// tipos de database.types.ts, evitando el error "never" en .update()/.insert()
// que ocurre cuando el shape Database manual no coincide exactamente con
// la estructura interna que espera supabase-js.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Faltan variables de entorno de Supabase (server)");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
