import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resendVerificationSchema } from "@/lib/auth-validation";
import {
  canResendVerification,
  createVerificationToken,
  isEmailVerificationRequired,
  sendVerificationEmail,
} from "@/lib/email-verification";

export async function POST(request: Request) {
  const parsed = resendVerificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Въведете валиден имейл адрес." }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  if (!user || user.emailVerified) {
    return NextResponse.json({
      message: "Ако профилът очаква потвърждение, изпратихме нов линк.",
    });
  }
  if (!isEmailVerificationRequired()) {
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
      db.verificationToken.deleteMany({ where: { userId: user.id } }),
    ]);
    return NextResponse.json({
      message: "Профилът е активиран. Вече можете да влезете.",
    });
  }
  if (!(await canResendVerification(user.id))) {
    return NextResponse.json(
      { error: "Изчакайте една минута, преди да поискате нов линк." },
      { status: 429 },
    );
  }

  try {
    const verification = await createVerificationToken(user.id);
    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      verificationUrl: verification.url,
    });
    return NextResponse.json({ message: "Изпратихме нов линк за потвърждение." });
  } catch (error) {
    await db.verificationToken.deleteMany({ where: { userId: user.id } }).catch(() => undefined);
    console.error("Resend verification failed", error);
    return NextResponse.json(
      { error: "Не успяхме да изпратим имейла. Моля, опитайте отново." },
      { status: 500 },
    );
  }
}
