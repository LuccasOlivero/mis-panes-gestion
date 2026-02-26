import { z } from "zod";

export const expenseCategorySchema = z.enum([
  "materia_prima",
  "servicios",
  "mantenimiento",
  "sueldos",
  "insumos",
  "otro",
]);

export const paymentMethodSchema = z.enum([
  "efectivo",
  "debito",
  "credito",
  "transferencia",
]);

export const createExpenseSchema = z.object({
  description: z
    .string()
    .min(3, "La descripción debe tener al menos 3 caracteres")
    .max(255, "Descripción demasiado larga")
    .trim(),
  amount: z
    .number({ error: "El monto debe ser un número" })
    .positive("El monto debe ser mayor a 0"),
  category: expenseCategorySchema,
  paymentMethod: paymentMethodSchema,
  notes: z.string().max(1000, "Notas demasiado largas").trim().optional(),
  // receiptFile se maneja separado (upload a Supabase Storage antes de crear)
  receiptUrl: z.string().url("URL de comprobante inválida").optional(),
});

export const cancelExpenseSchema = z.object({
  expenseId: z.string().uuid("ID de gasto inválido"),
  cancellationReason: z
    .string()
    .min(5, "La razón debe tener al menos 5 caracteres")
    .max(500, "Razón demasiado larga")
    .trim(),
  cancelledBy: z
    .string()
    .min(2, "Nombre de responsable obligatorio")
    .max(100)
    .trim(),
});

export const expenseFiltersSchema = z.object({
  shiftId: z.string().uuid().optional(),
  category: expenseCategorySchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  cancelled: z.boolean().optional(),
});

export type CreateExpenseSchema = z.infer<typeof createExpenseSchema>;
export type CancelExpenseSchema = z.infer<typeof cancelExpenseSchema>;
export type ExpenseFiltersSchema = z.infer<typeof expenseFiltersSchema>;
