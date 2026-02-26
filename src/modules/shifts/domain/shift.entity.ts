// ── Mappers DB → Domain ──────────────────────────────────────

import { fromSupabase } from "@/src/lib/utils/dates";
import { DbShift } from "@/src/types/database.types";
import { OpenShiftSummary, Shift } from "@/src/types/shift.types";

export function mapDbShiftToShift(db: DbShift): Shift {
  return {
    id: db.id,
    shiftType: db.shift_type,
    managerName: db.manager_name,
    startedAt: fromSupabase(db.started_at),
    endedAt: db.ended_at ? fromSupabase(db.ended_at) : null,
    status: db.status,
    createdAt: fromSupabase(db.created_at),
  };
}

export function mapDbShiftToSummary(
  db: Pick<DbShift, "id" | "shift_type" | "manager_name" | "started_at">,
): OpenShiftSummary {
  return {
    id: db.id,
    shiftType: db.shift_type,
    managerName: db.manager_name,
    startedAt: fromSupabase(db.started_at),
  };
}

// ── Reglas de dominio ────────────────────────────────────────

export function isShiftOpen(shift: Shift): boolean {
  return shift.status === "open";
}

export function shiftDurationMinutes(shift: Shift): number | null {
  if (!shift.endedAt) return null;
  return Math.floor(
    (shift.endedAt.getTime() - shift.startedAt.getTime()) / 60000,
  );
}

export function shiftTypeLabel(type: Shift["shiftType"]): string {
  return type === "morning" ? "Turno Mañana" : "Turno Tarde";
}
