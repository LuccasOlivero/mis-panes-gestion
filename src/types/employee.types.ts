// ─── Enums ────────────────────────────────────────────────────────────────────

export type EmployeeRole = "ayudante" | "maestro" | "hornero" | "pastelero";

export type AttendanceStatus =
  | "presente"
  | "tarde"
  | "ausente_justificado"
  | "ausente_injustificado";

// ─── Entidades ────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  fullName: string;
  role: EmployeeRole;
  hireDate: string;
  baseSalary: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeShift {
  id: string;
  employeeId: string;
  checkIn: string; // ISO timestamp
  checkOut: string | null; // null si no registró salida aún
  hoursWorked: number | null; // calculado al registrar salida
  status: AttendanceStatus;
  notes: string | null;
  createdAt: string;
}

export interface EmployeeSanction {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
  penaltyAmount: number | null;
  createdAt: string;
}

export interface EmployeeAdvance {
  id: string;
  employeeId: string;
  date: string;
  amount: number;
  notes: string | null;
  createdAt: string;
}

export interface EmployeeSalaryRecord {
  id: string;
  employeeId: string;
  period: string; // "2026-02" — YYYY-MM
  salaryAmount: number; // sueldo acordado para ese período
  totalAdvances: number; // suma de adelantos del período
  totalPenalties: number; // suma de penalizaciones del período
  finalPaid: number; // lo que se registró como efectivamente pagado
  notes: string | null;
  createdAt: string;
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateEmployeeInput {
  fullName: string;
  role: EmployeeRole;
  hireDate: string;
  baseSalary: number;
}

export interface UpdateEmployeeInput extends CreateEmployeeInput {
  active: boolean;
}

export interface RegisterCheckInInput {
  employeeId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface RegisterCheckOutInput {
  shiftId: string;
}

export interface CreateSanctionInput {
  employeeId: string;
  date: string;
  reason: string;
  penaltyAmount?: number;
}

export interface CreateAdvanceInput {
  employeeId: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface CreateSalaryRecordInput {
  employeeId: string;
  period: string;
  salaryAmount: number;
  finalPaid: number;
  notes?: string;
}

// ─── Resumen para el perfil de empleado ──────────────────────────────────────

export interface EmployeeProfileSummary {
  employee: Employee;
  todayShift: EmployeeShift | null; // fichaje de hoy
  monthShifts: EmployeeShift[]; // asistencia del mes seleccionado
  advances: EmployeeAdvance[];
  sanctions: EmployeeSanction[];
  salaryRecords: EmployeeSalaryRecord[];
  // Totales del mes seleccionado
  monthStats: {
    present: number;
    late: number;
    absentJustified: number;
    absentUnjustified: number;
    totalHours: number;
    totalAdvances: number;
    totalPenalties: number;
  };
}
