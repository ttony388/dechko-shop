"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import type { CatalogPage, CatalogSort } from "@/lib/catalog";
import type { Category } from "@/lib/products";

type Filters = {
  category?: string;
  search?: string;
  ageGroup?: string;
  maxPrice?: number;
  sort: CatalogSort;
};

export function ShopClient({
  products,
  categories,
  pagination,
  filters,
  fixedCategory,
}: {
  products: CatalogPage["products"];
  categories: Category[];
  pagination: CatalogPage["pagination"];
  filters: Filters;
  fixedCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();
  const [mobileFilters, setMobileFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || 100);
  const [search, setSearch] = useState(filters.search || "");

  function update(values: Record<string, string | number | undefined>) {
    const params = new URLSearchParams(currentParams.toString());
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === "all") params.delete(key);
      else params.set(key, String(value));
    });
    if (!("page" in values)) params.delete("page");
    router.push(`${pathname}${params.size ? `?${params}` : ""}`);
  }

  const FiltersPanel = () => (
    <div className="space-y-7">
      {!fixedCategory && (
        <div>
          <p className="mb-3 font-black">Категория</p>
          <select
            value={filters.category || "all"}
            onChange={(event) => update({ category: event.target.value })}
            className={selectClass}
          >
            <option value="all">Всички категории</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>{category.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <p className="mb-3 font-black">Възраст</p>
        <select
          value={filters.ageGroup || "all"}
          onChange={(event) => update({ ageGroup: event.target.value })}
          className={selectClass}
        >
          <option value="all">Всички възрасти</option>
          {["0-2 г.", "3-5 г.", "6-8 г.", "9-12 г.", "12+ г."].map((age) => <option key={age}>{age}</option>)}
        </select>
      </div>
      <div>
        <div className="mb-3 flex justify-between font-black"><span>Цена до</span><span>€{maxPrice}</span></div>
        <input
          type="range"
          min="10"
          max="200"
          step="5"
          value={maxPrice}
          onChange={(event) => setMaxPrice(Number(event.target.value))}
          onPointerUp={() => update({ maxPrice })}
          onKeyUp={() => update({ maxPrice })}
          className="w-full accent-[#20c4c8]"
          aria-label="Максимална цена"
        />
      </div>
      <button
        onClick={() => {
          setMaxPrice(100);
          setSearch("");
          router.push(pathname);
        }}
        className="text-sm font-black text-coral"
      >
        Изчисти филтрите
      </button>
    </div>
  );

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <form
          className="relative w-full max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            update({ search });
          }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" size={18} />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Търсене в продуктите..."
            className="rounded-full pl-11 shadow-soft"
          />
        </form>
        <div className="flex gap-2">
          <button className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-black shadow-soft lg:hidden" onClick={() => setMobileFilters(true)}>
            <SlidersHorizontal size={17} /> Филтри
          </button>
          <select
            value={filters.sort}
            onChange={(event) => update({ sort: event.target.value })}
            className="h-11 rounded-full border-0 bg-white px-4 text-sm font-black shadow-soft outline-none"
            aria-label="Сортиране"
          >
            <option value="newest">Най-нови</option>
            <option value="price-asc">Цена: ниска към висока</option>
            <option value="price-desc">Цена: висока към ниска</option>
            <option value="best-rated">Най-добре оценени</option>
            <option value="on-sale">На промоция</option>
          </select>
        </div>
      </div>
      <div className="mb-6 text-sm font-bold text-ink/55">{pagination.total} продукта</div>
      <div className="grid gap-9 lg:grid-cols-[230px_1fr]">
        <aside className="hidden h-fit rounded-[1.8rem] bg-white p-5 lg:block"><FiltersPanel /></aside>
        <div>
          {products.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-5">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="rounded-[2rem] bg-white p-12 text-center">
              <Search className="mx-auto text-turquoise-dark" size={42} />
              <h2 className="mt-4 text-2xl font-black">Няма продукти с тези филтри.</h2>
              <p className="mt-2 font-semibold text-ink/50">Променете категорията, възрастта, цената или търсенето.</p>
            </div>
          )}
          {pagination.pages > 1 && (
            <nav className="mt-12 flex flex-wrap justify-center gap-2" aria-label="Страници">
              {Array.from({ length: pagination.pages }, (_, index) => index + 1).map((page) => {
                const params = new URLSearchParams(currentParams.toString());
                params.set("page", String(page));
                return (
                  <Link
                    key={page}
                    href={`${pathname}?${params}`}
                    className={`grid h-11 w-11 place-items-center rounded-full font-black ${pagination.page === page ? "bg-ink text-white" : "bg-white"}`}
                  >
                    {page}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
      {mobileFilters && (
        <div className="fixed inset-0 z-[90] bg-ink/30 backdrop-blur-sm" onClick={() => setMobileFilters(false)}>
          <aside className="ml-auto h-full w-[88%] max-w-sm overflow-y-auto bg-cream p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-8 flex justify-between"><h2 className="text-2xl font-black">Филтри</h2><button onClick={() => setMobileFilters(false)}><X /></button></div>
            <FiltersPanel />
          </aside>
        </div>
      )}
    </>
  );
}

const selectClass = "h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm font-bold outline-none focus:border-turquoise";
