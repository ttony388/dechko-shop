import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Регистрацията временно не е достъпна." },
        { status: 503 },
      );
    }

    const data = schema.parse(await request.json());
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Този имейл вече е регистриран." },
        { status: 409 },
      );
    }

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: await hash(data.password, 12),
      },
      select: { id: true, email: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Този имейл вече е регистриран." },
        { status: 409 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Проверете името, имейла и паролата." },
        { status: 400 },
      );
    }

    console.error("Registration failed", error);
    return NextResponse.json(
      { error: "Възникна проблем при регистрацията." },
      { status: 500 },
    );
  }
}
