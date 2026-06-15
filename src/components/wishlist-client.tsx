"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products";
import { useCart } from "@/store/cart";

export function WishlistClient({ products }: { products: Product[] }) {
  const wishlist = useCart((state) => state.wishlist);
  const selected = products.filter((product) =>
    wishlist.includes(product.id),
  );

  return (
    <div className="container-shell min-h-[60vh] py-14 md:py-20">
      <p className="eyebrow mb-3 text-coral">Запазени за после</p>
      <h1 className="section-title mb-10">Любими.</h1>
      {selected.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
          {selected.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] bg-white p-12 text-center">
          <Heart size={42} className="mx-auto text-coral" />
          <h2 className="mt-5 text-2xl font-black">
            Все още няма любими.
          </h2>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-ink px-7 py-4 font-black text-white"
          >
            Разгледай магазина
          </Link>
        </div>
      )}
    </div>
  );
}
