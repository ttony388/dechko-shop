import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCheckoutOrder } from "@/lib/checkout";

export async function POST(request: Request) {
  try {
    const session = await auth();
    return await createCheckoutOrder(
      await request.json(),
      session?.user?.id || null,
      request.url,
    );
  } catch (error) {
    console.error("Checkout failed", error);
    return NextResponse.json({ error: "Неуспешно създаване на поръчка." }, { status: 400 });
  }
}
