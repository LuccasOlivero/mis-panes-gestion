import type { PriceType, PaymentMethod, ShiftType } from "./database.types";

export interface Sale {
  id: string;
  shiftId: string;
  managerName: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  priceType: PriceType;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cancelled: boolean;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  createdAt: Date;
}

export interface SaleWithShift extends Sale {
  shiftType: ShiftType;
  saleDate: string;
}

export interface CreateSaleInput {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  priceType: PriceType;
  discount: number;
  paymentMethod: PaymentMethod;
}

export interface CancelSaleInput {
  saleId: string;
  cancellationReason: string;
  cancelledBy: string;
}

export interface SaleFilters {
  shiftId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  paymentMethod?: PaymentMethod;
  cancelled?: boolean;
}
