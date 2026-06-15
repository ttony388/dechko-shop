import { AdminProductsTable } from "@/components/admin-products-table";
import { db } from "@/lib/db";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { status: { not: "ARCHIVED" } },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { position: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminProductsTable
      categories={categories}
      products={products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: Number(product.salePrice || product.price),
        stock: product.stock,
        status: product.status,
        category: product.category,
        image: product.images[0]?.url || "/creative-kit.png",
      }))}
    />
  );
}
