import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ProductInput } from "@/lib/product-input";

export async function createProduct(data: ProductInput) {
  const categoryIds = [...new Set(data.categoryIds)];
  const sellingPrice = data.salePrice || data.price;
  const product = await db.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      details: data.details,
      price: sellingPrice,
      salePrice: data.salePrice || null,
      compareAt: data.salePrice ? data.price : null,
      sku: data.sku,
      stock: data.stock,
      badge: data.badge || null,
      brand: data.brand || null,
      tags: data.tags.map((tag) => tag.toLowerCase()),
      ageGroup: data.ageGroup || null,
      gender: data.gender,
      status: data.status,
      active: data.status === "ACTIVE",
      featured: data.featured,
      categoryId: categoryIds[0],
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
      images: { create: [{ url: data.imageUrl, alt: data.name, position: 0 }] },
      variants: {
        create: data.colors.map((color, index) => ({
          name: "Цвят",
          value: color,
          sku: `${data.sku}-C${index + 1}`,
          stock: data.stock,
        })),
      },
    },
    include: { category: true },
  });
  revalidateProductPaths(product.slug, product.category.slug);
  return product;
}

export async function updateProduct(id: string, data: ProductInput) {
  const categoryIds = [...new Set(data.categoryIds)];
  const current = await db.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!current) return null;

  const sellingPrice = data.salePrice || data.price;
  const product = await db.product.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      details: data.details,
      price: sellingPrice,
      salePrice: data.salePrice || null,
      compareAt: data.salePrice ? data.price : null,
      sku: data.sku,
      stock: data.stock,
      badge: data.badge || null,
      brand: data.brand || null,
      tags: data.tags.map((tag) => tag.toLowerCase()),
      ageGroup: data.ageGroup || null,
      gender: data.gender,
      status: data.status,
      active: data.status === "ACTIVE",
      featured: data.featured,
      categoryId: categoryIds[0],
      categories: {
        deleteMany: {},
        create: categoryIds.map((categoryId) => ({ categoryId })),
      },
      images: {
        deleteMany: {},
        create: [{ url: data.imageUrl, alt: data.name, position: 0 }],
      },
      variants: {
        deleteMany: {},
        create: data.colors.map((color, index) => ({
          name: "Цвят",
          value: color,
          sku: `${data.sku}-C${index + 1}`,
          stock: data.stock,
        })),
      },
    },
    include: { category: true },
  });
  revalidateProductPaths(current.slug, current.category.slug);
  revalidateProductPaths(product.slug, product.category.slug);
  return product;
}

export async function archiveProduct(id: string) {
  const current = await db.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!current) return null;

  const product = await db.product.update({
    where: { id },
    data: { status: "ARCHIVED", active: false },
  });
  revalidateProductPaths(current.slug, current.category.slug);
  return product;
}

function revalidateProductPaths(slug: string, categorySlug: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/search");
  revalidatePath("/admin/products");
  revalidatePath(`/category/${categorySlug}`);
  revalidatePath(`/product/${slug}`);
}
