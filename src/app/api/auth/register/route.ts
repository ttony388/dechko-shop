import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/auth-validation";
import {
  createVerificationToken,
  isEmailVerificationRequired,
  sendVerificationEmail,
} from "@/lib/email-verification";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверете името, имейла и паролата. Паролата трябва да е поне 8 символа." },
      { status: 400 },
    );
  }

  try {
    const verificationRequired = isEmailVerificationRequired();
    const existing = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true, emailVerified: true },
    });
    if (existing) {
      if (!existing.emailVerified && !verificationRequired) {
        await db.$transaction([
          db.user.update({
            where: { id: existing.id },
            data: {
              name: parsed.data.name,
              password: await hash(parsed.data.password, 12),
              emailVerified: true,
            },
          }),
          db.verificationToken.deleteMany({ where: { userId: existing.id } }),
        ]);
        return registrationSuccessResponse(existing.email, false);
      }
      return duplicateRegistrationResponse(existing.email, existing.emailVerified);
    }

    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: await hash(parsed.data.password, 12),
        emailVerified: !verificationRequired,
      },
      select: { id: true, email: true, name: true },
    });

    if (!verificationRequired) {
      return registrationSuccessResponse(user.email, false);
    }

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
          verificationRequired: true,
        },
        { status: 201 },
      );
    }

    return registrationSuccessResponse(user.email, true);
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

function registrationSuccessResponse(email: string, verificationRequired: boolean) {
  return NextResponse.json(
    {
      message: verificationRequired
        ? "Регистрацията е успешна! Изпратихме линк за потвърждение на вашия имейл."
        : "Регистрацията е успешна! Профилът ви е активен.",
      email,
      emailSent: verificationRequired,
      verificationRequired,
    },
    { status: 201 },
  );
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
