import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/auth-validation";
import { createVerificationToken, sendVerificationEmail } from "@/lib/email-verification";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверете името, имейла и паролата. Паролата трябва да е поне 8 символа." },
      { status: 400 },
    );
  }

  try {
    const existing = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { email: true, emailVerified: true },
    });
    if (existing) {
      return duplicateRegistrationResponse(existing.email, existing.emailVerified);
    }

    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: await hash(parsed.data.password, 12),
        emailVerified: false,
      },
      select: { id: true, email: true, name: true },
    });

    try {
      const verification = await createVerificationToken(user.id);
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        verificationUrl: verification.url,
      });
    } catch (emailError) {
      await db.verificationToken.deleteMany({ where: { userId: user.id } }).catch(() => undefined);
      console.error("Registration email failed", emailError);
      return NextResponse.json(
        {
          message:
            "Профилът е създаден, но не успяхме да изпратим линка за потвърждение. Моля, опитайте да го изпратите отново.",
          email: user.email,
          emailSent: false,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        message: "Регистрацията е успешна! Изпратихме линк за потвърждение на вашия имейл.",
        email: user.email,
        emailSent: true,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await db.user.findUnique({
        where: { email: parsed.data.email },
        select: { email: true, emailVerified: true },
      });
      if (existing) {
        return duplicateRegistrationResponse(existing.email, existing.emailVerified);
      }
    }
    console.error("Registration failed", error);
    return NextResponse.json(
      { error: "Възникна проблем при регистрацията. Моля, опитайте отново." },
      { status: 500 },
    );
  }
}

function duplicateRegistrationResponse(email: string, emailVerified: boolean) {
  return NextResponse.json(
    emailVerified
      ? { error: "Този имейл вече е регистриран." }
      : {
          error: "Профилът вече съществува, но имейлът още не е потвърден.",
          email,
          requiresVerification: true,
        },
    { status: 409 },
  );
}
