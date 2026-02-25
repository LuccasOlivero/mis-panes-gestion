import type { PriceType } from "./database.types";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  priceNegocio: number | null;
  priceRepartidor: number | null;
  isCustom: boolean;
  active: boolean;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  basePrice: number;
  priceNegocio?: number;
  priceRepartidor?: number;
}

// Resuelve el precio correcto según tipo
export function resolvePriceForType(
  product: Product,
  priceType: PriceType,
): number {
  if (priceType === "negocio" && product.priceNegocio !== null)
    return product.priceNegocio;
  if (priceType === "repartidor" && product.priceRepartidor !== null)
    return product.priceRepartidor;
  return product.basePrice;
}
