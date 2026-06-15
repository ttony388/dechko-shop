import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminProductForm } from "@/components/admin-product-form";
import { db } from "@/lib/db";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, categories] = await Promise.all([
    params,
    db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const product = await db.product.findUnique({
    where: { id },
    include: {
      categories: { select: { categoryId: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: true,
    },
  });
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-ink/55">
        <ChevronLeft size={17} /> Назад към продуктите
      </Link>
      <div className="mb-7">
        <h2 className="text-3xl font-black">Редакция на продукт</h2>
        <p className="mt-2 text-sm font-semibold text-ink/50">Промените се отразяват веднага във всички каталожни страници.</p>
      </div>
      <AdminProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          details: product.details,
          regularPrice: Number(product.compareAt || product.price),
          salePrice: product.salePrice ? Number(product.salePrice) : null,
          sku: product.sku,
          stock: product.stock,
          badge: product.badge,
          brand: product.brand,
          tags: product.tags,
          ageGroup: product.ageGroup,
          gender: product.gender,
          status: product.status,
          featured: product.featured,
          categoryIds: product.categories.length
            ? product.categories.map((item) => item.categoryId)
            : [product.categoryId],
          imageUrl: product.images[0]?.url || "",
          colors: product.variants
            .filter((variant) => ["цвят", "color"].includes(variant.name.toLowerCase()))
            .map((variant) => variant.value),
        }}
      />
    </div>
  );
}
