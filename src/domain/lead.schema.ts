import { z } from "zod";

import { LEAD_SOURCES } from "./lead";

const optionalTrimmedString = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, msg)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

const optionalPositiveNumber = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: "custom", message: "Debe ser un número válido" });
      return z.NEVER;
    }
    if (n < 0) {
      ctx.addIssue({ code: "custom", message: "Debe ser mayor o igual a 0" });
      return z.NEVER;
    }
    return n;
  });

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
  telefono: optionalTrimmedString(30, "Teléfono demasiado largo"),
  fuente: z.enum(LEAD_SOURCES, { error: "Selecciona una fuente válida" }),
  producto_interes: optionalTrimmedString(120, "Máximo 120 caracteres"),
  presupuesto: optionalPositiveNumber,
});

export type LeadCreateInput = z.input<typeof leadCreateSchema>;
export type LeadCreateOutput = z.output<typeof leadCreateSchema>;

export const leadUpdateSchema = leadCreateSchema.partial();
export type LeadUpdateInput = z.input<typeof leadUpdateSchema>;
