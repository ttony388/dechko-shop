import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim().toUpperCase();
  const subtotal = Number(url.searchParams.get("subtotal"));
  if (!code || !Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: "Невалиден код." }, { status: 400 });
  }

  const coupon = await db.coupon.findFirst({
    where: {
      code,
      active: true,
      AND: [
        {
          OR: [
            { assignedUserId: null },
            { assignedUserId: session?.user?.id || "__guest__" },
          ],
        },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      ],
    },
  });
  if (!coupon || (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)) {
    return NextResponse.json({ error: "Невалиден или изчерпан купон." }, { status: 404 });
  }
  if (coupon.minOrder && subtotal < Number(coupon.minOrder)) {
    return NextResponse.json(
      { error: `Минималната стойност за този купон е ${Number(coupon.minOrder).toFixed(2)} €.` },
      { status: 409 },
    );
  }
  const discount =
    coupon.type === "percent"
      ? subtotal * (Number(coupon.value) / 100)
      : Math.min(subtotal, Number(coupon.value));
  return NextResponse.json({
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    discount: Number(discount.toFixed(2)),
  });
}
