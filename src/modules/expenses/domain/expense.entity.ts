import type { Expense, ExpenseWithShift } from "@/src/types/expense.types";
import type { DbExpense, DbActiveExpense } from "@/src/types/database.types";
import { fromSupabase } from "@/src/lib/utils/dates";

export function mapDbExpenseToExpense(db: DbExpense): Expense {
  return {
    id: db.id,
    shiftId: db.shift_id,
    managerName: db.manager_name,
    description: db.description,
    amount: db.amount,
    category: db.category,
    paymentMethod: db.payment_method,
    notes: db.notes,
    receiptUrl: db.receipt_url,
    cancelled: db.cancelled,
    cancellationReason: db.cancellation_reason,
    cancelledAt: db.cancelled_at ? fromSupabase(db.cancelled_at) : null,
    cancelledBy: db.cancelled_by,
    createdAt: fromSupabase(db.created_at),
  };
}

export function mapDbActiveExpenseToExpense(
  db: DbActiveExpense,
): ExpenseWithShift {
  return {
    ...mapDbExpenseToExpense(db),
    shiftType: db.shift_type,
    expenseDate: db.expense_date,
  };
}

export function isExpenseCancellable(expense: Expense): boolean {
  return !expense.cancelled;
}

export const expenseCategoryLabels: Record<string, string> = {
  materia_prima: "Materia Prima",
  servicios: "Servicios",
  mantenimiento: "Mantenimiento",
  sueldos: "Sueldos",
  insumos: "Insumos",
  otro: "Otro",
};
