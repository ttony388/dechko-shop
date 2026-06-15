"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/store/cart";

export function Providers({
  children,
  userId,
  wishlist,
}: {
  children: React.ReactNode;
  userId: string | null;
  wishlist: string[];
}) {
  const pathname = usePathname();
  const setWishlistContext = useCart((state) => state.setWishlistContext);

  useEffect(() => {
    setWishlistContext(userId, wishlist);
  }, [setWishlistContext, userId, wishlist]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
