import { z } from "zod";

import { WEBHOOK_EVENTS } from "./webhook";

/**
 * Validation schemas for webhook CRUD flows.
 *
 * Shared between React Hook Form (client) and the Next.js route handlers
 * (server) so we have a single source of truth.
 */
export const webhookCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "Máximo 80 caracteres"),
  url: z
    .string()
    .trim()
    .url("La URL debe ser absoluta (https://…)")
    .max(512, "URL demasiado larga"),
  events: z
    .array(z.enum(WEBHOOK_EVENTS))
    .min(1, "Selecciona al menos un evento"),
  enabled: z.boolean().optional().default(true),
  secret: z
    .string()
    .trim()
    .max(128, "Máximo 128 caracteres")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type WebhookCreateFormValues = z.input<typeof webhookCreateSchema>;
export type WebhookCreateInput = z.output<typeof webhookCreateSchema>;

export const webhookUpdateSchema = webhookCreateSchema.partial();
export type WebhookUpdateInput = z.output<typeof webhookUpdateSchema>;

/**
 * Schema for the inbound webhook endpoint.
 *
 * CRMs and funnel tools disagree on field names, so we accept a flexible
 * shape and map it to our internal Lead create input. The `extra` bag is
 * preserved so the raw payload remains visible in the delivery log.
 */
export const inboundLeadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120),
  email: z.string().trim().email("Email inválido"),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  product: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  budget: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v === null || v === "") return undefined;
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({
          code: "custom",
          message: "budget debe ser un número ≥ 0",
        });
        return z.NEVER;
      }
      return n;
    }),
});

export type InboundLeadInput = z.output<typeof inboundLeadSchema>;
