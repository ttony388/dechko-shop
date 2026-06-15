import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { couponInputSchema } from "@/lib/admin-inputs";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  const parsed = couponInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Проверете данните за купона." }, { status: 400 });
  try {
    const coupon = await db.coupon.update({
      where: { id: (await params).id },
      data: {
        ...parsed.data,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });
    return NextResponse.json({
      ...coupon,
      value: Number(coupon.value),
      minOrder: coupon.minOrder === null ? null : Number(coupon.minOrder),
      expiresAt: coupon.expiresAt?.toISOString() || null,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Купон с този код вече съществува." }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  const id = (await params).id;
  const used = await db.order.count({ where: { couponId: id } });
  if (used > 0) {
    await db.coupon.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ archived: true });
  }
  await db.coupon.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
