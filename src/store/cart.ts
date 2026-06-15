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
  coupon: { code: string; type: "percent" | "fixed"; value: number } | null;
  addItem: (product: Product, quantity?: number, variant?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleWishlist: (id: string) => void;
  setWishlistContext: (userId: string | null, productIds: string[]) => void;
  setCoupon: (coupon: CartState["coupon"]) => void;
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
        if (product.stock <= 0) return;
        const current = get().items.find((item) => item.product.id === product.id && item.variant === variant);
        const nextQuantity = Math.min(product.stock, (current?.quantity || 0) + quantity);
        set({
          items: current
            ? get().items.map((item) =>
                item.product.id === product.id && item.variant === variant
                  ? { ...item, quantity: nextQuantity }
                  : item,
              )
            : [...get().items, { product, quantity: Math.min(product.stock, quantity), variant }],
        });
      },
      removeItem: (id) => set({ items: get().items.filter((item) => item.product.id !== id) }),
      updateQuantity: (id, quantity) =>
        set({
          items: get().items
            .map((item) =>
              item.product.id === id
                ? { ...item, quantity: Math.min(item.product.stock, quantity) }
                : item,
            )
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
      setCoupon: (coupon) => set({ coupon }),
      clearCart: () => set({ items: [], coupon: null }),
    }),
    {
      name: "dechko-cart-v1",
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2 && persistedState && typeof persistedState === "object") {
          return { ...persistedState, coupon: null };
        }
        return persistedState as CartState;
      },
    },
  ),
);
