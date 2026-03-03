import { z } from "zod";

export const createSaleSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z
    .string()
    .min(1, "El nombre del producto es obligatorio")
    .max(200),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.number().nonnegative("El precio no puede ser negativo"),
  priceType: z.enum(["publico", "negocio", "repartidor"]),
  discount: z.number().nonnegative().default(0),
  paymentMethod: z.enum(["efectivo", "debito", "credito", "transferencia"]),
});

export const cancelSaleSchema = z.object({
  saleId: z.string().uuid("ID de venta inválido"),
  cancellationReason: z
    .string()
    .min(1, "La razón de anulación es obligatoria")
    .max(500),
  cancelledBy: z
    .string()
    .min(1, "El campo 'anulado por' es obligatorio")
    .max(100),
});
