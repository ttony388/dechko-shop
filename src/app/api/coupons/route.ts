import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
export async function GET() { return NextResponse.json(process.env.DATABASE_URL ? await db.coupon.findMany() : [{ code: "DECHKO10", value: 10, active: true }]); }
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const data = z.object({ code: z.string().min(3), value: z.number().positive(), type: z.string().default("percent"), active: z.boolean().default(true) }).parse(await request.json());
  return NextResponse.json(await db.coupon.create({ data }), { status: 201 });
}
