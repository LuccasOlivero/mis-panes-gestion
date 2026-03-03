"use server";

import { createServerClient } from "@/src/lib/supabase/server";
import {
  createExpenseSchema,
  cancelExpenseSchema,
} from "@/src/lib/validations/expense.schemas";
import type {
  Expense,
  ExpenseWithShift,
  CreateExpenseInput,
  CancelExpenseInput,
  ShiftExpensesSummary,
} from "@/src/types/expense.types";

// ─── getExpensesAction ────────────────────────────────────────────────────────
// Gastos del turno abierto actualmente (para /movimientos turno activo).
export async function getExpensesAction(): Promise<
  | { success: true; data: ExpenseWithShift[] }
  | { success: false; error: string }
> {
  try {
    const supabase = createServerClient();

    const { data: shift } = await supabase
      .from("shifts")
      .select("id")
      .eq("status", "open")
      .maybeSingle();

    if (!shift) return { success: true, data: [] };

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("shift_id", shift.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return { success: true, data: mapExpenses(data ?? []) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── getAllExpensesAction ─────────────────────────────────────────────────────
// Todos los gastos de todos los turnos (para historial).
export async function getAllExpensesAction(): Promise<
  | { success: true; data: ExpenseWithShift[] }
  | { success: false; error: string }
> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return { success: true, data: mapExpenses(data ?? []) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── getCurrentShiftExpensesSummaryAction ─────────────────────────────────────
// Resumen de gastos del turno actual para los stat cards.
export async function getCurrentShiftExpensesSummaryAction(): Promise<
  | { success: true; data: ShiftExpensesSummary }
  | { success: false; error: string }
> {
  try {
    const supabase = createServerClient();

    const { data: shift } = await supabase
      .from("shifts")
      .select("id")
      .eq("status", "open")
      .maybeSingle();

    if (!shift) {
      return { success: true, data: { totalAmount: 0, byCategory: {} } };
    }

    const { data, error } = await supabase
      .from("v_active_expenses")
      .select("amount, category")
      .eq("shift_id", shift.id);

    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const totalAmount = rows.reduce((s, r) => s + (r.amount ?? 0), 0);
    const byCategory: Record<string, number> = {};
    for (const r of rows) {
      byCategory[r.category] = (byCategory[r.category] ?? 0) + (r.amount ?? 0);
    }

    return { success: true, data: { totalAmount, byCategory } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── createExpenseAction ──────────────────────────────────────────────────────
// Registra un gasto. Si hay comprobante, lo sube a Supabase Storage.
export async function createExpenseAction(
  input: CreateExpenseInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const { receiptFile, ...rest } = input;
  const parsed = createExpenseSchema.safeParse(rest);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  try {
    const supabase = createServerClient();

    // Verificar turno abierto
    const { data: shift } = await supabase
      .from("shifts")
      .select("id")
      .eq("status", "open")
      .maybeSingle();

    if (!shift) {
      return {
        success: false,
        error:
          "No hay turno abierto. Iniciá un turno antes de registrar gastos.",
      };
    }

    const { d } = { d: parsed.data };

    // Insertar gasto primero para obtener el ID
    const { data: expense, error: insertError } = await supabase
      .from("expenses")
      .insert({
        shift_id: shift.id,
        description: d.description,
        amount: d.amount,
        category: d.category,
        payment_method: d.paymentMethod,
        notes: d.notes ?? null,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);

    // Subir comprobante si existe
    if (receiptFile) {
      const ext = receiptFile.name.split(".").pop() ?? "jpg";
      const path = `receipts/${expense.id}.${ext}`;
      const buffer = await receiptFile.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("expenses")
        .upload(path, buffer, { contentType: receiptFile.type, upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("expenses")
          .getPublicUrl(path);
        await supabase
          .from("expenses")
          .update({ receipt_url: urlData.publicUrl })
          .eq("id", expense.id);
      }
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── cancelExpenseAction ──────────────────────────────────────────────────────
// Anula un gasto (soft delete — no se elimina físicamente).
export async function cancelExpenseAction(
  input: CancelExpenseInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = cancelExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  try {
    const supabase = createServerClient();
    const { d } = { d: parsed.data };

    const { error } = await supabase
      .from("expenses")
      .update({
        cancelled: true,
        cancellation_reason: d.cancellationReason,
        cancelled_by: d.cancelledBy,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", d.expenseId)
      .eq("cancelled", false);

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── Mapper interno ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExpenses(rows: any[]): ExpenseWithShift[] {
  return rows.map((r) => ({
    id: r.id,
    shiftId: r.shift_id,
    description: r.description,
    amount: r.amount,
    category: r.category,
    paymentMethod: r.payment_method,
    notes: r.notes ?? null,
    receiptUrl: r.receipt_url ?? null,
    managerName: r.manager_name,
    cancelled: r.cancelled ?? false,
    cancellationReason: r.cancellation_reason ?? null,
    cancelledAt: r.cancelled_at ?? null,
    cancelledBy: r.cancelled_by ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}
