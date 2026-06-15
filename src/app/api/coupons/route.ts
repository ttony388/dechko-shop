import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await db.coupon.findMany({ where: { active: true } }));
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  }
  const parsed = z.object({
    code: z.string().trim().min(3),
    value: z.number().positive(),
    type: z.string().default("percent"),
    active: z.boolean().default(true),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни за купон." }, { status: 400 });
  }
  return NextResponse.json(await db.coupon.create({ data: parsed.data }), { status: 201 });
}
