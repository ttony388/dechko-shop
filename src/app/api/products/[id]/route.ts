import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await auth();
  return session?.user.role === "ADMIN";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  }
  return NextResponse.json(
    await db.product.update({
      where: { id: (await params).id },
      data: updateSchema.parse(await request.json()),
    }),
  );
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  }
  await db.product.delete({ where: { id: (await params).id } });
  revalidatePath("/");
  revalidatePath("/shop");
  return new NextResponse(null, { status: 204 });
}
