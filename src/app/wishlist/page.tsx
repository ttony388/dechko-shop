import { WishlistClient } from "@/components/wishlist-client";
import { getCatalogProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  return <WishlistClient products={await getCatalogProducts()} />;
}
