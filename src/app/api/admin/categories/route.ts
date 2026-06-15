import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { categoryInputSchema } from "@/lib/admin-inputs";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  const parsed = categoryInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Проверете данните." }, { status: 400 });
  try {
    return NextResponse.json(await db.category.create({ data: parsed.data }), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Този slug вече се използва." }, { status: 409 });
    }
    throw error;
  }
}
