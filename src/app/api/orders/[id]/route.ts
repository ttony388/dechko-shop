import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

const orderStatus = z.enum([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  }
  const parsed = orderStatus.safeParse((await request.json().catch(() => null))?.status);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалиден статус." }, { status: 400 });
  }
  const id = (await params).id;
  try {
    const order = await db.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!current) return null;

      if (parsed.data === "CANCELLED" && current.status !== "CANCELLED") {
        const cancelled = await transaction.order.updateMany({
          where: { id, status: current.status },
          data: { status: "CANCELLED" },
        });
        if (!cancelled.count) throw new Error("ORDER_CHANGED");
        for (const item of current.items) {
          await transaction.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        return transaction.order.findUnique({ where: { id } });
      }

      if (current.status === "CANCELLED" && parsed.data !== "CANCELLED") {
        for (const item of current.items) {
          const reserved = await transaction.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (!reserved.count) throw new Error("INSUFFICIENT_STOCK");
        }
        if (current.couponId) {
          await transaction.coupon.update({
            where: { id: current.couponId },
            data: { usageCount: { increment: 1 } },
          });
        }
      }

      return transaction.order.update({ where: { id }, data: { status: parsed.data } });
    });
    return order
      ? NextResponse.json(order)
      : NextResponse.json({ error: "Поръчката не е намерена." }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "Няма достатъчна наличност за повторно активиране на поръчката." },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message === "ORDER_CHANGED") {
      return NextResponse.json(
        { error: "Поръчката беше променена. Обновете страницата и опитайте отново." },
        { status: 409 },
      );
    }
    throw error;
  }
}
