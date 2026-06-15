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
  paymentMethod: z.enum(["CARD", "CASH_ON_DELIVERY"]).default("CARD"),
});

export async function createCheckoutOrder(
  input: unknown,
  userId: string | null,
  requestUrl = "http://localhost/api/checkout",
) {
  try {
    const body = bodySchema.parse(input);
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
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
    if (body.paymentMethod === "CARD" && !stripeSecretKey) {
      return NextResponse.json(
        { error: "Плащането с карта временно не е достъпно. Изберете наложен платеж." },
        { status: 503 },
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
            AND: [
              { OR: [{ assignedUserId: null }, { assignedUserId: userId || "__guest__" }] },
              { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
            ],
          },
        })
      : null;
    if (body.coupon && !coupon) {
      return NextResponse.json({ error: "Купонът е невалиден или не е предназначен за този профил." }, { status: 400 });
    }
    if (coupon?.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Лимитът за използване на купона е достигнат." }, { status: 400 });
    }
    if (coupon?.minOrder && subtotal < Number(coupon.minOrder)) {
      return NextResponse.json(
        { error: `Минималната стойност за този купон е ${Number(coupon.minOrder).toFixed(2)} €.` },
        { status: 400 },
      );
    }
    const discount = coupon
      ? coupon.type === "percent"
        ? subtotal * (Number(coupon.value) / 100)
        : Math.min(subtotal, Number(coupon.value))
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
          status:
            body.paymentMethod === "CASH_ON_DELIVERY" ? "PROCESSING" : "PENDING",
          subtotal,
          discount,
          shipping,
          total,
          currency: "EUR",
          paymentMethod: body.paymentMethod,
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

      for (const item of body.items) {
        const updated = await transaction.product.updateMany({
          where: { id: item.product.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) throw new Error("INSUFFICIENT_STOCK");
      }

      if (coupon) {
        if (coupon.usageLimit) {
          const claimed = await transaction.coupon.updateMany({
            where: { id: coupon.id, active: true, usageCount: { lt: coupon.usageLimit } },
            data: { usageCount: { increment: 1 } },
          });
          if (!claimed.count) throw new Error("COUPON_EXHAUSTED");
        } else {
          await transaction.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } },
          });
        }
      }
      return created;
    });

    if (body.paymentMethod === "CASH_ON_DELIVERY") {
      return NextResponse.json({ orderId: order.number });
    }

    try {
      const stripe = new Stripe(stripeSecretKey!);
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
      await db.$transaction(async (transaction) => {
        const cancelled = await transaction.order.updateMany({
          where: { id: order.id, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
        if (!cancelled.count) return;
        for (const item of body.items) {
          await transaction.product.update({
            where: { id: item.product.id },
            data: { stock: { increment: item.quantity } },
          });
        }
        if (coupon) {
          await transaction.coupon.updateMany({
            where: { id: coupon.id, usageCount: { gt: 0 } },
            data: { usageCount: { decrement: 1 } },
          });
        }
      }).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "COUPON_EXHAUSTED") {
      return NextResponse.json({ error: "Лимитът за използване на купона е достигнат." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "Някой от продуктите вече не е наличен в желаното количество." },
        { status: 409 },
      );
    }
    console.error("Checkout failed", error);
    return NextResponse.json({ error: "Неуспешно създаване на поръчка." }, { status: 400 });
  }
}
