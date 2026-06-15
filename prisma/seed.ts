import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { categories, products } from "../src/lib/products";

const prisma = new PrismaClient();

async function main() {
  const categoryMap = new Map<string, string>();
  for (const category of categories.slice(0, 7)) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, color: category.color },
      create: { name: category.name, slug: category.slug, description: category.description, color: category.color },
    });
    categoryMap.set(category.slug, saved.id);
  }
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        details: product.details,
        price: product.price,
        compareAt: product.compareAt,
        sku: product.id.toUpperCase(),
        stock: product.stock,
        badge: product.badge,
        featured: product.featured,
        categoryId: categoryMap.get(product.categorySlug)!,
        images: { create: [{ url: product.image, alt: product.name, position: 0 }] },
        variants: { create: product.colors.map((color, index) => ({ name: "Цвят", value: color, sku: `${product.id.toUpperCase()}-${index + 1}`, stock: Math.max(1, product.stock - index * 2) })) },
      },
    });
  }
  await prisma.coupon.upsert({ where: { code: "DECHKO10" }, update: {}, create: { code: "DECHKO10", type: "percent", value: 10 } });
  await prisma.user.upsert({ where: { email: "admin@dechko.bg" }, update: {}, create: { name: "Дечко Admin", email: "admin@dechko.bg", password: await hash("ChangeMe123!", 12), role: "ADMIN" } });
  console.log(`Seeded ${products.length} products.`);
}

main().finally(() => prisma.$disconnect());
