"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/products";

export function SearchClient({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const result =
    query.trim().length > 1
      ? products.filter((product) =>
          `${product.name} ${product.category}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
      : [];

  return (
    <div className="container-shell min-h-[60vh] py-14 md:py-20">
      <p className="eyebrow mb-3 text-turquoise-dark">Намери бързо</p>
      <h1 className="section-title">Какво търсите?</h1>
      <div className="relative mt-8 max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-ink/35" />
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Играчка, книга, подарък..."
          className="h-16 rounded-full pl-14 text-base shadow-soft"
        />
      </div>
      {query.length > 1 && (
        <p className="my-8 text-sm font-black text-ink/45">
          {result.length} резултата за „{query}“
        </p>
      )}
      <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
        {result.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
