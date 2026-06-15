import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AdminProductForm } from "@/components/admin-product-form";
import { db } from "@/lib/db";

export default async function NewProductPage() {
  const categories = await db.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-ink/55"
      >
        <ChevronLeft size={17} /> Назад към продуктите
      </Link>
      <div className="mb-7">
        <h2 className="text-3xl font-black">Нов продукт</h2>
        <p className="mt-2 text-sm font-semibold text-ink/50">
          Попълнете данните и продуктът ще се появи в магазина.
        </p>
      </div>
      <AdminProductForm categories={categories} />
    </div>
  );
}
