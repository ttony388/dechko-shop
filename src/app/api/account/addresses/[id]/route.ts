import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/account";
import { addressSchema } from "@/lib/address-validation";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Необходим е вход." }, { status: 401 });

  const id = (await params).id;
  const parsed = addressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверете данните за адреса." }, { status: 400 });
  }
  const existing = await db.address.findFirst({
    where: { id, userId },
    select: { id: true, isDefault: true },
  });
  if (!existing) return NextResponse.json({ error: "Адресът не е намерен." }, { status: 404 });
  const isDefault = existing.isDefault || parsed.data.isDefault;

  const address = await db.$transaction(async (transaction) => {
    if (isDefault) {
      await transaction.address.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return transaction.address.update({
      where: { id },
      data: { ...parsed.data, line2: parsed.data.line2 || null, isDefault },
    });
  });
  return NextResponse.json(address);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Необходим е вход." }, { status: 401 });

  const id = (await params).id;
  const existing = await db.address.findFirst({
    where: { id, userId },
    select: { id: true, isDefault: true },
  });
  if (!existing) return NextResponse.json({ error: "Адресът не е намерен." }, { status: 404 });

  await db.$transaction(async (transaction) => {
    await transaction.address.delete({ where: { id } });
    if (existing.isDefault) {
      const next = await transaction.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (next) {
        await transaction.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  });
  return new NextResponse(null, { status: 204 });
}
