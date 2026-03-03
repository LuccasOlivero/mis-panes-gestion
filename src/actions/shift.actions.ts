"use server";

import { createServerClient } from "@/src/lib/supabase/server";
import {
  openShiftSchema,
  closeShiftSchema,
} from "@/src/lib/validations/shift.schemas";
import type {
  Shift,
  OpenShiftSummary,
  OpenShiftInput,
} from "@/src/types/shift.types";

// ─── getOpenShiftAction ──────────────────────────────────────────────────────
// Devuelve el turno abierto actualmente, o null si no hay ninguno.
export async function getOpenShiftAction(): Promise<
  | { success: true; data: OpenShiftSummary | null }
  | { success: false; error: string }
> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("shifts")
      .select("id, shift_type, manager_name, started_at, status")
      .eq("status", "open")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return { success: true, data: null };

    return {
      success: true,
      data: {
        id: data.id,
        shiftType: data.shift_type,
        managerName: data.manager_name,
        startedAt: data.started_at,
        status: data.status,
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── getShiftsAction ─────────────────────────────────────────────────────────
// Devuelve los últimos N turnos ordenados por fecha desc.
export async function getShiftsAction(
  limit = 20,
): Promise<
  { success: true; data: Shift[] } | { success: false; error: string }
> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("shifts")
      .select(
        "id, shift_type, manager_name, started_at, ended_at, status, created_at",
      )
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    const shifts: Shift[] = (data ?? []).map((row) => ({
      id: row.id,
      shiftType: row.shift_type,
      managerName: row.manager_name,
      startedAt: row.started_at,
      endedAt: row.ended_at ?? null,
      status: row.status,
      createdAt: row.created_at,
    }));

    return { success: true, data: shifts };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── openShiftAction ─────────────────────────────────────────────────────────
// Abre un nuevo turno. Falla si ya hay uno abierto (constraint en DB).
export async function openShiftAction(
  input: OpenShiftInput,
): Promise<
  { success: true; data: OpenShiftSummary } | { success: false; error: string }
> {
  const parsed = openShiftSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("shifts")
      .insert({
        shift_type: parsed.data.shiftType,
        manager_name: parsed.data.managerName,
        status: "open",
      })
      .select("id, shift_type, manager_name, started_at, status")
      .single();

    if (error) {
      // El constraint one_open_shift de la DB devuelve un error descriptivo
      if (error.code === "23P01" || error.message.includes("one_open_shift")) {
        return {
          success: false,
          error:
            "Ya existe un turno abierto. Cerralo antes de iniciar uno nuevo.",
        };
      }
      throw new Error(error.message);
    }

    return {
      success: true,
      data: {
        id: data.id,
        shiftType: data.shift_type,
        managerName: data.manager_name,
        startedAt: data.started_at,
        status: data.status,
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── closeShiftAction ────────────────────────────────────────────────────────
// Cierra el turno con el ID dado.
export async function closeShiftAction(
  shiftId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = closeShiftSchema.safeParse({ shiftId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("shifts")
      .update({ status: "closed", ended_at: new Date().toISOString() })
      .eq("id", shiftId)
      .eq("status", "open"); // solo cierra si está abierto

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
