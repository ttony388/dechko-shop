"use client";

import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/products";
import { useCart } from "@/store/cart";

export function ProductActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState(product.colors[0]);
  const addItem = useCart((state) => state.addItem);
  const toggleWishlist = useCart((state) => state.toggleWishlist);
  const wished = useCart((state) => state.wishlist.includes(product.id));

  return (
    <div>
      <div className="mb-6"><p className="mb-3 text-sm font-black">Цвят: {variant}</p><div className="flex flex-wrap gap-2">{product.colors.map((color, index) => <button key={color} onClick={() => setVariant(color)} className={`rounded-full border-2 px-4 py-2 text-sm font-bold ${variant === color ? "border-ink bg-white" : "border-transparent bg-white/65"}`}><span className={["bg-turquoise", "bg-coral", "bg-yellow"][index] + " mr-2 inline-block h-3 w-3 rounded-full"} />{color}</button>)}</div></div>
      <div className="flex flex-wrap gap-3">
        <div className="flex h-14 items-center rounded-full bg-white px-2 shadow-soft"><button className="grid h-10 w-10 place-items-center" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={17} /></button><span className="w-8 text-center font-black">{quantity}</span><button className="grid h-10 w-10 place-items-center" onClick={() => setQuantity(quantity + 1)}><Plus size={17} /></button></div>
        <Button size="lg" className="flex-1" onClick={() => addItem(product, quantity, variant)}><ShoppingBag size={19} /> Добави в количката</Button>
        <Button size="lg" variant="secondary" aria-label="Добави в любими" onClick={() => toggleWishlist(product.id)}><Heart className={wished ? "fill-coral text-coral" : ""} /></Button>
      </div>
    </div>
  );
}
