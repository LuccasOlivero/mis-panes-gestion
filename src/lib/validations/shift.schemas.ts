import { z } from "zod";

export const shiftTypeSchema = z.enum(["morning", "afternoon"], {
  error: () => ({ message: "Tipo de turno inválido" }),
});

export const openShiftSchema = z.object({
  shiftType: shiftTypeSchema,
  managerName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres")
    .trim(),
});

export const closeShiftSchema = z.object({
  shiftId: z.string().uuid("ID de turno inválido"),
});

export type OpenShiftSchema = z.infer<typeof openShiftSchema>;
export type CloseShiftSchema = z.infer<typeof closeShiftSchema>;
