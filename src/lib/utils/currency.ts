// Formateo de moneda para Argentina (ARS)

const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return formatter.format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return formatter.format(amount);
}

// Calcula el total de una venta
export function calculateSaleTotal(
  unitPrice: number,
  quantity: number,
  discount: number,
): number {
  const raw = unitPrice * quantity - discount;
  return Math.round(raw * 100) / 100; // redondeo a 2 decimales
}
