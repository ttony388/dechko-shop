import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  const parsed = z.object({ stock: z.number().int().nonnegative() }).safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return NextResponse.json({ error: "Наличността трябва да е положително цяло число." }, { status: 400 });
  return NextResponse.json(
    await db.product.update({
      where: { id: (await params).id },
      data: { stock: parsed.data.stock },
      select: { id: true, stock: true },
    }),
  );
}
