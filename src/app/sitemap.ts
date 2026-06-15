import type { MetadataRoute } from "next";
import { getCatalogCategories, getCatalogProducts } from "@/lib/catalog";
import {
  categories as fallbackCategories,
  products as fallbackProducts,
} from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const [categories, products] = process.env.DATABASE_URL
    ? await Promise.all([getCatalogCategories(), getCatalogProducts()])
    : [fallbackCategories, fallbackProducts];
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...categories.map((category) => ({
      url: `${base}/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/product/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
