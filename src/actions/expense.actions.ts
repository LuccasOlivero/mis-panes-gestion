"use server";

import { revalidatePath } from "next/cache";
import {
  createExpense,
  cancelExpense,
  getExpenses,
  getCurrentShiftExpensesSummary,
} from "@/src/modules/expenses/application/expense.service";
import type {
  CreateExpenseInput,
  CancelExpenseInput,
  ExpenseFilters,
} from "@/src/types/expense.types";

// ── Registrar gasto ──────────────────────────────────────────

export async function createExpenseAction(input: CreateExpenseInput) {
  try {
    const expense = await createExpense(input);
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    return { success: true as const, data: expense };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

// ── Cancelar gasto ───────────────────────────────────────────

export async function cancelExpenseAction(input: CancelExpenseInput) {
  try {
    await cancelExpense(input);
    revalidatePath("/gastos");
    revalidatePath("/gastos/historial");
    revalidatePath("/dashboard");
    return { success: true as const, data: undefined };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

// ── Obtener gastos con filtros ───────────────────────────────

export async function getExpensesAction(filters: ExpenseFilters = {}) {
  try {
    const expenses = await getExpenses(filters);
    return { success: true as const, data: expenses };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

// ── Resumen de gastos del turno actual ───────────────────────

export async function getCurrentShiftExpensesSummaryAction() {
  try {
    const summary = await getCurrentShiftExpensesSummary();
    return { success: true as const, data: summary };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}
