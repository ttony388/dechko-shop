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

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Този имейл вече е регистриран." }, { status: 409 });
  }

  try {
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
      await db.user.delete({ where: { id: user.id } }).catch(() => undefined);
      throw emailError;
    }

    return NextResponse.json(
      {
        message: "Регистрацията е успешна! Изпратихме линк за потвърждение на вашия имейл.",
        email: user.email,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Този имейл вече е регистриран." }, { status: 409 });
    }
    console.error("Registration failed", error);
    return NextResponse.json(
      { error: "Възникна проблем при регистрацията. Моля, опитайте отново." },
      { status: 500 },
    );
  }
}
