import { NextResponse } from "next/server";
import { getCatalogPage, type CatalogSort } from "@/lib/catalog";

const sorts = new Set<CatalogSort>([
  "newest",
  "price-asc",
  "price-desc",
  "best-rated",
  "on-sale",
]);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const sortValue = params.get("sort") as CatalogSort | null;
  const page = numberParam(params.get("page"));
  const limit = numberParam(params.get("limit"));
  const minPrice = numberParam(params.get("minPrice"));
  const maxPrice = numberParam(params.get("maxPrice"));

  const result = await getCatalogPage({
    ids: params.get("ids")?.split(",").filter(Boolean),
    category: params.get("category") || undefined,
    search: params.get("search") || undefined,
    ageGroup: params.get("ageGroup") || undefined,
    sort: sortValue && sorts.has(sortValue) ? sortValue : "newest",
    page,
    limit,
    minPrice,
    maxPrice,
  });
  return NextResponse.json(result);
}

function numberParam(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
