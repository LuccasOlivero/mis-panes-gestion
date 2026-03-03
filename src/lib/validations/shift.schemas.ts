import { z } from "zod";

export const openShiftSchema = z.object({
  shiftType: z.enum(["morning", "afternoon"]),
  managerName: z
    .string()
    .min(1, "El nombre del responsable es obligatorio")
    .max(100),
});

export const closeShiftSchema = z.object({
  shiftId: z.string().uuid("ID de turno inválido"),
});
