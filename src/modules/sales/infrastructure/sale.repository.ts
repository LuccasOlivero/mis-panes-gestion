import { createServerClient } from "@/src/lib/supabase/server";
import type {
  DbSale,
  DbActiveSale,
  Database,
} from "@/src/types/database.types";
import type { SaleFilters } from "@/src/types/sale.types";
import { toSQLTimestamp } from "@/src/lib/utils/dates";

export async function dbCreateSale(
  input: Omit<DbSale, "id" | "created_at" | "updated_at" | "manager_name">,
  // manager_name es omitido: el trigger fill_manager_name_from_shift lo rellena desde el turno
): Promise<DbSale> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("sales")
    .insert(input)
    .select()
    .single();

  if (error) {
    if (
      error.message.includes("turno cerrado") ||
      error.message.includes("no existe")
    ) {
      throw new Error(
        "No hay un turno abierto. Iniciá un turno antes de registrar ventas.",
      );
    }
    throw new Error(`Error al registrar venta: ${error.message}`);
  }
  return data;
}

export async function dbCancelSale(
  saleId: string,
  cancellationReason: string,
  cancelledBy: string,
): Promise<void> {
  const supabase = createServerClient();

  const updatePayload: Database["public"]["Tables"]["sales"]["Update"] = {
    cancelled: true,
    cancellation_reason: cancellationReason,
    cancelled_by: cancelledBy,
    cancelled_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("sales")
    .update(updatePayload)
    .eq("id", saleId)
    .eq("cancelled", false);

  if (error) throw new Error(`Error al cancelar venta: ${error.message}`);
}

export async function dbGetSaleById(saleId: string): Promise<DbSale | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("id", saleId)
    .single();

  if (error) return null;
  return data;
}

export async function dbGetSales(
  filters: SaleFilters = {},
): Promise<DbActiveSale[]> {
  const supabase = createServerClient();

  let query = supabase
    .from("v_active_sales")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.shiftId) {
    query = query.eq("shift_id", filters.shiftId);
  }
  if (filters.dateFrom) {
    query = query.gte("created_at", toSQLTimestamp(filters.dateFrom));
  }
  if (filters.dateTo) {
    query = query.lte("created_at", toSQLTimestamp(filters.dateTo));
  }
  if (filters.paymentMethod) {
    query = query.eq("payment_method", filters.paymentMethod);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error al obtener ventas: ${error.message}`);
  return data ?? [];
}

export async function dbGetAllSales(
  filters: SaleFilters = {},
): Promise<DbSale[]> {
  // Incluye canceladas — para auditoría
  const supabase = createServerClient();
  let query = supabase
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.shiftId) query = query.eq("shift_id", filters.shiftId);
  if (filters.dateFrom)
    query = query.gte("created_at", toSQLTimestamp(filters.dateFrom));
  if (filters.dateTo)
    query = query.lte("created_at", toSQLTimestamp(filters.dateTo));
  if (filters.cancelled !== undefined)
    query = query.eq("cancelled", filters.cancelled);

  const { data, error } = await query;
  if (error) throw new Error(`Error al obtener historial: ${error.message}`);
  return data ?? [];
}

export async function dbGetSalesByShift(shiftId: string): Promise<DbSale[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("shift_id", shiftId)
    .order("created_at", { ascending: true });

  if (error)
    throw new Error(`Error al obtener ventas del turno: ${error.message}`);
  return data ?? [];
}
