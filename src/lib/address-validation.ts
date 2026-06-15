import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().trim().min(2).max(40).default("Дом"),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(30),
  line1: z.string().trim().min(5).max(160),
  line2: z.string().trim().max(160).optional().nullable(),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2).default("BG"),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;
