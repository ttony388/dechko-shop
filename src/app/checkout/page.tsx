"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CreditCard, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";

const schema = z.object({
  email: z.string().email("Въведете валиден имейл."),
  firstName: z.string().min(2, "Въведете име."),
  lastName: z.string().min(2, "Въведете фамилия."),
  phone: z.string().min(8, "Въведете телефон."),
  address: z.string().min(5, "Въведете адрес."),
  city: z.string().min(2, "Въведете град."),
  postalCode: z.string().min(4, "Въведете пощенски код."),
});
type CheckoutValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, coupon, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal * (coupon ? 0.9 : 1) + (subtotal >= 60 ? 0 : 4.9);
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: CheckoutValues) {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer: values, items }) });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else { clearCart(); router.push(`/order-success?order=${data.orderId || "DCH-2026"}`); }
    } finally { setLoading(false); }
  }

  return (
    <div className="container-shell py-12 md:py-20">
      <div className="mb-10"><p className="eyebrow mb-3 text-turquoise-dark">Сигурно плащане</p><h1 className="section-title">Последна стъпка.</h1></div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_390px]">
        <div className="space-y-5">
          <section className="rounded-[2rem] bg-white p-6 md:p-8"><div className="mb-6 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-turquoise font-black text-white">1</span><h2 className="text-xl font-black">Контакт</h2></div><Field label="Имейл" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field><Field label="Телефон" error={errors.phone?.message}><Input type="tel" autoComplete="tel" {...register("phone")} /></Field></section>
          <section className="rounded-[2rem] bg-white p-6 md:p-8"><div className="mb-6 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-coral font-black text-white">2</span><h2 className="text-xl font-black">Доставка</h2></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Име" error={errors.firstName?.message}><Input autoComplete="given-name" {...register("firstName")} /></Field><Field label="Фамилия" error={errors.lastName?.message}><Input autoComplete="family-name" {...register("lastName")} /></Field></div><Field label="Адрес" error={errors.address?.message}><Input autoComplete="street-address" {...register("address")} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Град" error={errors.city?.message}><Input autoComplete="address-level2" {...register("city")} /></Field><Field label="Пощенски код" error={errors.postalCode?.message}><Input autoComplete="postal-code" {...register("postalCode")} /></Field></div><label className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-turquoise bg-mint p-4 text-sm font-bold"><input type="radio" defaultChecked /> Куриер до адрес · 1-3 работни дни</label></section>
          <section className="rounded-[2rem] bg-white p-6 md:p-8"><div className="mb-6 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-yellow font-black text-ink">3</span><h2 className="text-xl font-black">Плащане</h2></div><div className="flex items-center justify-between rounded-2xl border-2 border-turquoise bg-mint p-4"><span className="flex items-center gap-3 font-black"><CreditCard /> Банкова карта със Stripe</span><Check size={20} /></div><p className="mt-4 flex items-center gap-2 text-xs font-bold text-ink/45"><LockKeyhole size={14} /> Данните за картата се обработват защитено от Stripe.</p></section>
        </div>
        <aside className="h-fit rounded-[2rem] bg-ink p-6 text-white lg:sticky lg:top-28"><h2 className="text-xl font-black">Вашата поръчка</h2><div className="my-5 max-h-64 space-y-3 overflow-auto border-y border-white/10 py-5">{items.map((item) => <div key={item.product.id} className="flex justify-between gap-4 text-sm"><span className="text-white/65">{item.quantity} × {item.product.name}</span><span className="font-bold">{formatPrice(item.product.price * item.quantity)}</span></div>)}</div><div className="flex justify-between text-xl font-black"><span>Общо</span><span>{formatPrice(total)}</span></div><Button type="submit" disabled={loading || !items.length} className="mt-6 w-full bg-yellow text-ink hover:bg-yellow-dark">{loading ? "Подготвяме..." : "Плати сигурно"} <LockKeyhole size={17} /></Button><p className="mt-4 text-center text-xs text-white/40">С поръчката приемате общите условия.</p></aside>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="mb-4 block"><span className="field-label">{label}</span>{children}{error && <span className="mt-1 block text-xs font-bold text-coral">{error}</span>}</label>;
}
