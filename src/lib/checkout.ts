import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { db } from "@/lib/db";

const customerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  address: z.string().trim().min(5),
  city: z.string().trim().min(2),
  postalCode: z.string().trim().min(3),
});

const bodySchema = z.object({
  customer: customerSchema,
  items: z.array(z.object({
    quantity: z.number().int().positive(),
    variant: z.string().optional(),
    product: z.object({ id: z.string() }).passthrough(),
  })).min(1),
  coupon: z.string().trim().optional().nullable(),
  saveAddress: z.boolean().optional().default(false),
});

export async function createCheckoutOrder(
  input: unknown,
  userId: string | null,
  requestUrl = "http://localhost/api/checkout",
) {
  try {
    const body = bodySchema.parse(input);
    const ids = [...new Set(body.items.map((item) => item.product.id))];
    const products = await db.product.findMany({
      where: { id: { in: ids }, active: true, status: "ACTIVE" },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: true,
      },
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

    const subtotal = body.items.reduce((sum, item) => {
      const product = productMap.get(item.product.id)!;
      return sum + Number(product.salePrice || product.price) * item.quantity;
    }, 0);
    const coupon = body.coupon
      ? await db.coupon.findFirst({
          where: {
            code: body.coupon.toUpperCase(),
            active: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        })
      : null;
    const discount = coupon
      ? coupon.type === "percent"
        ? subtotal * (Number(coupon.value) / 100)
        : Math.min(subtotal, Number(coupon.value))
      : body.coupon
        ? subtotal * 0.1
        : 0;
    const shipping = subtotal >= 60 ? 0 : 4.9;
    const total = subtotal - discount + shipping;
    const orderNumber = `DCH-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
    const shippingAddress = {
      firstName: body.customer.firstName,
      lastName: body.customer.lastName,
      phone: body.customer.phone,
      line1: body.customer.address,
      city: body.customer.city,
      postalCode: body.customer.postalCode,
      country: "BG",
    };

    const order = await db.$transaction(async (transaction) => {
      if (userId && body.saveAddress) {
        await transaction.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
        await transaction.address.create({
          data: {
            userId,
            label: "Дом",
            ...shippingAddress,
            isDefault: true,
          },
        });
      }

      const created = await transaction.order.create({
        data: {
          number: orderNumber,
          userId,
          email: body.customer.email,
          status: process.env.STRIPE_SECRET_KEY ? "PENDING" : "PROCESSING",
          subtotal,
          discount,
          shipping,
          total,
          currency: "EUR",
          shippingAddress,
          ...(coupon ? { couponId: coupon.id } : {}),
          items: {
            create: body.items.map((item) => {
              const product = productMap.get(item.product.id)!;
              const variant = item.variant
                ? product.variants.find((candidate) => candidate.value === item.variant)
                : undefined;
              return {
                productId: product.id,
                variantId: variant?.id,
                name: product.name,
                sku: variant?.sku || product.sku,
                price: Number(product.salePrice || variant?.price || product.price),
                quantity: item.quantity,
              };
            }),
          },
        },
      });

      if (coupon) {
        await transaction.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }
      return created;
    });

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ orderId: order.number, demo: true });
    }

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(requestUrl).origin;
      const stripeCoupon = discount > 0
        ? await stripe.coupons.create({
            amount_off: Math.round(discount * 100),
            currency: "eur",
            duration: "once",
            name: body.coupon ? `Код ${body.coupon.toUpperCase()}` : "Отстъпка",
          })
        : null;
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = body.items.map(
        ({ product: submitted, quantity }) => {
          const product = productMap.get(submitted.id)!;
          const image = product.images[0]?.url;
          return {
            quantity,
            price_data: {
              currency: "eur",
              unit_amount: Math.round(Number(product.salePrice || product.price) * 100),
              product_data: {
                name: product.name,
                ...(image
                  ? { images: [image.startsWith("http") ? image : `${baseUrl}${image}`] }
                  : {}),
              },
            },
          };
        },
      );
      if (shipping > 0) {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(shipping * 100),
            product_data: { name: "Доставка" },
          },
        });
      }
      const stripeSession = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: body.customer.email,
        line_items: lineItems,
        ...(stripeCoupon ? { discounts: [{ coupon: stripeCoupon.id }] } : {}),
        success_url: `${baseUrl}/order-success?order=${order.number}`,
        cancel_url: `${baseUrl}/checkout`,
        metadata: { orderId: order.id, orderNumber: order.number },
      });
      await db.order.update({
        where: { id: order.id },
        data: { stripeSessionId: stripeSession.id },
      });
      return NextResponse.json({ url: stripeSession.url, orderId: order.number });
    } catch (error) {
      await db.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      }).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    console.error("Checkout failed", error);
    return NextResponse.json({ error: "Неуспешно създаване на поръчка." }, { status: 400 });
  }
}
