import Link from "next/link";
import { ArrowUpRight, Camera } from "lucide-react";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="mt-20 px-4 pb-4">
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[2.5rem] bg-ink px-6 py-12 text-white md:px-12">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo className="w-fit" />
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">Красиви и смислени неща за детството, подбрани с грижа и изпратени с усмивка.</p>
            <Link href="https://instagram.com" className="mt-6 inline-flex items-center gap-2 text-sm font-bold"><Camera size={18} /> @dechko.shop</Link>
          </div>
          <div>
            <p className="mb-4 font-black text-yellow">Пазаруване</p>
            {["Магазин", "Нови продукти", "Подаръци", "Любими"].map((label, index) => (
              <Link key={label} href={["/shop", "/shop?sort=new", "/category/gifts", "/wishlist"][index]} className="mb-3 block text-sm text-white/70 hover:text-white">{label}</Link>
            ))}
          </div>
          <div>
            <p className="mb-4 font-black text-coral-light">Помощ</p>
            {[
              ["Контакти", "/contact"], ["Често задавани въпроси", "/faq"], ["Доставка и връщане", "/faq#delivery"], ["Общи условия", "/terms"],
            ].map(([label, href]) => <Link key={href} href={href} className="mb-3 flex items-center gap-1 text-sm text-white/70 hover:text-white">{label}<ArrowUpRight size={13} /></Link>)}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:justify-between">
          <p>© 2026 Дечко. Всички права запазени.</p>
          <div className="flex gap-5"><Link href="/privacy">Поверителност</Link><Link href="/terms">Условия</Link></div>
        </div>
      </div>
    </footer>
  );
}
