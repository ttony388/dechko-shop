import { AdminCoupons } from "@/components/admin-coupons";
import { db } from "@/lib/db";

export default async function AdminCouponsPage() {
  const coupons = await db.coupon.findMany({
    include: { assignedUser: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <AdminCoupons
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
