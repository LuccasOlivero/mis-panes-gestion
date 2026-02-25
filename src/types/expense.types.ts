import type {
  ExpenseCategory,
  PaymentMethod,
  ShiftType,
} from "./database.types";

export interface Expense {
  id: string;
  shiftId: string;
  managerName: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  notes: string | null;
  receiptUrl: string | null;
  cancelled: boolean;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  createdAt: Date;
}

export interface ExpenseWithShift extends Expense {
  shiftType: ShiftType;
  expenseDate: string;
}

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

export interface ExpenseFilters {
  shiftId?: string;
  category?: ExpenseCategory;
  paymentMethod?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  cancelled?: boolean;
}
