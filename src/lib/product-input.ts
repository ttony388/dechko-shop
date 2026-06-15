import { z } from "zod";

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2),
    slug: z.string().trim().min(2),
    description: z.string().trim().min(10),
    details: z.array(z.string().trim().min(1)).default([]),
    price: z.number().positive(),
    salePrice: z.number().positive().nullable().optional(),
    sku: z.string().trim().min(2),
    stock: z.number().int().min(0),
    badge: z.string().trim().nullable().optional(),
    brand: z.string().trim().nullable().optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
    ageGroup: z.string().trim().nullable().optional(),
    gender: z.enum(["NEUTRAL", "GIRLS", "BOYS"]).default("NEUTRAL"),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
    featured: z.boolean().default(false),
    categoryIds: z.array(z.string().min(1)).min(1),
    imageUrl: z.string().trim().min(1),
    colors: z.array(z.string().trim().min(1)).default([]),
  })
  .superRefine((value, context) => {
    if (value.salePrice && value.salePrice >= value.price) {
      context.addIssue({
        code: "custom",
        path: ["salePrice"],
        message: "Промоционалната цена трябва да е по-ниска от редовната.",
      });
    }
  });

export type ProductInput = z.infer<typeof productInputSchema>;
