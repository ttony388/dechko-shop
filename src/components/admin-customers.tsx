"use client";

import { Ban, Gift, PackageX, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  orderTotal: number;
  failedDeliveries: number;
  blocked: boolean;
  createdAt: string;
};

export function AdminCustomers({ initialCustomers }: { initialCustomers: CustomerRow[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter(
      (customer) =>
        !query ||
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query),
    );
  }, [customers, search]);

  async function updateCustomer(id: string, body: { blocked?: boolean; addFailedDelivery?: boolean }) {
    const response = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json().catch(() => null)) as {
      error?: string;
      blocked?: boolean;
      failedDeliveries?: number;
    } | null;
    if (!response.ok || !result) {
      window.alert(result?.error || "Клиентът не беше обновен.");
      return;
    }
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === id
          ? {
              ...customer,
              blocked: Boolean(result.blocked),
              failedDeliveries: Number(result.failedDeliveries),
            }
          : customer,
      ),
    );
  }

  async function generateCoupon(customer: CustomerRow) {
    const percent = Number(window.prompt("Процент отстъпка: 5 или 10", "5"));
    if (percent !== 5 && percent !== 10) return;
    const response = await fetch(`/api/admin/customers/${customer.id}/coupon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percent }),
    });
    const body = (await response.json().catch(() => null)) as { code?: string; error?: string } | null;
    window.alert(response.ok ? `Създаден купон: ${body?.code}` : body?.error || "Купонът не беше създаден.");
  }

  return (
    <section className="overflow-hidden rounded-[1.6rem] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div><h2 className="text-2xl font-black">Клиенти</h2><p className="mt-1 text-sm font-bold text-ink/45">{filtered.length} клиента</p></div>
        <label className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" size={17} />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Търси по име или имейл..." className="pl-11" />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wider text-ink/45">
            <tr><th className="px-6 py-4">Клиент</th><th className="px-6 py-4">Поръчки</th><th className="px-6 py-4">Общо</th><th className="px-6 py-4">Непотърсени</th><th className="px-6 py-4">Статус</th><th className="px-6 py-4">Действия</th></tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.id} className="border-t border-ink/5">
                <td className="px-6 py-4"><p className="font-black">{customer.name}</p><p className="text-xs text-ink/45">{customer.email}</p></td>
                <td className="px-6 py-4 font-black">{customer.orderCount}</td>
                <td className="px-6 py-4 font-black">{formatPrice(customer.orderTotal)}</td>
                <td className="px-6 py-4"><span className={customer.failedDeliveries >= 3 ? "font-black text-coral" : "font-bold"}>{customer.failedDeliveries} / 3</span></td>
                <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${customer.blocked ? "bg-coral/10 text-coral" : "bg-lime/20"}`}>{customer.blocked ? "Блокиран" : "Активен"}</span></td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button onClick={() => updateCustomer(customer.id, { addFailedDelivery: true })} title="Добави непотърсена пратка"><PackageX size={18} /></button>
                    <button onClick={() => updateCustomer(customer.id, { blocked: !customer.blocked })} title={customer.blocked ? "Разблокирай" : "Блокирай"}>{customer.blocked ? <ShieldCheck size={18} /> : <Ban size={18} />}</button>
                    <button onClick={() => generateCoupon(customer)} disabled={customer.orderCount <= 5} className="text-turquoise-dark disabled:opacity-25" title="Генерирай еднократен купон"><Gift size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
