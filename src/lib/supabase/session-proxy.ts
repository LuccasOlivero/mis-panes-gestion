import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Cliente Supabase para usar dentro de `proxy.ts` (el equivalente a
 * middleware en Next.js 16). Lee cookies del request entrante, las reescribe
 * si Supabase refresca el token, e inyecta `x-pathname` en los headers del
 * request reenviado — es la única forma de leer el pathname actual desde un
 * Server Component (`headers()`), ya que no usamos route groups.
 */
export function createProxySessionClient(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Faltan variables de entorno de Supabase (URL o ANON_KEY)");
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  return {
    supabase,
    getResponse: () => response,
  };
}
