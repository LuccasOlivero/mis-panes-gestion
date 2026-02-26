import {
  createSaleSchema,
  cancelSaleSchema,
  saleFiltersSchema,
} from "@/src/lib/validations/sale.schemas";
import {
  dbCreateSale,
  dbCancelSale,
  dbGetSaleById,
  dbGetSales,
  dbGetAllSales,
  dbGetSalesByShift,
} from "../infrastructure/sale.repository";
import {
  mapDbSaleToSale,
  mapDbActiveSaleToSale,
  computeSaleTotal,
  isSaleCancellable,
} from "../domain/sale.entity";
import { dbGetOpenShift } from "@/src/modules/shifts/infrastructure/shift.repository";
import type {
  CreateSaleInput,
  CancelSaleInput,
  Sale,
  SaleWithShift,
  SaleFilters,
} from "@/src/types/sale.types";

// ── Crear venta ──────────────────────────────────────────────

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  // Validación Zod
  const parsed = createSaleSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.message);

  // Verificar turno abierto
  const openShift = await dbGetOpenShift();
  if (!openShift)
    throw new Error(
      "No hay un turno abierto. Iniciá un turno antes de registrar ventas.",
    );

  const {
    productId,
    productName,
    quantity,
    unitPrice,
    priceType,
    discount,
    paymentMethod,
  } = parsed.data;

  // Calcular total (también lo valida la DB con CHECK constraint)
  const total = computeSaleTotal(unitPrice, quantity, discount);

  const db = await dbCreateSale({
    shift_id: openShift.id,
    product_id: productId ?? null,
    product_name: productName,
    quantity,
    unit_price: unitPrice,
    price_type: priceType,
    discount,
    total,
    payment_method: paymentMethod,
    cancelled: false,
    cancellation_reason: null,
    cancelled_at: null,
    cancelled_by: null,
  });

  return mapDbSaleToSale(db);
}

// ── Cancelar venta ───────────────────────────────────────────

export async function cancelSale(input: CancelSaleInput): Promise<void> {
  const parsed = cancelSaleSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.message);

  const sale = await dbGetSaleById(parsed.data.saleId);
  if (!sale) throw new Error("Venta no encontrada.");
  if (!isSaleCancellable(mapDbSaleToSale(sale)))
    throw new Error("La venta ya fue cancelada.");

  await dbCancelSale(
    parsed.data.saleId,
    parsed.data.cancellationReason,
    parsed.data.cancelledBy,
  );
}

// ── Obtener ventas activas con filtros ───────────────────────

export async function getSales(
  filters: SaleFilters = {},
): Promise<SaleWithShift[]> {
  const parsed = saleFiltersSchema.safeParse(filters);
  if (!parsed.success) throw new Error(parsed.error.message);

  const dbs = await dbGetSales(parsed.data);
  return dbs.map(mapDbActiveSaleToSale);
}

// ── Historial completo (incluye canceladas) ──────────────────

export async function getAllSales(filters: SaleFilters = {}): Promise<Sale[]> {
  const dbs = await dbGetAllSales(filters);
  return dbs.map(mapDbSaleToSale);
}

// ── Ventas de un turno específico ────────────────────────────

export async function getSalesByShift(shiftId: string): Promise<Sale[]> {
  const dbs = await dbGetSalesByShift(shiftId);
  return dbs.map(mapDbSaleToSale);
}

// ── Resumen del turno actual ─────────────────────────────────

export async function getCurrentShiftSalesSummary(): Promise<{
  totalAmount: number;
  totalTransactions: number;
  byPaymentMethod: Record<string, number>;
} | null> {
  const openShift = await dbGetOpenShift();
  if (!openShift) return null;

  const sales = await dbGetSalesByShift(openShift.id);
  const activeSales = sales.filter((s) => !s.cancelled);

  const totalAmount = activeSales.reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = activeSales.length;

  const byPaymentMethod = activeSales.reduce<Record<string, number>>(
    (acc, s) => {
      acc[s.payment_method] = (acc[s.payment_method] ?? 0) + s.total;
      return acc;
    },
    {},
  );

  return { totalAmount, totalTransactions, byPaymentMethod };
}
