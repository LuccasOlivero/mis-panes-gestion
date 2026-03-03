import type {
  ExpenseCategory,
  PaymentMethod,
} from "@/src/types/database.types";

export interface Expense {
  id: string;
  shiftId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  notes: string | null;
  receiptUrl: string | null;
  managerName: string;
  cancelled: boolean;
  cancellationReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Expense con los datos del turno ya resueltos (se usa en tablas e historial)
export type ExpenseWithShift = Expense;

export interface CreateExpenseInput {
  description: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptFile?: File;
}

export interface CancelExpenseInput {
  expenseId: string;
  cancellationReason: string;
  cancelledBy: string;
}

// Resumen de gastos del turno activo — usado en stat cards de /movimientos
export interface ShiftExpensesSummary {
  totalAmount: number;
  byCategory: Record<string, number>;
}
