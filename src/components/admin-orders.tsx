"use client";

import { Eye, Save, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

type Address = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
};

type OrderRow = {
  id: string;
  number: string;
  email: string;
  customerName: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: "CARD" | "CASH_ON_DELIVERY";
  createdAt: string;
  shippingAddress: Address;
  couponCode: string | null;
  items: { id: string; name: string; sku: string; price: number; quantity: number }[];
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Очаква плащане",
  PAID: "Платена",
  PROCESSING: "Обработва се",
  SHIPPED: "Изпратена",
  DELIVERED: "Доставена",
  CANCELLED: "Отказана",
  REFUNDED: "Възстановена",
};

export function AdminOrders({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, OrderStatus>>({});
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter(
      (order) =>
        order.number.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query),
    );
  }, [orders, search]);

  async function saveStatus(order: OrderRow) {
    const status = draftStatuses[order.id] || order.status;
    setSavingId(order.id);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        window.alert(body?.error || "Статусът не беше запазен.");
        return;
      }
      setOrders((current) =>
        current.map((candidate) => (candidate.id === order.id ? { ...candidate, status } : candidate)),
      );
      setDraftStatuses((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-[1.6rem] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-2xl font-black">Поръчки</h2>
            <p className="mt-1 text-sm font-bold text-ink/45">{filtered.length} поръчки</p>
          </div>
          <label className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" size={17} />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Търси по номер, име или имейл..."
              className="pl-11"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-wider text-ink/45">
              <tr>
                <th className="px-6 py-4">Номер</th>
                <th className="px-6 py-4">Клиент</th>
                <th className="px-6 py-4">Дата</th>
                <th className="px-6 py-4">Сума</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const status = draftStatuses[order.id] || order.status;
                return (
                  <tr key={order.id} className="border-t border-ink/5">
                    <td className="px-6 py-4">
                      <button onClick={() => setSelected(order)} className="font-black text-turquoise-dark hover:underline">
                        {order.number}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black">{order.customerName}</p>
                      <p className="text-xs text-ink/45">{order.email}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-ink/55">
                      {new Intl.DateTimeFormat("bg-BG", { dateStyle: "medium" }).format(new Date(order.createdAt))}
                    </td>
                    <td className="px-6 py-4 font-black">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={status}
                        onChange={(event) =>
                          setDraftStatuses((current) => ({
                            ...current,
                            [order.id]: event.target.value as OrderStatus,
                          }))
                        }
                        className="h-10 rounded-xl border border-ink/10 bg-cream px-3 font-bold outline-none"
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => setSelected(order)} aria-label="Детайли"><Eye size={18} /></button>
                        <button
                          onClick={() => saveStatus(order)}
                          disabled={savingId === order.id || status === order.status}
                          className="disabled:opacity-25"
                          aria-label="Запази статус"
                        >
                          <Save size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <p className="p-10 text-center font-bold text-ink/45">Няма намерени поръчки.</p>}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[2rem] bg-white p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow text-coral">Поръчка</p>
                <h2 className="mt-2 text-2xl font-black">{selected.number}</h2>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Затвори"><X /></button>
            </div>
            <div className="mt-6 grid gap-4 rounded-2xl bg-cream p-5 sm:grid-cols-2">
              <Detail label="Клиент" value={selected.customerName} />
              <Detail label="Имейл" value={selected.email} />
              <Detail label="Телефон" value={selected.shippingAddress.phone || "-"} />
              <Detail
                label="Плащане"
                value={selected.paymentMethod === "CASH_ON_DELIVERY" ? "Наложен платеж" : "Банкова карта"}
              />
              <Detail
                label="Адрес"
                value={[
                  selected.shippingAddress.line1,
                  selected.shippingAddress.line2,
                  selected.shippingAddress.postalCode,
                  selected.shippingAddress.city,
                ].filter(Boolean).join(", ")}
              />
              <Detail label="Статус" value={statusLabels[selected.status]} />
            </div>
            <h3 className="mt-6 text-lg font-black">Продукти</h3>
            <div className="mt-3 divide-y divide-ink/5 rounded-2xl border border-ink/10">
              {selected.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 p-4 text-sm">
                  <div><p className="font-black">{item.name}</p><p className="text-xs text-ink/45">{item.sku} · {item.quantity} бр.</p></div>
                  <p className="font-black">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="ml-auto mt-5 max-w-xs space-y-2 text-sm">
              <Total label="Междинна сума" value={selected.subtotal} />
              <Total label="Отстъпка" value={-selected.discount} />
              <Total label="Доставка" value={selected.shipping} />
              <Total label="Общо" value={selected.total} strong />
              {selected.couponCode && <p className="text-right text-xs font-bold text-ink/45">Купон: {selected.couponCode}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold uppercase tracking-wide text-ink/40">{label}</p><p className="mt-1 font-black">{value || "-"}</p></div>;
}

function Total({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex justify-between gap-6 ${strong ? "border-t border-ink/10 pt-3 text-lg font-black" : ""}`}><span>{label}</span><span>{formatPrice(value)}</span></div>;
}
