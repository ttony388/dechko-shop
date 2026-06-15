"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/products";

export type CartItem = {
  product: Product;
  quantity: number;
  variant?: string;
};

type CartState = {
  items: CartItem[];
  wishlist: string[];
  coupon: string | null;
  addItem: (product: Product, quantity?: number, variant?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleWishlist: (id: string) => void;
  applyCoupon: (code: string) => boolean;
  clearCart: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      coupon: null,
      addItem: (product, quantity = 1, variant) => {
        const current = get().items.find((item) => item.product.id === product.id && item.variant === variant);
        set({
          items: current
            ? get().items.map((item) =>
                item.product.id === product.id && item.variant === variant
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              )
            : [...get().items, { product, quantity, variant }],
        });
      },
      removeItem: (id) => set({ items: get().items.filter((item) => item.product.id !== id) }),
      updateQuantity: (id, quantity) =>
        set({
          items: get().items
            .map((item) => (item.product.id === id ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0),
        }),
      toggleWishlist: (id) =>
        set({
          wishlist: get().wishlist.includes(id)
            ? get().wishlist.filter((item) => item !== id)
            : [...get().wishlist, id],
        }),
      applyCoupon: (code) => {
        const valid = ["DECHKO10", "WELCOME"].includes(code.trim().toUpperCase());
        if (valid) set({ coupon: code.trim().toUpperCase() });
        return valid;
      },
      clearCart: () => set({ items: [], coupon: null }),
    }),
    { name: "dechko-cart-v1" },
  ),
);
