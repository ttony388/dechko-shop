import { NextResponse } from "next/server";
import { z } from "zod";
import { categories } from "@/lib/products";
import { db } from "@/lib/db";
export async function GET() { return NextResponse.json(process.env.DATABASE_URL ? await db.category.findMany({ include: { _count: { select: { products: true } } } }) : categories); }
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const data = z.object({ name: z.string().min(2), slug: z.string().min(2), description: z.string().optional(), color: z.string().optional() }).parse(await request.json());
  return NextResponse.json(await db.category.create({ data }), { status: 201 });
}
