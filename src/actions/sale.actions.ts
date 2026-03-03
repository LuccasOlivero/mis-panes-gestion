"use server";

import { createServerClient } from "@/src/lib/supabase/server";
import {
  createSaleSchema,
  cancelSaleSchema,
} from "@/src/lib/validations/sale.schemas";
import type {
  Sale,
  SaleWithShift,
  CreateSaleInput,
  CancelSaleInput,
  ShiftSalesSummary,
} from "@/src/types/sale.types";

// ─── getSalesAction ───────────────────────────────────────────────────────────
// Ventas del turno abierto actualmente (para /movimientos turno activo).
export async function getSalesAction(): Promise<
  { success: true; data: SaleWithShift[] } | { success: false; error: string }
> {
  try {
    const supabase = createServerClient();

    // Primero obtenemos el turno abierto
    const { data: shift } = await supabase
      .from("shifts")
      .select("id")
      .eq("status", "open")
      .maybeSingle();

    if (!shift) return { success: true, data: [] };

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("shift_id", shift.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return { success: true, data: mapSales(data ?? []) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── getAllSalesAction ────────────────────────────────────────────────────────
// Todas las ventas de todos los turnos (para historial).
export async function getAllSalesAction(): Promise<
  { success: true; data: Sale[] } | { success: false; error: string }
> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return { success: true, data: mapSales(data ?? []) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── getCurrentShiftSalesSummaryAction ───────────────────────────────────────
// Resumen de ventas del turno actual para los stat cards.
export async function getCurrentShiftSalesSummaryAction(): Promise<
  { success: true; data: ShiftSalesSummary } | { success: false; error: string }
> {
  try {
    const supabase = createServerClient();

    const { data: shift } = await supabase
      .from("shifts")
      .select("id")
      .eq("status", "open")
      .maybeSingle();

    if (!shift) {
      return {
        success: true,
        data: { totalAmount: 0, totalTransactions: 0, byPaymentMethod: {} },
      };
    }

    const { data, error } = await supabase
      .from("v_active_sales")
      .select("total, payment_method")
      .eq("shift_id", shift.id);

    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const totalAmount = rows.reduce((s, r) => s + (r.total ?? 0), 0);
    const byPaymentMethod: Record<string, number> = {};
    for (const r of rows) {
      byPaymentMethod[r.payment_method] =
        (byPaymentMethod[r.payment_method] ?? 0) + (r.total ?? 0);
    }

    return {
      success: true,
      data: {
        totalAmount,
        totalTransactions: rows.length,
        byPaymentMethod,
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── createSaleAction ─────────────────────────────────────────────────────────
// Registra una venta asociándola al turno abierto.
export async function createSaleAction(
  input: CreateSaleInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = createSaleSchema.safeParse(input);
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
          "No hay turno abierto. Iniciá un turno antes de registrar ventas.",
      };
    }

    const { data: d } = parsed;
    const total = d.unitPrice * d.quantity - (d.discount ?? 0);

    const { error } = await supabase.from("sales").insert({
      shift_id: shift.id,
      product_id: d.productId ?? null,
      product_name: d.productName,
      quantity: d.quantity,
      unit_price: d.unitPrice,
      price_type: d.priceType,
      discount: d.discount ?? 0,
      total: Math.max(0, total),
      payment_method: d.paymentMethod,
    });

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── cancelSaleAction ─────────────────────────────────────────────────────────
// Anula una venta (soft delete — no se elimina físicamente).
export async function cancelSaleAction(
  input: CancelSaleInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = cancelSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  try {
    const supabase = createServerClient();
    const { d } = { d: parsed.data };

    const { error } = await supabase
      .from("sales")
      .update({
        cancelled: true,
        cancellation_reason: d.cancellationReason,
        cancelled_by: d.cancelledBy,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", d.saleId)
      .eq("cancelled", false); // no anular dos veces

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── Mapper interno ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSales(rows: any[]): SaleWithShift[] {
  return rows.map((r) => ({
    id: r.id,
    shiftId: r.shift_id,
    productId: r.product_id ?? null,
    productName: r.product_name,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    priceType: r.price_type,
    discount: r.discount ?? 0,
    total: r.total,
    paymentMethod: r.payment_method,
    managerName: r.manager_name,
    cancelled: r.cancelled ?? false,
    cancellationReason: r.cancellation_reason ?? null,
    cancelledAt: r.cancelled_at ?? null,
    cancelledBy: r.cancelled_by ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}
