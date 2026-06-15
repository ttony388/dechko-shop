import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { db } from "@/lib/db";

const bodySchema = z.object({
  customer: z.object({ email: z.string().email() }).passthrough(),
  items: z.array(z.object({
    quantity: z.number().int().positive(),
    product: z.object({ id: z.string() }).passthrough(),
  })).min(1),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const ids = [...new Set(body.items.map((item) => item.product.id))];
    const products = await db.product.findMany({
      where: { id: { in: ids }, active: true, status: "ACTIVE" },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));
    const unavailable = body.items.find((item) => {
      const product = productMap.get(item.product.id);
      return !product || product.stock < item.quantity;
    });
    if (unavailable) {
      return NextResponse.json(
        { error: "Продукт в количката вече не е наличен в желаното количество." },
        { status: 409 },
      );
    }

    const orderId = `DCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ orderId, demo: true });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.customer.email,
      line_items: body.items.map(({ product: submitted, quantity }) => {
        const product = productMap.get(submitted.id)!;
        const image = product.images[0]?.url;
        return {
          quantity,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(Number(product.price) * 100),
            product_data: {
              name: product.name,
              ...(image ? { images: [image.startsWith("http") ? image : `${baseUrl}${image}`] } : {}),
            },
          },
        };
      }),
      success_url: `${baseUrl}/order-success?order=${orderId}`,
      cancel_url: `${baseUrl}/checkout`,
      metadata: { orderId },
      shipping_address_collection: { allowed_countries: ["BG", "RO", "GR"] },
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout failed", error);
    return NextResponse.json({ error: "Неуспешно създаване на плащане." }, { status: 400 });
  }
}
