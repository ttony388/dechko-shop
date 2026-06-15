import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(300).optional().nullable(),
  color: z.string().trim().max(20).optional().nullable(),
});

export const couponInputSchema = z.object({
  code: z.string().trim().min(3).max(40).transform((value) => value.toUpperCase()),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  minOrder: z.number().nonnegative().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  active: z.boolean(),
  expiresAt: z.string().datetime().optional().nullable(),
});
