import type { MetadataRoute } from "next";
import { categories, products } from "@/lib/products";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const staticRoutes = ["", "/shop", "/cart", "/wishlist", "/contact", "/faq", "/privacy", "/terms"];
  return [
    ...staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: route === "" ? 1 : .7 })),
    ...categories.map((category) => ({ url: `${base}/category/${category.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: .8 })),
    ...products.map((product) => ({ url: `${base}/product/${product.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: .8 })),
  ];
}
