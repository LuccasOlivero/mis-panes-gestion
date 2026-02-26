import { z } from "zod";

export const priceTypeSchema = z.enum(["publico", "negocio", "repartidor"]);

export const paymentMethodSchema = z.enum([
  "efectivo",
  "debito",
  "credito",
  "transferencia",
]);

export const createSaleSchema = z
  .object({
    productId: z.string().uuid().optional(),
    productName: z
      .string()
      .min(1, "El nombre del producto es obligatorio")
      .max(150, "Nombre demasiado largo")
      .trim(),
    quantity: z
      .number({ error: "La cantidad debe ser un número" })
      .positive("La cantidad debe ser mayor a 0")
      .max(99999, "Cantidad fuera de rango"),
    unitPrice: z
      .number({ error: "El precio debe ser un número" })
      .min(0, "El precio no puede ser negativo"),
    priceType: priceTypeSchema,
    discount: z
      .number()
      .min(0, "El descuento no puede ser negativo")
      .default(0),
    paymentMethod: paymentMethodSchema,
  })
  .refine((data) => data.discount <= data.unitPrice * data.quantity, {
    message: "El descuento no puede superar el total de la venta",
    path: ["discount"],
  });

export const cancelSaleSchema = z.object({
  saleId: z.string().uuid("ID de venta inválido"),
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

export const saleFiltersSchema = z.object({
  shiftId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  cancelled: z.boolean().optional(),
});

export type CreateSaleSchema = z.infer<typeof createSaleSchema>;
export type CancelSaleSchema = z.infer<typeof cancelSaleSchema>;
export type SaleFiltersSchema = z.infer<typeof saleFiltersSchema>;
