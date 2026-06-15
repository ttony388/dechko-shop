import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const [orders, wishlist, addresses] = await Promise.all([
    db.order.count({ where: { userId: session.user.id } }),
    db.wishlist.count({ where: { userId: session.user.id } }),
    db.address.count({ where: { userId: session.user.id } }),
  ]);
  const cards = [
    [Package, orders, "Поръчки", "/account/orders"],
    [Heart, wishlist, "Любими", "/wishlist"],
    [MapPin, addresses, "Адреси", "/account/addresses"],
  ] as const;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(([Icon, number, label, href]) => (
          <Link
            href={href}
            key={label}
            className="rounded-[1.8rem] bg-white p-6 transition hover:-translate-y-1 hover:shadow-soft"
          >
            <Icon className="mb-6 text-coral" />
            <p className="text-3xl font-black">{number}</p>
            <p className="text-sm font-bold text-ink/45">{label}</p>
          </Link>
        ))}
      </div>
      <div className="mt-5 rounded-[1.8rem] bg-turquoise p-7 text-white">
        <h2 className="text-2xl font-black">Нова колекция за навън</h2>
        <p className="mt-2 text-white/75">Повече движение, повече смях.</p>
        <Link
          href="/category/outdoor"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-ink"
        >
          Разгледай <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
