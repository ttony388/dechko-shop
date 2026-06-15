import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/account";
import { db } from "@/lib/db";

const wishlistSchema = z.object({
  productId: z.string().min(1),
  wished: z.boolean(),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Необходим е вход." }, { status: 401 });

  const items = await db.wishlist.findMany({
    where: { userId },
    select: { productId: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ productIds: items.map((item) => item.productId) });
}

export async function PUT(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Необходим е вход." }, { status: 401 });

  const parsed = wishlistSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалиден продукт." }, { status: 400 });
  }

  if (parsed.data.wished) {
    const product = await db.product.findFirst({
      where: { id: parsed.data.productId, active: true, status: "ACTIVE" },
      select: { id: true },
    });
    if (!product) return NextResponse.json({ error: "Продуктът не е намерен." }, { status: 404 });
    await db.wishlist.upsert({
      where: { userId_productId: { userId, productId: product.id } },
      update: {},
      create: { userId, productId: product.id },
    });
  } else {
    await db.wishlist.deleteMany({
      where: { userId, productId: parsed.data.productId },
    });
  }

  return NextResponse.json({ wished: parsed.data.wished });
}
