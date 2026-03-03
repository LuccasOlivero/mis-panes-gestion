/**
 * Formatea un número como moneda argentina (ARS).
 * Ej: 1500.5 → "$1.500,50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calcula el total de una venta aplicando descuento.
 * Nunca devuelve un número negativo.
 */
export function calculateSaleTotal(
  unitPrice: number,
  quantity: number,
  discount: number = 0,
): number {
  return Math.max(0, unitPrice * quantity - discount);
}
