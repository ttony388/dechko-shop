"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((state) => state.addItem);
  const toggleWishlist = useCart((state) => state.toggleWishlist);
  const wished = useCart((state) => state.wishlist.includes(product.id));

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group relative"
    >
      <div className="relative aspect-[4/4.6] overflow-hidden rounded-[2rem] bg-mint">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-700 group-hover:scale-105"
            style={{ objectPosition: product.imagePosition }}
            unoptimized={product.image.startsWith("http")}
          />
        </Link>
        <div className="absolute left-3 top-3 flex gap-2">
          {product.badge && <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black shadow-soft">{product.badge}</span>}
        </div>
        <button
          onClick={() => toggleWishlist(product.id)}
          aria-label="Добави в любими"
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white shadow-soft"
        >
          <Heart size={18} className={wished ? "fill-coral text-coral" : ""} />
        </button>
        <button
          onClick={() => addItem(product)}
          className="absolute bottom-3 right-3 grid h-12 w-12 translate-y-2 place-items-center rounded-full bg-ink text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100"
          aria-label={`Добави ${product.name} в количката`}
        >
          <Plus />
        </button>
      </div>
      <div className="px-2 pt-4">
        <div className="mb-1 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{product.category}</p>
          <span className="flex items-center gap-1 text-xs font-bold"><Star size={13} className="fill-yellow text-yellow-dark" /> {product.rating}</span>
        </div>
        <Link href={`/product/${product.slug}`} className="line-clamp-1 text-base font-black hover:text-turquoise-dark">{product.name}</Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-black">{formatPrice(product.price)}</span>
          {product.compareAt && <span className="text-sm text-ink/35 line-through">{formatPrice(product.compareAt)}</span>}
        </div>
      </div>
    </motion.article>
  );
}
