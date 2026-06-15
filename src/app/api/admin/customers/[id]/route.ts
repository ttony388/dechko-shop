import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

const customerUpdateSchema = z.object({
  blocked: z.boolean().optional(),
  addFailedDelivery: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  const parsed = customerUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });

  const id = (await params).id;
  const customer = await db.user.findUnique({
    where: { id, role: "CUSTOMER" },
    select: { failedDeliveries: true, blocked: true },
  });
  if (!customer) return NextResponse.json({ error: "Клиентът не е намерен." }, { status: 404 });

  const failedDeliveries = customer.failedDeliveries + (parsed.data.addFailedDelivery ? 1 : 0);
  const blocked =
    parsed.data.blocked === undefined
      ? customer.blocked || failedDeliveries >= 3
      : parsed.data.blocked;

  return NextResponse.json(
    await db.user.update({
      where: { id },
      data: { failedDeliveries, blocked },
      select: { id: true, blocked: true, failedDeliveries: true },
    }),
  );
}
