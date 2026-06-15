import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  const parsed = z.object({ percent: z.union([z.literal(5), z.literal(10)]) }).safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return NextResponse.json({ error: "Изберете 5% или 10%." }, { status: 400 });

  const id = (await params).id;
  const customer = await db.user.findUnique({
    where: { id, role: "CUSTOMER" },
    select: { id: true, name: true, _count: { select: { orders: true } } },
  });
  if (!customer) return NextResponse.json({ error: "Клиентът не е намерен." }, { status: 404 });
  if (customer._count.orders <= 5) {
    return NextResponse.json({ error: "Клиентът трябва да има повече от 5 поръчки." }, { status: 409 });
  }

  const code = `LOYAL${parsed.data.percent}-${customer.id.slice(-5).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const coupon = await db.coupon.create({
    data: {
      code,
      type: "percent",
      value: parsed.data.percent,
      usageLimit: 1,
      active: true,
      assignedUserId: customer.id,
    },
  });
  return NextResponse.json({ ...coupon, value: Number(coupon.value) }, { status: 201 });
}
