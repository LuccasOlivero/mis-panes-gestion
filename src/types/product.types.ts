import type { PriceType } from "@/src/types/database.types";

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

/**
 * Devuelve el precio correcto según el tipo seleccionado.
 * Si no existe precio especial, cae al precio base.
 */
export function resolvePriceForType(
  product: Product,
  priceType: PriceType,
): number {
  switch (priceType) {
    case "negocio":
      return product.priceNegocio ?? product.basePrice;
    case "repartidor":
      return product.priceRepartidor ?? product.basePrice;
    case "publico":
    default:
      return product.basePrice;
  }
}
