"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/products";

export type CartItem = {
  product: Product;
  quantity: number;
  variant?: string;
};

type SavedCart = {
  items: CartItem[];
  coupon: { code: string; type: "percent" | "fixed"; value: number } | null;
};

type CartState = {
  items: CartItem[];
  cartContextKey: string;
  savedCarts: Record<string, SavedCart>;
  legacyCartPending: boolean;
  wishlist: string[];
  wishlistUserId: string | null;
  coupon: { code: string; type: "percent" | "fixed"; value: number } | null;
  setCartContext: (userId: string | null) => void;
  addItem: (product: Product, quantity?: number, variant?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  syncItemStock: (id: string, stock: number) => void;
  toggleWishlist: (id: string) => void;
  setWishlistContext: (userId: string | null, productIds: string[]) => void;
  setCoupon: (coupon: CartState["coupon"]) => void;
  clearCart: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cartContextKey: "guest",
      savedCarts: { guest: { items: [], coupon: null } },
      legacyCartPending: false,
      wishlist: [],
      wishlistUserId: null,
      coupon: null,
      setCartContext: (userId) => {
        const nextKey = userId ? `user:${userId}` : "guest";
        const state = get();
        if (state.cartContextKey === nextKey) {
          if (state.legacyCartPending) set({ legacyCartPending: false });
          return;
        }
        if (
          state.legacyCartPending &&
          state.cartContextKey === "guest" &&
          userId
        ) {
          set({
            cartContextKey: nextKey,
            legacyCartPending: false,
            savedCarts: {
              ...state.savedCarts,
              guest: { items: [], coupon: null },
              [nextKey]: { items: state.items, coupon: state.coupon },
            },
          });
          return;
        }
        const savedCarts = {
          ...state.savedCarts,
          [state.cartContextKey]: {
            items: state.items,
            coupon: state.coupon,
          },
        };
        const nextCart = savedCarts[nextKey] || { items: [], coupon: null };
        set({
          cartContextKey: nextKey,
          legacyCartPending: false,
          savedCarts,
          items: nextCart.items,
          coupon: nextCart.coupon,
        });
      },
      addItem: (product, quantity = 1, variant) => {
        if (product.stock <= 0) return;
        const current = get().items.find((item) => item.product.id === product.id && item.variant === variant);
        const nextQuantity = Math.min(product.stock, (current?.quantity || 0) + quantity);
        const items = current
            ? get().items.map((item) =>
                item.product.id === product.id && item.variant === variant
                  ? { ...item, quantity: nextQuantity }
                  : item,
              )
            : [...get().items, { product, quantity: Math.min(product.stock, quantity), variant }];
        setActiveCart(set, get, { items });
      },
      removeItem: (id) => {
        const items = get().items.filter((item) => item.product.id !== id);
        setActiveCart(set, get, { items });
      },
      updateQuantity: (id, quantity) => {
        const items = get().items
          .map((item) =>
            item.product.id === id
              ? { ...item, quantity: Math.min(item.product.stock, quantity) }
              : item,
          )
          .filter((item) => item.quantity > 0);
        setActiveCart(set, get, { items });
      },
      syncItemStock: (id, stock) => {
        const items = get().items.map((item) =>
          item.product.id === id
            ? {
                ...item,
                product: { ...item.product, stock },
                quantity: stock > 0 ? Math.min(item.quantity, stock) : item.quantity,
              }
            : item,
        );
        setActiveCart(set, get, { items });
      },
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
      setCoupon: (coupon) => setActiveCart(set, get, { coupon }),
      clearCart: () => setActiveCart(set, get, { items: [], coupon: null }),
    }),
    {
      name: "dechko-cart-v1",
      version: 3,
      migrate: (persistedState, version) => {
        if (persistedState && typeof persistedState === "object") {
          const previous = persistedState as Partial<CartState>;
          const coupon = version < 2 ? null : previous.coupon || null;
          if (version < 3) {
            const guest = { items: previous.items || [], coupon };
            return {
              ...previous,
              items: guest.items,
              coupon: guest.coupon,
              cartContextKey: "guest",
              savedCarts: { guest },
              legacyCartPending: true,
            };
          }
        }
        return persistedState as CartState;
      },
    },
  ),
);

function setActiveCart(
  set: (partial: Partial<CartState>) => void,
  get: () => CartState,
  partial: Partial<SavedCart>,
) {
  const state = get();
  const cart = {
    items: partial.items ?? state.items,
    coupon: partial.coupon !== undefined ? partial.coupon : state.coupon,
  };
  set({
    ...partial,
    savedCarts: {
      ...state.savedCarts,
      [state.cartContextKey]: cart,
    },
  });
}
