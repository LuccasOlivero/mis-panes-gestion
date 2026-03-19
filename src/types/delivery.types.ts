// ─── Entidades ────────────────────────────────────────────────────────────────

export interface DeliveryClient {
  id:        string
  name:      string
  notes:     string | null
  active:    boolean
  createdAt: string
}

export interface DeliverySale {
  id:              string
  saleDate:        string
  clientId:        string | null
  clientTempName:  string | null
  clientName:      string
  isTemp:          boolean
  total:           number
  notes:           string | null
  createdAt:       string
}

export interface DeliveryExpense {
  id:          string
  expenseDate: string
  name:        string
  total:       number
  createdAt:   string
}

export interface DeliveryNote {
  id:        string
  content:   string
  createdAt: string
}

export interface DeliveryOrder {
  id:           string
  clientName:   string
  description:  string
  deliveryDate: string
  daysLeft:     number
  saleAmount:   number
  saleCreated:  boolean
  completed:    boolean
  completedAt:  string | null
  createdAt:    string
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface CreateDeliveryClientInput {
  name:   string
  notes?: string
}

export interface CreateDeliverySaleInput {
  saleDate:        string
  clientId?:       string
  clientTempName?: string
  total:           number
  notes?:          string
}

export interface CreateDeliveryExpenseInput {
  expenseDate: string
  name:        string
  total:       number
}

export interface CreateDeliveryNoteInput {
  content: string
}

export interface CreateDeliveryOrderInput {
  clientName:   string
  description:  string
  deliveryDate: string
  saleAmount:   number
}

// ─── Resumen del día ──────────────────────────────────────────────────────────

export interface DailyDeliverySummary {
  date:          string
  totalSales:    number
  totalExpenses: number
  netBalance:    number
  salesCount:    number
  sales:         DeliverySale[]
  expenses:      DeliveryExpense[]
}
