import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { categories, products } from "../src/lib/products";

const prisma = new PrismaClient();

async function main() {
  const categoryMap = new Map<string, string>();
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        color: category.color,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color,
      },
    });
    categoryMap.set(category.slug, saved.id);
  }

  for (const product of products) {
    const categoryId = categoryMap.get(product.categorySlug)!;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        price: product.price,
        salePrice: product.compareAt ? product.price : null,
        compareAt: product.compareAt,
        status: "ACTIVE",
        active: true,
        ageGroup: product.ages[0] || null,
        tags: [product.categorySlug],
      },
      create: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        details: product.details,
        price: product.price,
        salePrice: product.compareAt ? product.price : null,
        compareAt: product.compareAt,
        sku: product.id.toUpperCase(),
        stock: product.stock,
        badge: product.badge,
        featured: product.featured,
        status: "ACTIVE",
        active: true,
        ageGroup: product.ages[0] || null,
        tags: [product.categorySlug],
        categoryId,
        categories: { create: [{ categoryId }] },
        images: { create: [{ url: product.image, alt: product.name, position: 0 }] },
        variants: {
          create: product.colors.map((color, index) => ({
            name: "Цвят",
            value: color,
            sku: `${product.id.toUpperCase()}-${index + 1}`,
            stock: Math.max(1, product.stock - index * 2),
          })),
        },
      },
    });
  }

  await prisma.coupon.upsert({
    where: { code: "DECHKO10" },
    update: {},
    create: { code: "DECHKO10", type: "percent", value: 10 },
  });
  await prisma.user.upsert({
    where: { email: "admin@dechko.bg" },
    update: { emailVerified: true },
    create: {
      name: "Дечко Admin",
      email: "admin@dechko.bg",
      password: await hash("ChangeMe123!", 12),
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main().finally(() => prisma.$disconnect());
