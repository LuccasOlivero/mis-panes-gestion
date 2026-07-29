"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { signInAction, type SignInState } from "@/src/actions/auth.actions";

const initialState: SignInState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="form-label" htmlFor="username">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          className="form-input"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="form-label" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="form-input"
          required
        />
      </div>

      {state.error && (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={isPending}>
        {isPending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
