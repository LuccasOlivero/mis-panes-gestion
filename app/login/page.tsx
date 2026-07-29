import { redirect } from "next/navigation";
import { getCurrentSession } from "@/src/lib/auth/session";
import { LoginForm } from "@/src/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="card w-full max-w-sm">
        <div className="card-header">
          <span className="card-title">Panteca</span>
        </div>
        <div className="card-body">
          <p className="mb-4 text-sm text-stone-500">
            Ingresá con tu usuario y contraseña.
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
