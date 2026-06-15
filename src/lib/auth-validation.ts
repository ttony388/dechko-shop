import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(80),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
