import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { createProduct } from "@/lib/product-admin";
import { productInputSchema } from "@/lib/product-input";

export async function POST(request: Request) {
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
    return NextResponse.json(await createProduct(parsed.data), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Slug, SKU или SKU на вариант вече съществува." }, { status: 409 });
    }
    console.error("Create product failed", error);
    return NextResponse.json({ error: "Продуктът не беше записан." }, { status: 500 });
  }
}
