// ─── Períodos disponibles ─────────────────────────────────────────────────────

export type DashboardPeriod = "today" | "week" | "month" | "custom"

export interface DateRange {
  from: string  // ISO date "2026-02-01"
  to:   string  // ISO date "2026-02-28"
}

// ─── Punto de un gráfico de línea/barra ──────────────────────────────────────

export interface DailyPoint {
  date:     string   // "01/02", "02/02", etc. — label para el eje X
  ventas:   number
  gastos:   number
  balance:  number
}

// ─── KPIs del período ─────────────────────────────────────────────────────────

export interface PeriodKPIs {
  totalVentas:      number
  totalGastos:      number
  balanceNeto:      number
  ticketPromedio:   number
  cantVentas:       number
  cantGastos:       number
}

// ─── Comparación período actual vs anterior ───────────────────────────────────

export interface PeriodComparison {
  ventasDiffPct:   number | null   // null si no hay datos del período anterior
  gastosDiffPct:   number | null
  balanceDiffPct:  number | null
}

// ─── Distribución por medio de pago ──────────────────────────────────────────

export interface PaymentMethodSlice {
  method: string
  amount: number
  pct:    number
}

// ─── Resumen por turno (tabla) ────────────────────────────────────────────────

export interface ShiftSummaryRow {
  shiftId:     string
  shiftType:   "morning" | "afternoon"
  managerName: string
  startedAt:   string
  endedAt:     string | null
  ventas:      number
  gastos:      number
  balance:     number
  cantVentas:  number
}

// ─── Movimiento individual (detalle expandible) ───────────────────────────────

export interface MovimientoRow {
  id:          string
  kind:        "sale" | "expense"
  description: string
  amount:      number
  category:    string   // priceType para ventas, category para gastos
  payment:     string
  shiftId:     string
  createdAt:   string
  cancelled:   boolean
}

// ─── Payload completo que devuelve getDashboardDataAction ────────────────────

export interface DashboardData {
  period:       DateRange
  prevPeriod:   DateRange
  kpis:         PeriodKPIs
  comparison:   PeriodComparison
  dailyPoints:  DailyPoint[]
  paymentDist:  PaymentMethodSlice[]
  shiftRows:    ShiftSummaryRow[]
  movimientos:  MovimientoRow[]
}
