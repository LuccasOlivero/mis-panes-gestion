import type { ExpenseCategory } from "@/src/types/database.types";

/**
 * Etiquetas legibles en español para cada categoría de gasto.
 */
export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  insumos: "Insumos",
  servicios: "Servicios",
  mantenimiento: "Mantenimiento",
  personal: "Personal",
  impuestos: "Impuestos",
  otros: "Otros",
};
