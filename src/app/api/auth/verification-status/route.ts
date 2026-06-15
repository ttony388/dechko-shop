import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resendVerificationSchema } from "@/lib/auth-validation";

export async function POST(request: Request) {
  const parsed = resendVerificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ requiresVerification: false });

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { emailVerified: true },
  });
  return NextResponse.json({ requiresVerification: user?.emailVerified === false });
}
