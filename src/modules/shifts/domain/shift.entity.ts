import type { ShiftType } from "@/src/types/database.types";

/**
 * Convierte el enum de turno a etiqueta legible en español.
 */
export function shiftTypeLabel(type: ShiftType): string {
  return type === "morning" ? "Turno Mañana" : "Turno Tarde";
}
