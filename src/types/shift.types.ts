import type { ShiftType, ShiftStatus } from "@/src/types/database.types";

export interface Shift {
  id: string;
  shiftType: ShiftType;
  managerName: string;
  startedAt: string;
  endedAt: string | null;
  status: ShiftStatus;
  createdAt: string;
}

export interface OpenShiftSummary {
  id: string;
  shiftType: ShiftType;
  managerName: string;
  startedAt: string;
  status: ShiftStatus;
}

export interface OpenShiftInput {
  shiftType: ShiftType;
  managerName: string;
}
