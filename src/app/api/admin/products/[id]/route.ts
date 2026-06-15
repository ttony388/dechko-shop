import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { archiveProduct, updateProduct } from "@/lib/product-admin";
import { productInputSchema } from "@/lib/product-input";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  }
  const parsed = productInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Проверете задължителните полета." },
      { status: 400 },
    );
  }
  try {
    const product = await updateProduct((await params).id, parsed.data);
    return product
      ? NextResponse.json(product)
      : NextResponse.json({ error: "Продуктът не е намерен." }, { status: 404 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Slug, SKU или SKU на вариант вече съществува." }, { status: 409 });
    }
    console.error("Update product failed", error);
    return NextResponse.json({ error: "Продуктът не беше обновен." }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  }
  const product = await archiveProduct((await params).id);
  return product
    ? NextResponse.json({ message: "Продуктът беше изтрит успешно." })
    : NextResponse.json({ error: "Продуктът не е намерен." }, { status: 404 });
}
