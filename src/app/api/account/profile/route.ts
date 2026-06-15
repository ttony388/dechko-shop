import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId, splitName } from "@/lib/account";
import { db } from "@/lib/db";

const profileSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().max(80),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Необходим е вход." }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (!user) return NextResponse.json({ error: "Профилът не е намерен." }, { status: 404 });

  return NextResponse.json({ ...splitName(user.name), email: user.email });
}

export async function PATCH(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Необходим е вход." }, { status: 401 });

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверете въведените имена." }, { status: 400 });
  }

  const name = [parsed.data.firstName, parsed.data.lastName].filter(Boolean).join(" ");
  const user = await db.user.update({
    where: { id: userId },
    data: { name },
    select: { name: true, email: true },
  });
  return NextResponse.json({ ...splitName(user.name), email: user.email });
}
