import { calculateSaleTotal } from "@/src/lib/utils/currency";
import { fromSupabase } from "@/src/lib/utils/dates";
import { DbActiveSale, DbSale } from "@/src/types/database.types";
import { Sale, SaleWithShift } from "@/src/types/sale.types";

export function mapDbSaleToSale(db: DbSale): Sale {
  return {
    id: db.id,
    shiftId: db.shift_id,
    managerName: db.manager_name,
    productId: db.product_id,
    productName: db.product_name,
    quantity: db.quantity,
    unitPrice: db.unit_price,
    priceType: db.price_type,
    discount: db.discount,
    total: db.total,
    paymentMethod: db.payment_method,
    cancelled: db.cancelled,
    cancellationReason: db.cancellation_reason,
    cancelledAt: db.cancelled_at ? fromSupabase(db.cancelled_at) : null,
    cancelledBy: db.cancelled_by,
    createdAt: fromSupabase(db.created_at),
  };
}

export function mapDbActiveSaleToSale(db: DbActiveSale): SaleWithShift {
  return {
    ...mapDbSaleToSale(db),
    shiftType: db.shift_type,
    saleDate: db.sale_date,
  };
}

// ── Reglas de dominio ────────────────────────────────────────

export function computeSaleTotal(
  unitPrice: number,
  quantity: number,
  discount: number,
): number {
  return calculateSaleTotal(unitPrice, quantity, discount);
}

export function isSaleCancellable(sale: Sale): boolean {
  return !sale.cancelled;
}
