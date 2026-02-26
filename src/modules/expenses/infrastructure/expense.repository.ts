import { createServerClient } from "@/src/lib/supabase/server";
import type {
  DbExpense,
  DbActiveExpense,
  Database,
} from "@/src/types/database.types";
import type { ExpenseFilters } from "@/src/types/expense.types";
import { toSQLTimestamp } from "@/src/lib/utils/dates";

export async function dbCreateExpense(
  input: Omit<DbExpense, "id" | "created_at" | "updated_at" | "manager_name">,
): Promise<DbExpense> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert(input)
    .select()
    .single();

  if (error) {
    if (
      error.message.includes("turno cerrado") ||
      error.message.includes("no existe")
    ) {
      throw new Error(
        "No hay un turno abierto. Iniciá un turno antes de registrar gastos.",
      );
    }
    throw new Error(`Error al registrar gasto: ${error.message}`);
  }
  return data;
}

export async function dbCancelExpense(
  expenseId: string,
  cancellationReason: string,
  cancelledBy: string,
): Promise<void> {
  const supabase = createServerClient();

  const updatePayload: Database["public"]["Tables"]["expenses"]["Update"] = {
    cancelled: true,
    cancellation_reason: cancellationReason,
    cancelled_by: cancelledBy,
    cancelled_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("expenses")
    .update(updatePayload)
    .eq("id", expenseId)
    .eq("cancelled", false);

  if (error) throw new Error(`Error al cancelar gasto: ${error.message}`);
}

export async function dbGetExpenseById(
  expenseId: string,
): Promise<DbExpense | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .single();

  if (error) return null;
  return data;
}

export async function dbGetExpenses(
  filters: ExpenseFilters = {},
): Promise<DbActiveExpense[]> {
  const supabase = createServerClient();

  let query = supabase
    .from("v_active_expenses")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.shiftId) query = query.eq("shift_id", filters.shiftId);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.paymentMethod)
    query = query.eq("payment_method", filters.paymentMethod);
  if (filters.dateFrom)
    query = query.gte("created_at", toSQLTimestamp(filters.dateFrom));
  if (filters.dateTo)
    query = query.lte("created_at", toSQLTimestamp(filters.dateTo));

  const { data, error } = await query;
  if (error) throw new Error(`Error al obtener gastos: ${error.message}`);
  return data ?? [];
}

export async function dbGetExpensesByShift(
  shiftId: string,
): Promise<DbExpense[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("shift_id", shiftId)
    .eq("cancelled", false)
    .order("created_at", { ascending: true });

  if (error)
    throw new Error(`Error al obtener gastos del turno: ${error.message}`);
  return data ?? [];
}

// Upload de comprobante a Supabase Storage
export async function dbUploadReceipt(
  file: File,
  expenseId: string,
): Promise<string> {
  const supabase = createServerClient();
  const ext = file.name.split(".").pop();
  const path = `receipts/${expenseId}.${ext}`;

  const { error } = await supabase.storage.from("expenses").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });

  if (error) throw new Error(`Error al subir comprobante: ${error.message}`);

  const { data } = supabase.storage.from("expenses").getPublicUrl(path);
  return data.publicUrl;
}
