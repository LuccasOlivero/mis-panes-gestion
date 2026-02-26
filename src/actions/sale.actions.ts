"use server";

import { revalidatePath } from "next/cache";
import {
  createSale,
  cancelSale,
  getSales,
  getAllSales,
  getCurrentShiftSalesSummary,
} from "@/src/modules/sales/application/sale.service";
import type {
  CreateSaleInput,
  CancelSaleInput,
  SaleFilters,
} from "@/src/types/sale.types";

// ── Registrar venta ──────────────────────────────────────────

export async function createSaleAction(input: CreateSaleInput) {
  try {
    const sale = await createSale(input);
    revalidatePath("/ventas");
    revalidatePath("/dashboard");
    return { success: true as const, data: sale };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

// ── Cancelar venta ───────────────────────────────────────────

export async function cancelSaleAction(input: CancelSaleInput) {
  try {
    await cancelSale(input);
    revalidatePath("/ventas");
    revalidatePath("/ventas/historial");
    revalidatePath("/dashboard");
    return { success: true as const, data: undefined };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

// ── Obtener ventas con filtros ───────────────────────────────

export async function getSalesAction(filters: SaleFilters = {}) {
  try {
    const sales = await getSales(filters);
    return { success: true as const, data: sales };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

// ── Historial completo (incluye canceladas) ──────────────────

export async function getAllSalesAction(filters: SaleFilters = {}) {
  try {
    const sales = await getAllSales(filters);
    return { success: true as const, data: sales };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

// ── Resumen del turno actual ─────────────────────────────────

export async function getCurrentShiftSalesSummaryAction() {
  try {
    const summary = await getCurrentShiftSalesSummary();
    return { success: true as const, data: summary };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}
