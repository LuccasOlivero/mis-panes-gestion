import { z } from "zod";

export const createExpenseSchema = z.object({
  description: z.string().min(1, "La descripción es obligatoria").max(300),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  category: z.enum([
    "insumos",
    "servicios",
    "mantenimiento",
    "personal",
    "impuestos",
    "otros",
  ]),
  paymentMethod: z.enum(["efectivo", "debito", "credito", "transferencia"]),
  notes: z.string().max(500).optional(),
});

export const cancelExpenseSchema = z.object({
  expenseId: z.string().uuid("ID de gasto inválido"),
  cancellationReason: z
    .string()
    .min(1, "La razón de anulación es obligatoria")
    .max(500),
  cancelledBy: z
    .string()
    .min(1, "El campo 'anulado por' es obligatorio")
    .max(100),
});
