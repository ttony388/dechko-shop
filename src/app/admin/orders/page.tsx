import { Prisma } from "@prisma/client";
import { AdminOrders } from "@/components/admin-orders";
import { db } from "@/lib/db";

type ShippingAddress = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
};

function asAddress(value: Prisma.JsonValue): ShippingAddress {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ShippingAddress)
    : {};
}

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    include: {
      user: { select: { name: true } },
      coupon: { select: { code: true } },
      items: { orderBy: { id: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminOrders
      initialOrders={orders.map((order) => {
        const address = asAddress(order.shippingAddress);
        return {
          id: order.id,
          number: order.number,
          email: order.email,
          customerName:
            order.user?.name ||
            [address.firstName, address.lastName].filter(Boolean).join(" ") ||
            order.email,
          status: order.status,
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          shipping: Number(order.shipping),
          total: Number(order.total),
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt.toISOString(),
          shippingAddress: address,
          couponCode: order.coupon?.code || null,
          items: order.items.map((item) => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            price: Number(item.price),
            quantity: item.quantity,
          })),
        };
      })}
    />
  );
}
