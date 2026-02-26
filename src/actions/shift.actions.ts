"use server";

import { revalidatePath } from "next/cache";
import {
  openShift,
  closeShift,
  getOpenShift,
  getShifts,
} from "@/src/modules/shifts/application/shift.service";
import type { OpenShiftInput } from "@/src/types/shift.types";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── Obtener turno abierto ────────────────────────────────────

export async function getOpenShiftAction() {
  try {
    const shift = await getOpenShift();
    return { success: true as const, data: shift };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

// ── Abrir turno ──────────────────────────────────────────────

export async function openShiftAction(
  input: OpenShiftInput,
): Promise<ActionResult<{ id: string; managerName: string }>> {
  try {
    const shift = await openShift(input);
    revalidatePath("/turnos");
    revalidatePath("/ventas");
    revalidatePath("/gastos");
    return {
      success: true,
      data: { id: shift.id, managerName: shift.managerName },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ── Cerrar turno ─────────────────────────────────────────────

export async function closeShiftAction(shiftId: string): Promise<ActionResult> {
  try {
    await closeShift(shiftId);
    revalidatePath("/turnos");
    revalidatePath("/ventas");
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ── Historial de turnos ──────────────────────────────────────

export async function getShiftsAction(limit = 50) {
  try {
    const shifts = await getShifts(limit);
    return { success: true as const, data: shifts };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}
