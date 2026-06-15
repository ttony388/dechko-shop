import { AdminCategories } from "@/components/admin-categories";
import { db } from "@/lib/db";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    include: { _count: { select: { primaryProducts: true, productCategories: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <AdminCategories
      initialCategories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color,
        products: Math.max(
          category._count.primaryProducts,
          category._count.productCategories,
        ),
      }))}
    />
  );
}
