"use client";

import {
  Heart,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { useCart } from "@/store/cart";

const links = [
  { href: "/shop", label: "Магазин" },
  { href: "/category/toys", label: "Играчки" },
  { href: "/category/books", label: "Книги" },
  { href: "/category/baby", label: "За бебето" },
  { href: "/contact", label: "Контакти" },
];

type HeaderProps = {
  user: {
    name?: string | null;
    email?: string | null;
    role?: "CUSTOMER" | "ADMIN";
  } | null;
};

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useCart((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const wishlist = useCart((state) => state.wishlist.length);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    function syncBodyOverflow() {
      document.body.style.overflow =
        menuOpen && !desktopQuery.matches ? "hidden" : "";
    }

    syncBodyOverflow();
    desktopQuery.addEventListener("change", syncBodyOverflow);
    return () => {
      desktopQuery.removeEventListener("change", syncBodyOverflow);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function closeMenuWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    function closeDesktopMenu(event: MouseEvent) {
      if (
        window.matchMedia("(min-width: 1024px)").matches &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", closeMenuWithEscape);
    document.addEventListener("mousedown", closeDesktopMenu);
    return () => {
      document.removeEventListener("keydown", closeMenuWithEscape);
      document.removeEventListener("mousedown", closeDesktopMenu);
    };
  }, []);

  return (
    <>
      <div className="w-full bg-ink px-3 py-2 text-center text-[11px] font-bold text-white sm:text-xs">
        Безплатна доставка над €60 · 30 дни за връщане
      </div>

      <header className="sticky top-0 z-50 w-full max-w-full border-b border-ink/5 bg-cream/90 px-3 py-2 backdrop-blur-xl sm:px-4">
        <div className="mx-auto flex min-w-0 max-w-[1440px] items-center justify-between gap-2 sm:gap-4">
          <Logo className="min-w-0 max-w-[116px] overflow-hidden sm:max-w-none [&_img]:h-8 sm:[&_img]:h-12" />

          <nav className="hidden items-center gap-7 rounded-full bg-white px-7 py-3 shadow-soft lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-bold text-ink/75 transition hover:text-turquoise-dark"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div
            ref={menuRef}
            className="relative flex shrink-0 items-center gap-0.5 sm:gap-2"
          >
            <Link href="/search" aria-label="Търсене" className="icon-button grid">
              <Search size={19} />
            </Link>
            <Link
              href="/wishlist"
              aria-label="Любими"
              className="icon-button relative hidden min-[390px]:grid"
            >
              <Heart size={19} />
              {wishlist > 0 && <span className="count-badge">{wishlist}</span>}
            </Link>
            <Link
              href={user ? "/account" : "/login"}
              aria-label={user ? "Профил" : "Вход"}
              className="icon-button hidden md:grid"
            >
              <UserRound size={19} />
            </Link>
            <Link
              href="/cart"
              aria-label="Количка"
              className="icon-button relative grid bg-yellow"
            >
              <ShoppingBag size={19} />
              {count > 0 && <span className="count-badge">{count}</span>}
            </Link>

            <button
              type="button"
              className="icon-button grid rounded-xl border border-ink/35"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label={menuOpen ? "Затвори меню" : "Отвори меню"}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>

            {menuOpen && (
              <div
                id="site-menu"
                className="absolute right-0 top-[calc(100%+12px)] hidden w-72 overflow-hidden rounded-[1.4rem] border border-ink/5 bg-white p-2 shadow-soft lg:block"
              >
                <div className="grid border-b border-ink/8 pb-2">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-xl px-4 py-2.5 text-sm font-black hover:bg-mint"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="grid pt-2">
                  {user ? (
                    <>
                      <div className="px-4 pb-2 pt-1">
                        <p className="font-black">
                          {user.name || "Моят профил"}
                        </p>
                        <p className="truncate text-xs font-bold text-ink/45">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/account"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-black hover:bg-mint"
                      >
                        <UserRound size={17} /> Моят профил
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-black hover:bg-mint"
                        >
                          <Menu size={17} /> Администрация
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black text-coral hover:bg-coral/10"
                      >
                        <LogOut size={17} /> Изход
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-black hover:bg-mint"
                      >
                        <LogIn size={17} /> Вход
                      </Link>
                      <Link
                        href="/register"
                        className="flex items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm font-black text-white"
                      >
                        <UserPlus size={17} /> Регистрация
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-[80] overflow-hidden bg-ink/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <nav
            id="mobile-site-menu"
            aria-label="Мобилна навигация"
            className="ml-auto flex h-dvh w-[min(88%,360px)] max-w-full flex-col overflow-y-auto bg-cream p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-7 flex min-w-0 items-center justify-between gap-3">
              <Logo className="min-w-0 max-w-[180px] overflow-hidden [&_img]:h-10" />
              <button
                type="button"
                className="icon-button grid shrink-0 rounded-xl border border-ink/35 bg-white"
                onClick={() => setMenuOpen(false)}
                aria-label="Затвори меню"
              >
                <X size={21} />
              </button>
            </div>

            <div className="flex flex-col">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-b border-ink/10 py-4 text-xl font-black"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-auto grid gap-3 border-t border-ink/10 pt-6">
              {user ? (
                <>
                  <Link
                    href="/account"
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-white font-black shadow-soft"
                  >
                    <UserRound size={18} /> Моят профил
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex h-12 items-center justify-center rounded-full border border-ink/15 font-black"
                    >
                      Администрация
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex h-12 items-center justify-center gap-2 rounded-full text-sm font-black text-coral"
                  >
                    <LogOut size={18} /> Изход
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-white font-black shadow-soft"
                  >
                    <LogIn size={18} /> Вход
                  </Link>
                  <Link
                    href="/register"
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink font-black text-white"
                  >
                    <UserPlus size={18} /> Регистрация
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
