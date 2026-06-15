import type { Metadata } from "next";
import { ShopClient } from "@/components/shop-client";
import { getCatalogProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Магазин", description: "Разгледайте всички детски продукти в Дечко." };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getCatalogProducts();
  return (
    <div className="container-shell py-14 md:py-20">
      <div className="mb-12 max-w-3xl"><p className="eyebrow mb-4 text-coral">Всичко на едно място</p><h1 className="section-title">Магазин за малки големи хора.</h1><p className="mt-5 max-w-xl font-semibold leading-7 text-ink/60">Подбрани играчки, книги, дрехи и подаръци за любопитни деца.</p></div>
      <ShopClient initialProducts={products} />
    </div>
  );
}
