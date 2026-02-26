// ── Solo queries. Sin lógica de negocio. ────────────────────

import { createServerClient } from "@/src/lib/supabase/server";
import { DbShift } from "@/src/types/database.types";
import { any } from "zod";

export async function dbGetOpenShift(): Promise<Pick<
  DbShift,
  "id" | "shift_type" | "manager_name" | "started_at"
> | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("get_open_shift");

  if (error)
    throw new Error(`Error al obtener turno abierto: ${error.message}`);
  return data?.[0] ?? null;
}

export async function dbOpenShift(
  input: Pick<DbShift, "shift_type" | "manager_name">,
): Promise<DbShift> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("shifts")
    .insert({
      shift_type: input.shift_type,
      manager_name: input.manager_name,
    })
    .select()
    .single();

  if (error) {
    // El unique index parcial de PostgreSQL devuelve código 23505
    if (error.code === "23505") {
      throw new Error(
        "Ya existe un turno abierto. Cerralo antes de iniciar uno nuevo.",
      );
    }
    throw new Error(`Error al abrir turno: ${error.message}`);
  }
  return data;
}

export async function dbCloseShift(shiftId: string): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.rpc("close_shift", { p_shift_id: shiftId });
  if (error) throw new Error(`Error al cerrar turno: ${error.message}`);
}

export async function dbGetShiftById(shiftId: string): Promise<DbShift | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", shiftId)
    .single();

  if (error) return null;
  return data;
}

export async function dbGetShifts(limit = 50): Promise<DbShift[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Error al obtener turnos: ${error.message}`);
  return data ?? [];
}
