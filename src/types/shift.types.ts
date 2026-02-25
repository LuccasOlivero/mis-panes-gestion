import type { ShiftType, ShiftStatus } from "./database.types";

export interface Shift {
  id: string;
  shiftType: ShiftType;
  managerName: string;
  startedAt: Date;
  endedAt: Date | null;
  status: ShiftStatus;
  createdAt: Date;
}

export interface OpenShiftSummary {
  id: string;
  shiftType: ShiftType;
  managerName: string;
  startedAt: Date;
}

export interface OpenShiftInput {
  shiftType: ShiftType;
  managerName: string;
}
