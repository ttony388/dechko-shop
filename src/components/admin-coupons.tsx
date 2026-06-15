"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number | null;
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
  expiresAt: string | null;
  assignedCustomer: string | null;
};

type Draft = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number | null;
  usageLimit: number | null;
  active: boolean;
  expiresAt: string | null;
};

const emptyDraft: Draft = {
  code: "",
  type: "percent",
  value: 10,
  minOrder: null,
  usageLimit: null,
  active: true,
  expiresAt: null,
};

export function AdminCoupons({ initialCoupons }: { initialCoupons: CouponRow[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  function add() {
    setEditingId(null);
    setDraft(emptyDraft);
    setError("");
    setOpen(true);
  }

  function edit(coupon: CouponRow) {
    setEditingId(coupon.id);
    setDraft({
      code: coupon.code,
      type: coupon.type === "fixed" ? "fixed" : "percent",
      value: coupon.value,
      minOrder: coupon.minOrder,
      usageLimit: coupon.usageLimit,
      active: coupon.active,
      expiresAt: coupon.expiresAt,
    });
    setError("");
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      ...draft,
      expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : null,
    };
    const response = await fetch(editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as (Omit<CouponRow, "assignedCustomer"> & { error?: string }) | null;
    if (!response.ok || !body) {
      setError(body?.error || "Купонът не беше запазен.");
      return;
    }
    setCoupons((current) =>
      editingId
        ? current.map((coupon) =>
            coupon.id === editingId ? { ...coupon, ...body } : coupon,
          )
        : [{ ...body, assignedCustomer: null }, ...current],
    );
    setOpen(false);
  }

  async function remove(coupon: CouponRow) {
    if (!window.confirm(`Да изтрием ли купон ${coupon.code}?`)) return;
    const response = await fetch(`/api/admin/coupons/${coupon.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      window.alert(body?.error || "Купонът не беше изтрит.");
      return;
    }
    const body = (await response.json().catch(() => null)) as { archived?: boolean } | null;
    setCoupons((current) =>
      body?.archived
        ? current.map((item) => (item.id === coupon.id ? { ...item, active: false } : item))
        : current.filter((item) => item.id !== coupon.id),
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-[1.6rem] bg-white">
        <div className="flex items-center justify-between p-6">
          <div><h2 className="text-2xl font-black">Купони</h2><p className="mt-1 text-sm font-bold text-ink/45">{coupons.length} купона</p></div>
          <Button size="sm" onClick={add}><Plus size={16} /> Добави</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-wider text-ink/45">
              <tr><th className="px-6 py-4">Код</th><th className="px-6 py-4">Отстъпка</th><th className="px-6 py-4">Използвания</th><th className="px-6 py-4">Клиент</th><th className="px-6 py-4">Статус</th><th className="px-6 py-4" /></tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t border-ink/5">
                  <td className="px-6 py-4 font-black">{coupon.code}</td>
                  <td className="px-6 py-4 font-black">{coupon.type === "percent" ? `${coupon.value}%` : formatPrice(coupon.value)}</td>
                  <td className="px-6 py-4 font-semibold">{coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}</td>
                  <td className="px-6 py-4 text-ink/55">{coupon.assignedCustomer || "Всички"}</td>
                  <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${coupon.active ? "bg-lime/20" : "bg-ink/5 text-ink/45"}`}>{coupon.active ? "Активен" : "Неактивен"}</span></td>
                  <td className="px-6 py-4"><div className="flex gap-3"><button onClick={() => edit(coupon)}><Pencil size={17} /></button><button onClick={() => remove(coupon)} className="text-coral"><Trash2 size={17} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {open && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-xl rounded-[2rem] bg-white p-7">
            <div className="flex justify-between"><h2 className="text-2xl font-black">{editingId ? "Редакция на купон" : "Нов купон"}</h2><button type="button" onClick={() => setOpen(false)}><X /></button></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label><span className="field-label">Код</span><Input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })} required /></label>
              <label><span className="field-label">Тип</span><select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as Draft["type"] })} className="h-12 w-full rounded-2xl border border-ink/10 px-4 font-bold"><option value="percent">Процент</option><option value="fixed">Фиксирана сума</option></select></label>
              <label><span className="field-label">Стойност</span><Input type="number" min="0.01" step="0.01" value={draft.value} onChange={(event) => setDraft({ ...draft, value: Number(event.target.value) })} required /></label>
              <label><span className="field-label">Минимална поръчка</span><Input type="number" min="0" step="0.01" value={draft.minOrder ?? ""} onChange={(event) => setDraft({ ...draft, minOrder: event.target.value ? Number(event.target.value) : null })} /></label>
              <label><span className="field-label">Лимит използвания</span><Input type="number" min="1" value={draft.usageLimit ?? ""} onChange={(event) => setDraft({ ...draft, usageLimit: event.target.value ? Number(event.target.value) : null })} /></label>
              <label><span className="field-label">Валиден до</span><Input type="datetime-local" value={draft.expiresAt ? draft.expiresAt.slice(0, 16) : ""} onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value || null })} /></label>
            </div>
            <label className="mt-4 flex items-center gap-3 font-bold"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /> Активен</label>
            {error && <p className="mt-4 text-sm font-bold text-coral">{error}</p>}
            <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Отказ</Button><Button>Запази</Button></div>
          </form>
        </div>
      )}
    </>
  );
}
