import { db } from "@/lib/db";
import {
  categories as fallbackCategories,
  products as fallbackProducts,
  type Category,
  type Product,
} from "@/lib/products";

type DbProduct = Awaited<ReturnType<typeof queryProducts>>[number];

function queryProducts() {
  return db.product.findMany({
    where: { active: true },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: true,
      reviews: { where: { approved: true }, select: { rating: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
}

function mapProduct(product: DbProduct): Product {
  const categoryPreset = fallbackCategories.find(
    (category) => category.slug === product.category.slug,
  );
  const ratings = product.reviews.map((review) => review.rating);
  const rating = ratings.length
    ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
    : 4.8;
  const colors = product.variants
    .filter((variant) => variant.name.toLowerCase() === "цвят")
    .map((variant) => variant.value);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category.name,
    categorySlug: product.category.slug,
    price: Number(product.price),
    compareAt: product.compareAt ? Number(product.compareAt) : undefined,
    rating: Number(rating.toFixed(1)),
    reviews: ratings.length,
    stock: product.stock,
    badge: product.badge || undefined,
    image: product.images[0]?.url || "/creative-kit.png",
    colors: colors.length ? colors : ["Стандартен"],
    ages: [],
    description: product.description,
    details: product.details,
    featured: product.featured,
    isNew:
      Date.now() - product.createdAt.getTime() <
      1000 * 60 * 60 * 24 * 30,
    imagePosition: "center",
    ...(categoryPreset ? {} : { category: product.category.name }),
  };
}

export async function getCatalogProducts(): Promise<Product[]> {
  if (!process.env.DATABASE_URL) return fallbackProducts;

  try {
    return (await queryProducts()).map(mapProduct);
  } catch (error) {
    console.error("Unable to read products from PostgreSQL.", error);
    return fallbackProducts;
  }
}

export async function getCatalogProduct(slug: string) {
  const products = await getCatalogProducts();
  return products.find((product) => product.slug === slug);
}

export async function getCatalogCategories(): Promise<Category[]> {
  if (!process.env.DATABASE_URL) return fallbackCategories;

  try {
    const saved = await db.category.findMany({
      orderBy: { name: "asc" },
    });

    return saved.map((category) => {
      const preset = fallbackCategories.find(
        (item) => item.slug === category.slug,
      );
      return {
        name: category.name,
        slug: category.slug,
        description: category.description || preset?.description || "",
        color: category.color || preset?.color || "#e4f8f5",
        icon: preset?.icon || "★",
      };
    });
  } catch (error) {
    console.error("Unable to read categories from PostgreSQL.", error);
    return fallbackCategories;
  }
}

export async function getCatalogCategory(slug: string) {
  const categories = await getCatalogCategories();
  return categories.find((category) => category.slug === slug);
}
