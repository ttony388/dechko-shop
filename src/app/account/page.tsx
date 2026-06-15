import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package } from "lucide-react";

export default function AccountPage() {
  return <div><div className="grid gap-4 sm:grid-cols-3">{[[Package, "3", "Поръчки", "/account/orders"], [Heart, "5", "Любими", "/wishlist"], [MapPin, "2", "Адреси", "/account/addresses"]].map(([Icon, number, label, href]) => { const I = Icon as typeof Package; return <Link href={String(href)} key={String(label)} className="rounded-[1.8rem] bg-white p-6"><I className="mb-6 text-coral" /><p className="text-3xl font-black">{String(number)}</p><p className="text-sm font-bold text-ink/45">{String(label)}</p></Link>; })}</div><div className="mt-5 rounded-[1.8rem] bg-turquoise p-7 text-white"><h2 className="text-2xl font-black">Нова колекция за навън</h2><p className="mt-2 text-white/75">Повече движение, повече смях.</p><Link href="/category/outdoor" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-ink">Разгледай <ArrowRight size={16} /></Link></div></div>;
}
