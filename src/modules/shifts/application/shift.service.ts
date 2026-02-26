import {
  dbGetOpenShift,
  dbOpenShift,
  dbCloseShift,
  dbGetShiftById,
  dbGetShifts,
} from "../infrastructure/shift.repository";
import { mapDbShiftToShift, mapDbShiftToSummary } from "../domain/shift.entity";
import {
  OpenShiftInput,
  OpenShiftSummary,
  Shift,
} from "@/src/types/shift.types";
import {
  closeShiftSchema,
  openShiftSchema,
} from "@/src/lib/validations/shift.schemas";

// ── Obtener turno activo ─────────────────────────────────────

export async function getOpenShift(): Promise<OpenShiftSummary | null> {
  const db = await dbGetOpenShift();
  if (!db) return null;
  return mapDbShiftToSummary(db);
}

// ── Abrir turno ──────────────────────────────────────────────

export async function openShift(input: OpenShiftInput): Promise<Shift> {
  // Validación
  const parsed = openShiftSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  // Regla de negocio: no puede haber turno abierto
  const existing = await dbGetOpenShift();
  if (existing) {
    throw new Error(
      "Ya existe un turno abierto. Cerralo antes de iniciar uno nuevo.",
    );
  }

  const db = await dbOpenShift({
    shift_type: parsed.data.shiftType,
    manager_name: parsed.data.managerName,
  });

  return mapDbShiftToShift(db);
}

// ── Cerrar turno ─────────────────────────────────────────────

export async function closeShift(shiftId: string): Promise<void> {
  const parsed = closeShiftSchema.safeParse({ shiftId });
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  // Verificar que exista y esté abierto
  const shift = await dbGetShiftById(shiftId);
  if (!shift) throw new Error("Turno no encontrado.");
  if (shift.status !== "open") throw new Error("El turno ya está cerrado.");

  await dbCloseShift(shiftId);
}

// ── Historial de turnos ──────────────────────────────────────

export async function getShifts(limit = 50): Promise<Shift[]> {
  const dbs = await dbGetShifts(limit);
  return dbs.map(mapDbShiftToShift);
}
