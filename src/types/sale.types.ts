import type { PriceType, PaymentMethod } from "@/src/types/database.types";

export interface Sale {
  id: string;
  shiftId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  priceType: PriceType;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  managerName: string;
  cancelled: boolean;
  cancellationReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Sale con los datos del turno ya resueltos (se usa en tablas e historial)
export type SaleWithShift = Sale;

export interface CreateSaleInput {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  priceType: PriceType;
  discount?: number;
  paymentMethod: PaymentMethod;
}

export interface CancelSaleInput {
  saleId: string;
  cancellationReason: string;
  cancelledBy: string;
}

// Resumen de ventas del turno activo — usado en stat cards de /movimientos
export interface ShiftSalesSummary {
  totalAmount: number;
  totalTransactions: number;
  byPaymentMethod: Record<string, number>;
}
