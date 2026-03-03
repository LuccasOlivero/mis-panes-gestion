// ============================================================
// PANTECA – Tipos de base de datos
// Refleja exactamente el esquema SQL de Supabase.
// ============================================================

export type ShiftType = "morning" | "afternoon";
export type ShiftStatus = "open" | "closed";
export type PriceType = "publico" | "negocio" | "repartidor";
export type PaymentMethod = "efectivo" | "debito" | "credito" | "transferencia";
export type ExpenseCategory =
  | "insumos"
  | "servicios"
  | "mantenimiento"
  | "personal"
  | "impuestos"
  | "otros";
export type EmployeeRole = "ayudante" | "maestro" | "hornero" | "pastelero";
export type StockMovementType = "entrada" | "salida" | "ajuste";

// ── Tablas ──────────────────────────────────────────────────

export interface DbShift {
  id: string;
  shift_type: ShiftType;
  manager_name: string;
  started_at: string;
  ended_at: string | null;
  status: ShiftStatus;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  price_negocio: number | null;
  price_repartidor: number | null;
  is_custom: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSale {
  id: string;
  shift_id: string;
  manager_name: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  price_type: PriceType;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  cancelled: boolean;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbExpense {
  id: string;
  shift_id: string;
  manager_name: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  payment_method: PaymentMethod;
  notes: string | null;
  receipt_url: string | null;
  cancelled: boolean;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Vistas SQL ───────────────────────────────────────────────

export interface DbActiveSale extends DbSale {
  shift_type: ShiftType;
  sale_date: string;
}

export interface DbActiveExpense extends DbExpense {
  shift_type: ShiftType;
  expense_date: string;
}

export interface DbDailySummary {
  day: string;
  total_sales: number;
  total_expenses: number;
  net_profit: number;
}

export interface DbSalesByShift {
  shift_id: string;
  shift_type: ShiftType;
  manager_name: string;
  started_at: string;
  ended_at: string | null;
  total_transactions: number;
  total_amount: number;
  cash: number;
  debit: number;
  credit: number;
  transfer: number;
}

// ── Supabase Database shape (para el cliente tipado) ────────

export interface Database {
  public: {
    Tables: {
      shifts: {
        Row: DbShift;
        Insert: Omit<DbShift, "id" | "created_at" | "updated_at">;
        Update: Partial<DbShift>;
      };
      products: {
        Row: DbProduct;
        Insert: Omit<DbProduct, "id" | "created_at" | "updated_at">;
        Update: Partial<DbProduct>;
      };
      sales: {
        Row: DbSale;
        Insert: Omit<DbSale, "id" | "created_at" | "updated_at">;
        Update: Partial<DbSale>;
      };
      expenses: {
        Row: DbExpense;
        Insert: Omit<DbExpense, "id" | "created_at" | "updated_at">;
        Update: Partial<DbExpense>;
      };
    };
    Views: {
      v_active_sales: { Row: DbActiveSale };
      v_active_expenses: { Row: DbActiveExpense };
      v_daily_summary: { Row: DbDailySummary };
      v_sales_by_shift: { Row: DbSalesByShift };
    };
    Functions: {
      get_open_shift: {
        Returns: Pick<
          DbShift,
          "id" | "shift_type" | "manager_name" | "started_at"
        >[];
      };
      close_shift: { Args: { p_shift_id: string }; Returns: void };
    };
  };
}
