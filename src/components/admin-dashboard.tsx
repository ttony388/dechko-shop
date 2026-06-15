"use client";

import { ArrowUpRight, CircleDollarSign, Package, ShoppingCart, Users, X } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsPeriod } from "@/lib/admin-analytics";
import { formatPrice } from "@/lib/utils";

type Analytics = {
  period: AnalyticsPeriod;
  summary: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
    lowStock: number;
  };
  lowStock: { id: string; name: string; sku: string; stock: number }[];
  series: { label: string; revenue: number; orders: number }[];
};

const periodLabels: Record<AnalyticsPeriod, string> = {
  "7d": "7 дни",
  "30d": "30 дни",
  "6m": "6 месеца",
  "1y": "1 година",
};

export function AdminDashboard({
  initialData,
  analyticsOnly = false,
}: {
  initialData: Analytics;
  analyticsOnly?: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [lowStockOpen, setLowStockOpen] = useState(!analyticsOnly && initialData.lowStock.length > 0);

  async function changePeriod(period: AnalyticsPeriod) {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      if (response.ok) setData((await response.json()) as Analytics);
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    [CircleDollarSign, formatPrice(data.summary.revenue), "Приходи", "За избрания период"],
    [ShoppingCart, String(data.summary.orders), "Поръчки", periodLabels[data.period]],
    [Users, String(data.summary.customers), "Клиенти", "Регистрирани профили"],
    [Package, String(data.summary.products), "Продукти", `${data.summary.lowStock} ниска наличност`],
  ] as const;

  return (
    <>
      {!analyticsOnly && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([Icon, value, label, detail]) => (
            <div key={label} className="rounded-[1.6rem] bg-white p-5">
              <div className="flex justify-between">
                <Icon className="text-turquoise-dark" />
                <ArrowUpRight size={17} />
              </div>
              <p className="mt-7 text-3xl font-black">{value}</p>
              <p className="text-sm font-bold text-ink/45">{label}</p>
              <p className="mt-3 text-xs font-black text-lime">{detail}</p>
            </div>
          ))}
        </div>
      )}
      <section className={`${analyticsOnly ? "" : "mt-5"} rounded-[1.6rem] bg-white p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-black">Продажби и приходи</h2>
          <select
            value={data.period}
            onChange={(event) => changePeriod(event.target.value as AnalyticsPeriod)}
            disabled={loading}
            className="h-11 rounded-full border border-ink/10 bg-cream px-4 text-sm font-black outline-none"
          >
            {Object.entries(periodLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="mt-8 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#173f4614" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatPrice(Number(value))} />
              <Bar dataKey="revenue" name="Приходи" fill="#22bec4" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {lowStockOpen && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-coral">Внимание</p>
                <h2 className="mt-2 text-2xl font-black">Ниски наличности</h2>
              </div>
              <button onClick={() => setLowStockOpen(false)} aria-label="Затвори"><X /></button>
            </div>
            <div className="mt-5 max-h-72 space-y-2 overflow-auto">
              {data.lowStock.map((product) => (
                <div key={product.id} className="flex justify-between rounded-2xl bg-cream p-4 text-sm">
                  <div><p className="font-black">{product.name}</p><p className="text-xs text-ink/45">{product.sku}</p></div>
                  <span className="font-black text-coral">{product.stock} бр.</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
