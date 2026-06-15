import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { AdminDeleteProduct } from "@/components/admin-delete-product";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: {
      category: true,
      images: { orderBy: { position: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="overflow-hidden rounded-[1.6rem] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-2xl font-black">Продукти</h2>
          <p className="mt-1 text-sm font-bold text-ink/45">{products.length} продукта в каталога</p>
        </div>
        <Link href="/admin/products/new" className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-black text-white">
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
            {products.map((product) => (
              <tr key={product.id} className="border-t border-ink/5">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-mint">
                      <Image
                        src={product.images[0]?.url || "/creative-kit.png"}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized={product.images[0]?.url.startsWith("http") || false}
                      />
                    </div>
                    <div>
                      <p className="max-w-xs font-black">{product.name}</p>
                      <p className="text-xs font-bold text-ink/40">{product.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-ink/60">{product.category.name}</td>
                <td className="px-6 py-4 font-black">{formatPrice(Number(product.price))}</td>
                <td className="px-6 py-4 font-semibold">{product.stock}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${product.status === "ACTIVE" ? "bg-lime/20 text-ink" : "bg-ink/5 text-ink/45"}`}>
                    {product.status === "ACTIVE" ? "Активен" : "Чернова"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/products/${product.id}/edit`} className="text-ink/35 transition hover:text-turquoise-dark" aria-label={`Редактирай ${product.name}`}>
                      <Pencil size={17} />
                    </Link>
                    <AdminDeleteProduct id={product.id} name={product.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!products.length && <p className="p-10 text-center font-bold text-ink/50">Все още няма активни продукти.</p>}
      </div>
    </section>
  );
}
