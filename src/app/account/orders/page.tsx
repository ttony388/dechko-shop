import Link from "next/link";

const orders = [{ id: "DCH-2026-0142", date: "12 юни 2026", status: "Изпратена", total: "€78.40" }, { id: "DCH-2026-0098", date: "28 май 2026", status: "Доставена", total: "€42.90" }];
export default function OrdersPage() {
  return <section className="rounded-[1.8rem] bg-white p-6 md:p-8"><h2 className="mb-6 text-2xl font-black">Поръчки</h2><div className="space-y-3">{orders.map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-cream p-5"><div><p className="font-black">{order.id}</p><p className="text-xs font-bold text-ink/45">{order.date}</p></div><span className="rounded-full bg-lime/20 px-3 py-1 text-xs font-black">{order.status}</span><p className="font-black">{order.total}</p><Link href="#" className="text-sm font-black text-turquoise-dark">Детайли</Link></div>)}</div></section>;
}
