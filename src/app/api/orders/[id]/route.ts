import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const status = z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).parse((await request.json()).status);
  return NextResponse.json(await db.order.update({ where: { id: (await params).id }, data: { status } }));
}
