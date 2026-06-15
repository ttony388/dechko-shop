import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/account";
import { addressSchema } from "@/lib/address-validation";
import { db } from "@/lib/db";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Необходим е вход." }, { status: 401 });

  return NextResponse.json(
    await db.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
  );
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Необходим е вход." }, { status: 401 });

  const parsed = addressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверете данните за адреса." }, { status: 400 });
  }

  const count = await db.address.count({ where: { userId } });
  const isDefault = parsed.data.isDefault || count === 0;
  const address = await db.$transaction(async (transaction) => {
    if (isDefault) {
      await transaction.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return transaction.address.create({
      data: { ...parsed.data, line2: parsed.data.line2 || null, isDefault, userId },
    });
  });

  return NextResponse.json(address, { status: 201 });
}
