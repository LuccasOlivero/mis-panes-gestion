import { NextResponse, type NextRequest } from "next/server";
import { createProxySessionClient } from "@/src/lib/supabase/session-proxy";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const PUBLIC_PATHS = ["/login", "/acceso-denegado"];
const GERENTE_ONLY_EXACT = ["/dashboard"];
const GERENTE_ONLY_EMPLOYEE_SUBROUTE =
  /^\/empleados\/[^/]+\/(editar|sancion|adelanto|liquidacion)(\/|$)/;

export async function proxy(request: NextRequest) {
  const { supabase, getResponse } = createProxySessionClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Copia las cookies (posiblemente refrescadas) sobre cualquier redirect,
  // para no perder la rotación de tokens de Supabase en el camino.
  function redirectTo(path: string) {
    const redirectResponse = NextResponse.redirect(new URL(path, request.url));
    getResponse()
      .cookies.getAll()
      .forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (!user && pathname === "/acceso-denegado") {
    return redirectTo("/login");
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    if (user && pathname === "/login") {
      return redirectTo("/");
    }
    return getResponse();
  }

  if (!user) {
    return redirectTo("/login");
  }

  const appRole = (user.user_metadata as { app_role?: string })?.app_role;

  const isRestricted =
    GERENTE_ONLY_EXACT.includes(pathname) ||
    GERENTE_ONLY_EMPLOYEE_SUBROUTE.test(pathname);

  if (appRole !== "gerente" && isRestricted) {
    return redirectTo("/acceso-denegado");
  }

  return getResponse();
}
