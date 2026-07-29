import { ShieldOff } from "lucide-react";
import { signOutAction } from "@/src/actions/auth.actions";

export const dynamic = "force-dynamic";

export default function AccesoDenegadoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="card w-full max-w-sm text-center">
        <div className="card-body flex flex-col items-center gap-4 py-10">
          <ShieldOff className="size-12 text-red-400" />
          <div>
            <p className="text-lg font-semibold text-stone-900">
              No tenés acceso a esta sección
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Tu usuario no tiene permiso para ver este contenido. Volvé a
              iniciar sesión con una cuenta autorizada.
            </p>
          </div>
          <form action={signOutAction} className="w-full">
            <button type="submit" className="btn-primary w-full">
              Volver al inicio de sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
