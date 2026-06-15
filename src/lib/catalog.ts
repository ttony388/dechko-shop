import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { categories as categoryPresets, type Category, type Product } from "@/lib/products";

const productInclude = {
  category: true,
  categories: { include: { category: true } },
  images: { orderBy: { position: "asc" as const } },
  variants: true,
  reviews: { where: { approved: true }, select: { rating: true } },
} satisfies Prisma.ProductInclude;

type DbProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export type CatalogSort = "newest" | "price-asc" | "price-desc" | "best-rated" | "on-sale";

export type CatalogQuery = {
  ids?: string[];
  category?: string;
  search?: string;
  ageGroup?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSort;
  page?: number;
  limit?: number;
};

export type CatalogPage = {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export async function getCatalogPage(query: CatalogQuery = {}): Promise<CatalogPage> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(200, Math.max(1, query.limit || 12));
  const search = query.search?.trim();
  const filters: Prisma.ProductWhereInput[] = [];
  if (query.category) {
    filters.push({
      OR: [
        { category: { slug: query.category } },
        { categories: { some: { category: { slug: query.category } } } },
      ],
    });
  }
  if (search) {
    filters.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }
  if (query.sort === "on-sale") {
    filters.push({ OR: [{ salePrice: { not: null } }, { compareAt: { not: null } }] });
  }
  const where: Prisma.ProductWhereInput = {
    active: true,
    status: "ACTIVE",
    ...(query.ids?.length ? { id: { in: query.ids } } : {}),
    ...(filters.length ? { AND: filters } : {}),
    ...(query.ageGroup ? { ageGroup: query.ageGroup } : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? {
          price: {
            ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
            ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
          },
        }
      : {}),
  };

  const saved = await db.product.findMany({
    where,
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
  const sorted = sortProducts(saved.map(mapProduct), query.sort || "newest");
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, pages);

  return {
    products: sorted.slice((safePage - 1) * limit, safePage * limit),
    pagination: { page: safePage, limit, total, pages },
  };
}

export async function getCatalogProducts(): Promise<Product[]> {
  const page = await getCatalogPage({ limit: 48 });
  if (page.pagination.total <= 48) return page.products;

  const all = await db.product.findMany({
    where: { active: true, status: "ACTIVE" },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
  return all.map(mapProduct);
}

export async function getCatalogProduct(slug: string) {
  const product = await db.product.findFirst({
    where: { slug, active: true, status: "ACTIVE" },
    include: productInclude,
  });
  return product ? mapProduct(product) : undefined;
}

export async function getCatalogCategories(): Promise<Category[]> {
  const saved = await db.category.findMany({ orderBy: { name: "asc" } });
  return saved.map((category) => {
    const preset = categoryPresets.find((item) => item.slug === category.slug);
    return {
      name: category.name,
      slug: category.slug,
      description: category.description || preset?.description || "",
      color: category.color || preset?.color || "#e4f8f5",
      icon: preset?.icon || "★",
    };
  });
}

export async function getCatalogCategory(slug: string) {
  const category = await db.category.findUnique({ where: { slug } });
  if (!category) return undefined;
  const preset = categoryPresets.find((item) => item.slug === category.slug);
  return {
    name: category.name,
    slug: category.slug,
    description: category.description || preset?.description || "",
    color: category.color || preset?.color || "#e4f8f5",
    icon: preset?.icon || "★",
  };
}

function mapProduct(product: DbProduct): Product {
  const ratings = product.reviews.map((review) => review.rating);
  const rating = ratings.length
    ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
    : 4.8;
  const colors = product.variants
    .filter((variant) => ["цвят", "color"].includes(variant.name.toLowerCase()))
    .map((variant) => variant.value);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category.name,
    categorySlug: product.category.slug,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : undefined,
    compareAt: product.compareAt ? Number(product.compareAt) : undefined,
    rating: Number(rating.toFixed(1)),
    reviews: ratings.length,
    stock: product.stock,
    badge: product.badge || undefined,
    image: product.images[0]?.url || "/creative-kit.png",
    colors: colors.length ? colors : ["Стандартен"],
    ages: product.ageGroup ? [product.ageGroup] : [],
    tags: product.tags,
    brand: product.brand || undefined,
    gender: product.gender,
    description: product.description,
    details: product.details,
    featured: product.featured,
    isNew: Date.now() - product.createdAt.getTime() < 1000 * 60 * 60 * 24 * 30,
    imagePosition: "center",
  };
}

function sortProducts(products: Product[], sort: CatalogSort) {
  return [...products].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "best-rated") return b.rating - a.rating || b.reviews - a.reviews;
    if (sort === "on-sale") return Number(Boolean(b.compareAt)) - Number(Boolean(a.compareAt));
    return Number(b.isNew) - Number(a.isNew);
  });
}
