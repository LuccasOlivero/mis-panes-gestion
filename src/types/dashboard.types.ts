export type DashboardPeriod = "today" | "week" | "month" | "custom";

export interface DateRange {
  from: string; // "2026-03-01"
  to: string; // "2026-03-31"
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export interface DashboardKPIs {
  // Ventas
  totalSales: number; // turnos + reparto
  shiftSales: number; // solo turnos
  deliverySales: number; // solo reparto

  // Gastos
  totalExpenses: number; // turnos + reparto
  shiftExpenses: number;
  deliveryExpenses: number;

  // Balance
  netBalance: number; // totalSales - totalExpenses
}

// ─── Tortas ───────────────────────────────────────────────────────────────────

export interface PieSlice {
  name: string;
  value: number;
  color: string;
}

// Torta 1: Ventas por fuente (turnos vs reparto)
export type SalesBySourceData = PieSlice[];

// Torta 2: Ventas por turno (mañana vs tarde)
export type SalesByShiftTypeData = PieSlice[];

// Torta 3: Gastos por fuente (turnos vs reparto)
export type ExpensesBySourceData = PieSlice[];

// ─── Tabla de turnos ──────────────────────────────────────────────────────────

export interface ShiftRow {
  shiftId: string;
  shiftType: "morning" | "afternoon";
  managerName: string;
  startedAt: string;
  endedAt: string | null;
  sales: number;
  expenses: number;
  balance: number;
  salesCount: number;
}

// ─── Payload completo ─────────────────────────────────────────────────────────

export interface DashboardData {
  period: DashboardPeriod;
  dateRange: DateRange;
  kpis: DashboardKPIs;
  salesBySource: SalesBySourceData;
  salesByShiftType: SalesByShiftTypeData;
  expensesBySource: ExpensesBySourceData;
  shifts: ShiftRow[];
}
