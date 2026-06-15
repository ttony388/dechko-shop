"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { categories, products as allProducts, type Product } from "@/lib/products";

export function ShopClient({
  initialProducts = allProducts,
  initialCategory,
}: {
  initialProducts?: Product[];
  initialCategory?: string;
}) {
  const [category, setCategory] = useState(initialCategory || "all");
  const [sort, setSort] = useState("popular");
  const [maxPrice, setMaxPrice] = useState(80);
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const pageSize = 12;

  const filtered = useMemo(() => {
    const list = initialProducts
      .filter((product) => category === "all" || product.categorySlug === category)
      .filter((product) => product.price <= maxPrice);
    return [...list].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "new") return Number(b.isNew) - Number(a.isNew);
      return b.reviews - a.reviews;
    });
  }, [category, initialProducts, maxPrice, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const Filters = () => (
    <div className="space-y-8">
      <div>
        <p className="mb-4 font-black">Категория</p>
        <div className="space-y-2">
          <button onClick={() => { setCategory("all"); setPage(1); }} className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-bold ${category === "all" ? "bg-ink text-white" : "hover:bg-white"}`}>Всички</button>
          {categories.slice(0, 7).map((item) => <button key={item.slug} onClick={() => { setCategory(item.slug); setPage(1); }} className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-bold ${category === item.slug ? "bg-ink text-white" : "hover:bg-white"}`}>{item.icon} {item.name}</button>)}
        </div>
      </div>
      <div>
        <div className="mb-3 flex justify-between font-black"><span>Цена до</span><span>€{maxPrice}</span></div>
        <input type="range" min="20" max="80" step="5" value={maxPrice} onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(1); }} className="w-full accent-[#20c4c8]" aria-label="Максимална цена" />
      </div>
      <div><p className="mb-3 font-black">Наличност</p><label className="flex gap-2 text-sm font-bold"><input type="checkbox" defaultChecked className="accent-[#20c4c8]" /> Само налични продукти</label></div>
    </div>
  );

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink/55">{filtered.length} продукта</p>
        <div className="flex gap-2">
          <button className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-black shadow-soft lg:hidden" onClick={() => setMobileFilters(true)}><SlidersHorizontal size={17} /> Филтри</button>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-11 rounded-full border-0 bg-white px-4 text-sm font-black shadow-soft outline-none" aria-label="Сортиране">
            <option value="popular">Най-популярни</option>
            <option value="new">Най-нови</option>
            <option value="price-asc">Цена: ниска към висока</option>
            <option value="price-desc">Цена: висока към ниска</option>
          </select>
        </div>
      </div>
      <div className="grid gap-9 lg:grid-cols-[220px_1fr]">
        <aside className="hidden rounded-[1.8rem] bg-white p-5 lg:block"><Filters /></aside>
        <div>
          {visible.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-5">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-[2rem] bg-white p-12 text-center"><p className="text-4xl">🔎</p><h2 className="mt-4 text-2xl font-black">Няма продукти с тези филтри.</h2></div>}
          {pages > 1 && <div className="mt-12 flex justify-center gap-2">{Array.from({ length: pages }, (_, index) => <button key={index} onClick={() => setPage(index + 1)} className={`grid h-11 w-11 place-items-center rounded-full font-black ${page === index + 1 ? "bg-ink text-white" : "bg-white"}`}>{index + 1}</button>)}</div>}
        </div>
      </div>
      {mobileFilters && <div className="fixed inset-0 z-[90] bg-ink/30 backdrop-blur-sm" onClick={() => setMobileFilters(false)}><aside className="ml-auto h-full w-[88%] max-w-sm overflow-y-auto bg-cream p-6" onClick={(event) => event.stopPropagation()}><div className="mb-8 flex justify-between"><h2 className="text-2xl font-black">Филтри</h2><button onClick={() => setMobileFilters(false)}><X /></button></div><Filters /></aside></div>}
    </>
  );
}
