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
  wishlistUserId: string | null;
  coupon: string | null;
  addItem: (product: Product, quantity?: number, variant?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleWishlist: (id: string) => void;
  setWishlistContext: (userId: string | null, productIds: string[]) => void;
  applyCoupon: (code: string) => boolean;
  clearCart: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      wishlistUserId: null,
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
      toggleWishlist: (id) => {
        const previous = get().wishlist;
        const wished = !previous.includes(id);
        set({
          wishlist: wished ? [...previous, id] : previous.filter((item) => item !== id),
        });
        if (get().wishlistUserId) {
          void fetch("/api/account/wishlist", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: id, wished }),
          }).then((response) => {
            if (!response.ok) set({ wishlist: previous });
          }).catch(() => set({ wishlist: previous }));
        }
      },
      setWishlistContext: (userId, productIds) => {
        const previousUserId = get().wishlistUserId;
        if (userId) {
          set({ wishlistUserId: userId, wishlist: productIds });
        } else if (previousUserId) {
          set({ wishlistUserId: null, wishlist: [] });
        } else {
          set({ wishlistUserId: null });
        }
      },
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
