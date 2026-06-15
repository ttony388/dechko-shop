import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopClient } from "@/components/shop-client";
import {
  getCatalogCategory,
  getCatalogProducts,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCatalogCategory(slug);
  return { title: category?.name || "Категория", description: category?.description };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCatalogCategory(slug);
  if (!category) notFound();
  const products = await getCatalogProducts();
  return (
    <div className="container-shell py-14 md:py-20">
      <div className="mb-12 flex flex-col gap-5 rounded-[2.4rem] p-8 md:flex-row md:items-center md:justify-between md:p-12" style={{ background: category.color }}>
        <div><p className="eyebrow mb-3">Колекция</p><h1 className="section-title">{category.name}</h1><p className="mt-4 font-semibold text-ink/60">{category.description}</p></div>
        <span className="text-8xl">{category.icon}</span>
      </div>
      <ShopClient initialProducts={products} initialCategory={slug} />
    </div>
  );
}
