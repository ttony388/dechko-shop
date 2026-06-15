import { AdminCustomers } from "@/components/admin-customers";
import { db } from "@/lib/db";

const revenueStatuses = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export default async function AdminCustomersPage() {
  const customers = await db.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      orders: {
        where: { status: { in: [...revenueStatuses] } },
        select: { total: true },
      },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminCustomers
      initialCustomers={customers.map((customer) => ({
        id: customer.id,
        name: customer.name || "Без име",
        email: customer.email,
        orderCount: customer._count.orders,
        orderTotal: customer.orders.reduce((sum, order) => sum + Number(order.total), 0),
        failedDeliveries: customer.failedDeliveries,
        blocked: customer.blocked,
        createdAt: customer.createdAt.toISOString(),
      }))}
    />
  );
}
