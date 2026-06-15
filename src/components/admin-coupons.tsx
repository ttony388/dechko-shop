"use client";

import { Gift, Pencil, Plus, Trash2, X } from "lucide-react";
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

type EligibleCustomer = {
  id: string;
  name: string;
  email: string;
  orderCount: number;
};

export function AdminCoupons({
  initialCoupons,
  eligibleCustomers,
}: {
  initialCoupons: CouponRow[];
  eligibleCustomers: EligibleCustomer[];
}) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [oneTimeOpen, setOneTimeOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [oneTimePercent, setOneTimePercent] = useState<5 | 10>(5);
  const [generatedCode, setGeneratedCode] = useState("");
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

  async function generateOneTimeCoupon(event: React.FormEvent) {
    event.preventDefault();
    if (!customerId) return;
    setError("");
    const response = await fetch(`/api/admin/customers/${customerId}/coupon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percent: oneTimePercent }),
    });
    const body = (await response.json().catch(() => null)) as {
      id?: string;
      code?: string;
      type?: string;
      value?: number;
      usageLimit?: number | null;
      usageCount?: number;
      active?: boolean;
      expiresAt?: string | null;
      error?: string;
    } | null;
    if (!response.ok || !body?.id || !body.code) {
      setError(body?.error || "Еднократният код не беше създаден.");
      return;
    }
    const customer = eligibleCustomers.find((candidate) => candidate.id === customerId);
    setCoupons((current) => [
      {
        id: body.id!,
        code: body.code!,
        type: body.type || "percent",
        value: Number(body.value),
        minOrder: null,
        usageLimit: body.usageLimit ?? 1,
        usageCount: body.usageCount ?? 0,
        active: body.active ?? true,
        expiresAt: body.expiresAt || null,
        assignedCustomer: customer?.name || customer?.email || null,
      },
      ...current,
    ]);
    setGeneratedCode(body.code);
  }

  return (
    <>
      <section className="overflow-hidden rounded-[1.6rem] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div><h2 className="text-2xl font-black">Купони</h2><p className="mt-1 text-sm font-bold text-ink/45">{coupons.length} купона</p></div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setCustomerId(eligibleCustomers[0]?.id || "");
                setOneTimePercent(5);
                setGeneratedCode("");
                setError("");
                setOneTimeOpen(true);
              }}
            >
              <Gift size={16} /> Еднократен код
            </Button>
            <Button size="sm" onClick={add}><Plus size={16} /> Добави</Button>
          </div>
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
                  <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${coupon.active ? "bg-lime/20" : "bg-ink/5 text-ink/45"}`}>{coupon.active ? "Активен" : coupon.usageLimit === 1 && coupon.usageCount >= 1 ? "Архивиран" : "Неактивен"}</span></td>
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
      {oneTimeOpen && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
          <form onSubmit={generateOneTimeCoupon} className="w-full max-w-lg rounded-[2rem] bg-white p-7">
            <div className="flex justify-between">
              <div>
                <p className="eyebrow text-coral">Лоялен клиент</p>
                <h2 className="mt-2 text-2xl font-black">Еднократен код</h2>
              </div>
              <button type="button" onClick={() => setOneTimeOpen(false)}><X /></button>
            </div>
            <p className="mt-3 text-sm font-semibold text-ink/55">
              Кодът е от 8 случайни главни букви и цифри и се архивира след първото използване.
            </p>
            {eligibleCustomers.length ? (
              <>
                <label className="mt-5 block">
                  <span className="field-label">Клиент с над 5 поръчки</span>
                  <select
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 font-bold outline-none"
                  >
                    {eligibleCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} · {customer.orderCount} поръчки
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-5">
                  <span className="field-label">Отстъпка</span>
                  <div className="grid grid-cols-2 gap-3">
                    {[5, 10].map((percent) => (
                      <button
                        key={percent}
                        type="button"
                        onClick={() => setOneTimePercent(percent as 5 | 10)}
                        className={`rounded-2xl border-2 p-4 font-black ${
                          oneTimePercent === percent ? "border-turquoise bg-mint" : "border-ink/10"
                        }`}
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                </div>
                {generatedCode && (
                  <div className="mt-5 rounded-2xl bg-mint p-5 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink/45">Генериран код</p>
                    <p className="mt-1 text-3xl font-black tracking-[0.2em]">{generatedCode}</p>
                  </div>
                )}
                {error && <p className="mt-4 text-sm font-bold text-coral">{error}</p>}
                <div className="mt-6 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setOneTimeOpen(false)}>Затвори</Button>
                  <Button disabled={Boolean(generatedCode)}><Gift size={16} /> Генерирай</Button>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-2xl bg-cream p-5 text-sm font-bold text-ink/55">
                Все още няма клиент с повече от 5 поръчки.
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
}
