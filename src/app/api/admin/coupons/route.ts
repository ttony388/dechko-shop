import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { couponInputSchema } from "@/lib/admin-inputs";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  const parsed = couponInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Проверете данните за купона." }, { status: 400 });
  try {
    const coupon = await db.coupon.create({
      data: {
        ...parsed.data,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });
    return NextResponse.json(serializeCoupon(coupon), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Купон с този код вече съществува." }, { status: 409 });
    }
    throw error;
  }
}

function serializeCoupon(coupon: {
  id: string;
  code: string;
  type: string;
  value: Prisma.Decimal;
  minOrder: Prisma.Decimal | null;
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
  expiresAt: Date | null;
  assignedUserId: string | null;
}) {
  return {
    ...coupon,
    value: Number(coupon.value),
    minOrder: coupon.minOrder === null ? null : Number(coupon.minOrder),
    expiresAt: coupon.expiresAt?.toISOString() || null,
  };
}
