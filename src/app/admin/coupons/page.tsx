import { AdminCoupons } from "@/components/admin-coupons";
import { db } from "@/lib/db";

export default async function AdminCouponsPage() {
  const [coupons, eligibleCustomers] = await Promise.all([
    db.coupon.findMany({
      include: { assignedUser: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      where: { role: "CUSTOMER", orders: { some: {} } },
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { orders: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);
  return (
    <AdminCoupons
      eligibleCustomers={eligibleCustomers
        .filter((customer) => customer._count.orders > 5)
        .map((customer) => ({
          id: customer.id,
          name: customer.name || customer.email,
          email: customer.email,
          orderCount: customer._count.orders,
        }))}
      initialCoupons={coupons.map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        minOrder: coupon.minOrder === null ? null : Number(coupon.minOrder),
        usageLimit: coupon.usageLimit,
        usageCount: coupon.usageCount,
        active: coupon.active,
        expiresAt: coupon.expiresAt?.toISOString() || null,
        assignedCustomer: coupon.assignedUser
          ? coupon.assignedUser.name || coupon.assignedUser.email
          : null,
      }))}
    />
  );
}
