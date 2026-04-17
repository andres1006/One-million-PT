import { z } from "zod";

import { LEAD_SOURCES } from "./lead";

/**
 * Validation schemas for create/update flows.
 * Used by React Hook Form and by the mock API to keep a single source of truth.
 */
export const leadCreateSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().trim().email("Email inválido"),
  telefono: z
    .string()
    .trim()
    .max(30, "Teléfono demasiado largo")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  fuente: z.enum(LEAD_SOURCES, {
    error: "Selecciona una fuente válida",
  }),
  producto_interes: z
    .string()
    .trim()
    .max(120, "Máximo 120 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  presupuesto: z
    .union([
      z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
      z.literal("").transform(() => undefined),
      z.undefined(),
    ])
    .optional(),
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

export const leadUpdateSchema = leadCreateSchema.partial();
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
