"use client";

import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminDeleteProduct } from "@/components/admin-delete-product";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  category: { id: string; name: string };
  image: string;
};

export function AdminProductsTable({
  products,
  categories,
}: {
  products: ProductRow[];
  categories: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);
      return matchesSearch && (!categoryId || product.category.id === categoryId);
    });
  }, [categoryId, products, search]);

  return (
    <section className="overflow-hidden rounded-[1.6rem] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-2xl font-black">Продукти</h2>
          <p className="mt-1 text-sm font-bold text-ink/45">
            {filtered.length} от {products.length} продукта
          </p>
        </div>
        <div className="order-3 flex w-full flex-wrap items-center gap-3 lg:order-none lg:w-auto lg:flex-1 lg:justify-center">
          <label className="relative min-w-[240px] flex-1 lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" size={17} />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Търси по име или SKU..."
              className="pl-11"
            />
          </label>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-12 rounded-2xl border border-ink/10 bg-white px-4 text-sm font-black outline-none"
          >
            <option value="">Всички категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
        >
          <Plus size={17} /> Добави продукт
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wider text-ink/45">
            <tr>
              <th className="px-6 py-4">Продукт</th>
              <th className="px-6 py-4">Категория</th>
              <th className="px-6 py-4">Цена</th>
              <th className="px-6 py-4">Наличност</th>
              <th className="px-6 py-4">Статус</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-t border-ink/5">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-mint">
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized={product.image.startsWith("http")}
                      />
                    </div>
                    <div>
                      <p className="max-w-xs font-black">{product.name}</p>
                      <p className="text-xs font-bold text-ink/40">{product.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-ink/60">{product.category.name}</td>
                <td className="px-6 py-4 font-black">{formatPrice(product.price)}</td>
                <td className="px-6 py-4 font-semibold">{product.stock}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${
                    product.status === "ACTIVE" ? "bg-lime/20 text-ink" : "bg-ink/5 text-ink/45"
                  }`}>
                    {product.status === "ACTIVE" ? "Активен" : "Чернова"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-ink/35 transition hover:text-turquoise-dark"
                      aria-label={`Редактирай ${product.name}`}
                    >
                      <Pencil size={17} />
                    </Link>
                    <AdminDeleteProduct id={product.id} name={product.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-10 text-center font-bold text-ink/50">Няма продукти по тези критерии.</p>
        )}
      </div>
    </section>
  );
}
