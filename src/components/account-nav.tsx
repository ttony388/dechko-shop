import Link from "next/link";
import { Heart, LayoutDashboard, MapPin, Package, UserRound } from "lucide-react";

export function AccountNav() {
  const links = [[LayoutDashboard, "Табло", "/account"], [Package, "Поръчки", "/account/orders"], [Heart, "Любими", "/wishlist"], [MapPin, "Адреси", "/account/addresses"], [UserRound, "Профил", "/account/profile"]] as const;
  return <aside className="h-fit rounded-[1.8rem] bg-white p-3">{links.map(([Icon, label, href]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition hover:bg-mint"><Icon size={18} />{label}</Link>)}</aside>;
}
