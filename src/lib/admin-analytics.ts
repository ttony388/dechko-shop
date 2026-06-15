import { subDays, subMonths, subYears } from "date-fns";
import { db } from "@/lib/db";

export type AnalyticsPeriod = "7d" | "30d" | "6m" | "1y";

const validRevenueStatuses = ["PAID", "DELIVERED"] as const;

export function getPeriodStart(period: AnalyticsPeriod, now = new Date()) {
  if (period === "7d") return subDays(now, 6);
  if (period === "30d") return subDays(now, 29);
  if (period === "6m") return subMonths(now, 6);
  return subYears(now, 1);
}

export async function getAdminAnalytics(period: AnalyticsPeriod) {
  const start = getPeriodStart(period);
  const [orders, revenue, customers, products, lowStock, seriesOrders] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: start } } }),
    db.order.aggregate({
      where: { createdAt: { gte: start }, status: { in: [...validRevenueStatuses] } },
      _sum: { total: true },
    }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count({ where: { status: { not: "ARCHIVED" } } }),
    db.product.findMany({
      where: { status: { not: "ARCHIVED" }, stock: { lte: 7 } },
      select: { id: true, name: true, sku: true, stock: true },
      orderBy: { stock: "asc" },
      take: 20,
    }),
    db.order.findMany({
      where: {
        createdAt: { gte: start },
        status: { in: [...validRevenueStatuses] },
      },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const buckets = createBuckets(period, start);
  for (const order of seriesOrders) {
    const key = bucketKey(order.createdAt, period);
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) {
      bucket.revenue += Number(order.total);
      bucket.orders += 1;
    }
  }

  return {
    period,
    summary: {
      revenue: Number(revenue._sum.total || 0),
      orders,
      customers,
      products,
      lowStock: lowStock.length,
    },
    lowStock,
    series: buckets.map((bucket) => ({
      label: bucket.label,
      orders: bucket.orders,
      revenue: Number(bucket.revenue.toFixed(2)),
    })),
  };
}

function bucketKey(date: Date, period: AnalyticsPeriod) {
  if (period === "6m" || period === "1y") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  return date.toISOString().slice(0, 10);
}

function createBuckets(period: AnalyticsPeriod, start: Date) {
  const formatter =
    period === "6m" || period === "1y"
      ? new Intl.DateTimeFormat("bg-BG", { month: "short", year: "2-digit" })
      : new Intl.DateTimeFormat("bg-BG", { day: "2-digit", month: "2-digit" });
  const result: { key: string; label: string; revenue: number; orders: number }[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const now = new Date();

  while (cursor <= now) {
    const key = bucketKey(cursor, period);
    if (!result.some((item) => item.key === key)) {
      result.push({ key, label: formatter.format(cursor), revenue: 0, orders: 0 });
    }
    if (period === "6m" || period === "1y") cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}
