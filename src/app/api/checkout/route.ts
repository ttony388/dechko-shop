import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
const bodySchema = z.object({ customer: z.object({ email: z.string().email() }).passthrough(), items: z.array(z.object({ quantity: z.number().int().positive(), product: z.object({ id: z.string(), name: z.string(), price: z.number().positive(), image: z.string() }).passthrough() })).min(1) });
export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const orderId = `DCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ orderId, demo: true });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.customer.email,
      line_items: body.items.map(({ product, quantity }) => ({ quantity, price_data: { currency: "eur", unit_amount: Math.round(product.price * 100), product_data: { name: product.name, images: product.image.startsWith("http") ? [product.image] : [`${baseUrl}${product.image}`] } } })),
      success_url: `${baseUrl}/order-success?order=${orderId}`,
      cancel_url: `${baseUrl}/checkout`,
      metadata: { orderId },
      shipping_address_collection: { allowed_countries: ["BG", "RO", "GR"] },
    });
    return NextResponse.json({ url: session.url });
  } catch { return NextResponse.json({ error: "Неуспешно създаване на плащане." }, { status: 400 }); }
}
