import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/email-verification";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json(
      { status: "invalid", error: "Линкът за потвърждение е невалиден." },
      { status: 400 },
    );
  }

  const result = await verifyEmailToken(token);
  if (result.status === "verified") {
    return NextResponse.json({
      status: "verified",
      message: "Имейлът е потвърден успешно. Вече можете да влезете в профила си.",
    });
  }
  if (result.status === "expired") {
    return NextResponse.json(
      {
        status: "expired",
        email: result.email,
        error: "Линкът е изтекъл. Моля, изпратете нов линк за потвърждение.",
      },
      { status: 410 },
    );
  }
  return NextResponse.json(
    { status: "invalid", error: "Линкът за потвърждение е невалиден или вече е използван." },
    { status: 400 },
  );
}
