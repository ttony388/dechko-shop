import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

const categorySchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  description: z.string().trim().nullable().optional(),
  color: z.string().trim().nullable().optional(),
});

export async function GET() {
  const categories = await db.category.findMany({
    include: { _count: { select: { productCategories: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  }
  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверете данните за категорията." }, { status: 400 });
  }
  return NextResponse.json(await db.category.create({ data: parsed.data }), { status: 201 });
}
