import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase ligado a cookies de sesión — para Server Components y
 * Server Actions (login/logout, lectura de sesión). Usa la anon key, NO la
 * service role key. No usar para consultas a tablas de la app (para eso
 * sigue existiendo `createServerClient` en `src/lib/supabase/server.ts`).
 */
export async function createSessionClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Faltan variables de entorno de Supabase (URL o ANON_KEY)");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Se llamó desde un Server Component en render — no puede escribir
          // cookies. Está bien ignorarlo porque proxy.ts refresca la sesión
          // en cada request de todas formas.
        }
      },
    },
  });
}
