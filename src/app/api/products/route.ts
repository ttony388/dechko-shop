import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { getCatalogProducts } from "@/lib/catalog";
import { db } from "@/lib/db";

const productSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  description: z.string().trim().min(10),
  details: z.array(z.string().trim().min(1)).default([]),
  price: z.number().positive(),
  compareAt: z.number().positive().nullable().optional(),
  sku: z.string().trim().min(2),
  stock: z.number().int().min(0),
  badge: z.string().trim().nullable().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  categoryId: z.string().min(1),
  imageUrl: z.string().trim().min(1),
  colors: z.array(z.string().trim().min(1)).default([]),
});

export async function GET() {
  return NextResponse.json(await getCatalogProducts());
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  }

  try {
    const data = productSchema.parse(await request.json());
    const product = await db.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        details: data.details,
        price: data.price,
        compareAt: data.compareAt || null,
        sku: data.sku,
        stock: data.stock,
        badge: data.badge || null,
        featured: data.featured,
        active: data.active,
        categoryId: data.categoryId,
        images: {
          create: [{ url: data.imageUrl, alt: data.name, position: 0 }],
        },
        variants: {
          create: data.colors.map((color, index) => ({
            name: "Цвят",
            value: color,
            sku: `${data.sku}-C${index + 1}`,
            stock: data.stock,
          })),
        },
      },
      include: { category: true, images: true, variants: true },
    });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/category/${product.category.slug}`);
    revalidatePath(`/product/${product.slug}`);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Slug или SKU вече съществува." },
        { status: 409 },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Проверете задължителните полета." },
        { status: 400 },
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Продуктът не беше записан." },
      { status: 500 },
    );
  }
}
