import { AdminInventory } from "@/components/admin-inventory";
import { db } from "@/lib/db";

export default async function AdminInventoryPage() {
  const products = await db.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: { id: true, name: true, sku: true, stock: true, category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <AdminInventory
      initialProducts={products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        category: product.category.name,
      }))}
    />
  );
}
