import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { categoryInputSchema } from "@/lib/admin-inputs";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  const parsed = categoryInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Проверете данните." }, { status: 400 });
  try {
    return NextResponse.json(
      await db.category.update({ where: { id: (await params).id }, data: parsed.data }),
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Този slug вече се използва." }, { status: 409 });
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
  const products = await db.product.count({
    where: { OR: [{ categoryId: id }, { categories: { some: { categoryId: id } } }] },
  });
  if (products > 0) {
    return NextResponse.json(
      { error: "Категорията има продукти. Преместете ги преди изтриване." },
      { status: 409 },
    );
  }
  await db.category.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
