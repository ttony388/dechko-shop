import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

const orderStatus = z.enum([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  }
  const parsed = orderStatus.safeParse((await request.json().catch(() => null))?.status);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалиден статус." }, { status: 400 });
  }
  return NextResponse.json(
    await db.order.update({
      where: { id: (await params).id },
      data: { status: parsed.data },
    }),
  );
}
