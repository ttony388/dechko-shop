import { Package } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

const statusLabels = {
  PENDING: "Очаква плащане",
  PAID: "Платена",
  PROCESSING: "Обработва се",
  SHIPPED: "Изпратена",
  DELIVERED: "Доставена",
  CANCELLED: "Отказана",
  REFUNDED: "Възстановена",
} as const;

export default async function OrdersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: { items: { select: { id: true, name: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="rounded-[1.8rem] bg-white p-6 md:p-8">
      <h2 className="mb-6 text-2xl font-black">Поръчки</h2>
      {orders.length ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <details key={order.id} className="group rounded-2xl bg-cream p-5">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-black">{order.number}</p>
                  <p className="text-xs font-bold text-ink/45">
                    {new Intl.DateTimeFormat("bg-BG", { dateStyle: "medium" }).format(order.createdAt)}
                  </p>
                </div>
                <span className="rounded-full bg-lime/20 px-3 py-1 text-xs font-black">
                  {statusLabels[order.status]}
                </span>
                <p className="font-black">{formatPrice(Number(order.total))}</p>
                <span className="text-sm font-black text-turquoise-dark group-open:hidden">
                  Детайли
                </span>
              </summary>
              <div className="mt-4 border-t border-ink/10 pt-4">
                {order.items.map((item) => (
                  <p key={item.id} className="flex justify-between py-1 text-sm font-semibold text-ink/60">
                    <span>{item.quantity} × {item.name}</span>
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-cream p-10 text-center">
          <Package className="mx-auto text-coral" size={38} />
          <h3 className="mt-4 text-xl font-black">Все още няма поръчки.</h3>
          <p className="mt-1 text-sm font-semibold text-ink/50">
            След първата покупка номерът и статусът ще се появят тук.
          </p>
        </div>
      )}
    </section>
  );
}
