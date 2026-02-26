import {
  createExpenseSchema,
  cancelExpenseSchema,
  expenseFiltersSchema,
} from "@/src/lib/validations/expense.schemas";
import {
  dbCreateExpense,
  dbCancelExpense,
  dbGetExpenseById,
  dbGetExpenses,
  dbGetExpensesByShift,
  dbUploadReceipt,
} from "../infrastructure/expense.repository";
import {
  mapDbExpenseToExpense,
  mapDbActiveExpenseToExpense,
  isExpenseCancellable,
} from "../domain/expense.entity";
import { dbGetOpenShift } from "@/src/modules/shifts/infrastructure/shift.repository";
import type {
  CreateExpenseInput,
  CancelExpenseInput,
  Expense,
  ExpenseWithShift,
  ExpenseFilters,
} from "@/src/types/expense.types";

// ── Crear gasto ──────────────────────────────────────────────

export async function createExpense(
  input: CreateExpenseInput,
): Promise<Expense> {
  const { receiptFile, ...rest } = input;

  const parsed = createExpenseSchema.safeParse(rest);
  if (!parsed.success) throw new Error(parsed.error.message);

  // Verificar turno abierto
  const openShift = await dbGetOpenShift();
  if (!openShift)
    throw new Error(
      "No hay un turno abierto. Iniciá un turno antes de registrar gastos.",
    );

  // Si hay archivo, generar un ID temporal para el path del storage
  // El receipt_url definitivo se actualiza después de crear el gasto
  const tempId = crypto.randomUUID();
  let receiptUrl: string | undefined = parsed.data.receiptUrl;

  if (receiptFile) {
    receiptUrl = await dbUploadReceipt(receiptFile, tempId);
  }

  const db = await dbCreateExpense({
    shift_id: openShift.id,
    description: parsed.data.description,
    amount: parsed.data.amount,
    category: parsed.data.category,
    payment_method: parsed.data.paymentMethod,
    notes: parsed.data.notes ?? null,
    receipt_url: receiptUrl ?? null,
    cancelled: false,
    cancellation_reason: null,
    cancelled_at: null,
    cancelled_by: null,
  });

  return mapDbExpenseToExpense(db);
}

// ── Cancelar gasto ───────────────────────────────────────────

export async function cancelExpense(input: CancelExpenseInput): Promise<void> {
  const parsed = cancelExpenseSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.message);

  const expense = await dbGetExpenseById(parsed.data.expenseId);
  if (!expense) throw new Error("Gasto no encontrado.");
  if (!isExpenseCancellable(mapDbExpenseToExpense(expense))) {
    throw new Error("El gasto ya fue cancelado.");
  }

  await dbCancelExpense(
    parsed.data.expenseId,
    parsed.data.cancellationReason,
    parsed.data.cancelledBy,
  );
}

// ── Obtener gastos activos con filtros ───────────────────────

export async function getExpenses(
  filters: ExpenseFilters = {},
): Promise<ExpenseWithShift[]> {
  const parsed = expenseFiltersSchema.safeParse(filters);
  if (!parsed.success) throw new Error(parsed.error.message);

  const dbs = await dbGetExpenses(parsed.data);
  return dbs.map(mapDbActiveExpenseToExpense);
}

// ── Resumen de gastos del turno actual ───────────────────────

export async function getCurrentShiftExpensesSummary(): Promise<{
  totalAmount: number;
  byCategory: Record<string, number>;
} | null> {
  const openShift = await dbGetOpenShift();
  if (!openShift) return null;

  const expenses = await dbGetExpensesByShift(openShift.id);

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  return { totalAmount, byCategory };
}
