"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";

export default function CartPage() {
  const { items, removeItem, updateQuantity, syncItemStock, setCoupon, coupon } = useCart();
  const [code, setCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
  const itemIds = items.map((item) => item.product.id).join(",");
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = coupon
    ? coupon.type === "percent"
      ? subtotal * (coupon.value / 100)
      : Math.min(subtotal, coupon.value)
    : 0;

  useEffect(() => {
    if (!itemIds) {
      setUnavailableIds([]);
      return;
    }
    let removalTimer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    fetch(`/api/products?ids=${encodeURIComponent(itemIds)}&limit=200`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((body: { products?: { id: string; stock: number }[] }) => {
        const currentItems = useCart.getState().items;
        const products = new Map(
          (body.products || []).map((product) => [product.id, product]),
        );
        for (const product of products.values()) {
          syncItemStock(product.id, product.stock);
        }
        const unavailable = currentItems.filter((item) => {
          const product = products.get(item.product.id);
          return !product || product.stock <= 0;
        });
        if (!unavailable.length) {
          setUnavailableIds([]);
          return;
        }

        const ids = [...new Set(unavailable.map((item) => item.product.id))];
        const names = [...new Set(unavailable.map((item) => item.product.name))];
        setUnavailableIds(ids);
        setAvailabilityMessage(
          `${names.join(", ")} ${names.length === 1 ? "вече не е наличен" : "вече не са налични"} и ще бъде премахнат от количката.`,
        );
        removalTimer = setTimeout(() => {
          ids.forEach((id) => removeItem(id));
          setUnavailableIds([]);
          setAvailabilityMessage(
            `${names.join(", ")} ${names.length === 1 ? "беше премахнат" : "бяха премахнати"} от количката поради изчерпана наличност.`,
          );
        }, 1500);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setAvailabilityMessage("Не успяхме да проверим актуалната наличност.");
        }
      });
    return () => {
      controller.abort();
      if (removalTimer) clearTimeout(removalTimer);
    };
  }, [itemIds, removeItem, syncItemStock]);
  const shipping = subtotal >= 60 ? 0 : 4.9;
  const tax = (subtotal - discount) * 0.2;
  const total = subtotal - discount + shipping;

  async function applyCoupon() {
    const response = await fetch(
      `/api/coupons?code=${encodeURIComponent(code)}&subtotal=${subtotal}`,
    );
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      type?: "percent" | "fixed";
      value?: number;
      error?: string;
    } | null;
    if (!response.ok || !body?.code || !body.type || body.value === undefined) {
      setCoupon(null);
      setCouponMessage(body?.error || "Невалиден код.");
      return;
    }
    setCoupon({ code: body.code, type: body.type, value: body.value });
    setCouponMessage("Кодът е приложен.");
  }

  if (!items.length) return (
    <div className="container-shell flex min-h-[65vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid h-24 w-24 place-items-center rounded-full bg-mint"><ShoppingBag size={38} /></span>
      <h1 className="mt-7 text-4xl font-black">Количката е готова за приключения.</h1>
      <p className="mt-3 max-w-md font-semibold text-ink/55">Добавете нещо красиво и то ще се появи тук.</p>
      <Link href="/shop" className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-ink px-8 font-black text-white">Към магазина <ArrowRight size={18} /></Link>
    </div>
  );

  return (
    <div className="container-shell py-14 md:py-20">
      <h1 className="section-title mb-10">Вашата количка.</h1>
      {availabilityMessage && (
        <p className="mb-6 rounded-2xl bg-yellow/25 p-4 text-sm font-black">
          {availabilityMessage}
        </p>
      )}
      <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
        <div className="space-y-4">
          {items.map(({ product, quantity, variant }) => {
            const unavailable = unavailableIds.includes(product.id);
            return (
            <motion.article
              key={`${product.id}-${variant}`}
              animate={
                unavailable
                  ? { opacity: 0, y: -18, scale: 0.98 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              transition={
                unavailable
                  ? { delay: 0.85, duration: 0.45, ease: "easeInOut" }
                  : { duration: 0.2 }
              }
              className={`grid grid-cols-[96px_1fr] gap-4 rounded-[1.8rem] p-3 sm:grid-cols-[130px_1fr_auto] sm:p-4 ${
                unavailable ? "bg-coral/10 ring-2 ring-coral/25" : "bg-white"
              }`}
            >
              <div className="relative aspect-square overflow-hidden rounded-[1.3rem] bg-mint"><Image src={product.image} alt={product.name} fill className="object-cover" style={{ objectPosition: product.imagePosition }} unoptimized={product.image.startsWith("http")} /></div>
              <div className="py-2"><p className="text-xs font-bold uppercase tracking-wider text-ink/40">{product.category}</p><Link href={`/product/${product.slug}`} className="mt-1 block text-lg font-black">{product.name}</Link><p className="mt-1 text-xs font-bold text-ink/45">{variant}</p><p className="mt-3 font-black">{formatPrice(product.price)}</p>{unavailable && <p className="mt-2 text-sm font-black text-coral">Няма наличност. Премахваме продукта...</p>}</div>
              <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:flex-col sm:items-end sm:py-2">
                <button disabled={unavailable} onClick={() => removeItem(product.id)} className="text-ink/35 transition hover:text-coral disabled:opacity-25" aria-label="Премахни"><Trash2 size={19} /></button>
                <div className="flex h-10 items-center rounded-full bg-cream px-1"><button disabled={unavailable} className="grid h-8 w-8 place-items-center disabled:opacity-25" onClick={() => updateQuantity(product.id, quantity - 1)}><Minus size={15} /></button><span className="w-7 text-center text-sm font-black">{quantity}</span><button disabled={unavailable || quantity >= product.stock} className="grid h-8 w-8 place-items-center disabled:opacity-25" onClick={() => updateQuantity(product.id, quantity + 1)}><Plus size={15} /></button></div>
              </div>
            </motion.article>
          );})}
        </div>
        <aside className="h-fit rounded-[2rem] bg-ink p-6 text-white lg:sticky lg:top-28">
          <h2 className="text-2xl font-black">Обобщение</h2>
          <div className="my-6 space-y-3 border-y border-white/10 py-5 text-sm">
            <div className="flex justify-between text-white/65"><span>Междинна сума</span><span>{formatPrice(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-lime"><span>Отстъпка</span><span>-{formatPrice(discount)}</span></div>}
            <div className="flex justify-between text-white/65"><span>Доставка</span><span>{shipping ? formatPrice(shipping) : "Безплатна"}</span></div>
            <div className="flex justify-between text-xs text-white/40"><span>Вкл. ДДС</span><span>{formatPrice(tax)}</span></div>
          </div>
          <div className="flex justify-between text-xl font-black"><span>Общо</span><span>{formatPrice(total)}</span></div>
          <Link href="/checkout" className="mt-6 flex h-14 items-center justify-center gap-2 rounded-full bg-yellow font-black text-ink">Към плащане <ArrowRight size={18} /></Link>
          <div className="mt-6"><label className="mb-2 block text-xs font-black text-white/70">Код за отстъпка</label><div className="flex gap-2"><Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="DECHKO10" className="border-0 text-ink" /><button onClick={applyCoupon} className="rounded-2xl bg-white/10 px-4 text-xs font-black">Приложи</button></div>{couponMessage && <p className="mt-2 text-xs text-white/55">{couponMessage}</p>}</div>
          <p className="mt-5 text-center text-xs text-white/40">Сигурно плащане със Stripe</p>
        </aside>
      </div>
    </div>
  );
}
