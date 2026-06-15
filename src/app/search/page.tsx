import { SearchClient } from "@/components/search-client";
import { getCatalogProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  return <SearchClient products={await getCatalogProducts()} />;
}
