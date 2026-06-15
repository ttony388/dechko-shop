import type { CatalogSort } from "@/lib/catalog";

export function parseFilters(params: Record<string, string | string[] | undefined>) {
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : undefined;
  const number = (key: string) => {
    const parsed = Number(value(key));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };
  const allowedSorts = ["newest", "price-asc", "price-desc", "best-rated", "on-sale"];
  const sortValue = value("sort");
  return {
    category: value("category"),
    search: value("search"),
    ageGroup: value("ageGroup"),
    maxPrice: number("maxPrice"),
    page: number("page"),
    sort: (allowedSorts.includes(sortValue || "") ? sortValue : "newest") as CatalogSort,
  };
}
