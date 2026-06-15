import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Gift, HeartHandshake, PackageCheck, Quote, Sparkles, Truck } from "lucide-react";
import { Float, Reveal } from "@/components/reveal";
import { ProductCard } from "@/components/product-card";
import {
  getCatalogCategories,
  getCatalogProducts,
} from "@/lib/catalog";

const reviews = [
  { text: "Опаковката беше толкова красива, че подаръкът направи впечатление още преди да бъде отворен.", name: "Елена, Варна" },
  { text: "Най-после магазин с внимателно подбрани детски неща, а не безкраен каталог.", name: "Мария, София" },
  { text: "Колелото пристигна на следващия ден и качеството е наистина страхотно.", name: "Николай, Пловдив" },
];

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts(),
  ]);
  const featuredProducts = products.filter((product) => product.featured);
  const newProducts = products.filter((product) => product.isNew);
  return (
    <>
      <section className="container-shell relative mt-4 min-h-[680px] overflow-hidden rounded-[2.8rem] bg-[#f7ead7] md:min-h-[760px]">
        <Image src="/hero-shop.png" alt="Подбрани детски играчки и аксесоари" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fff8eb] via-[#fff8eb]/78 to-transparent" />
        <div className="relative z-10 flex min-h-[680px] max-w-3xl flex-col justify-center px-6 py-20 md:min-h-[760px] md:px-14 lg:px-20">
          <Reveal>
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black shadow-soft">
              <Sparkles size={15} className="text-coral" /> Нов сезон, нови открития
            </span>
            <h1 className="display-title max-w-[750px]">Големи усмивки в <span className="text-coral">малки</span> пакети.</h1>
            <p className="mt-7 max-w-xl text-base font-semibold leading-8 text-ink/67 md:text-lg">Подбрани играчки, книги и красиви неща, които превръщат всеки ден в ново приключение.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex h-14 items-center gap-2 rounded-full bg-ink px-8 font-black text-white shadow-soft transition hover:-translate-y-1">Пазарувай сега <ArrowRight size={18} /></Link>
              <Link href="/category/gifts" className="inline-flex h-14 items-center rounded-full bg-white/90 px-8 font-black shadow-soft transition hover:-translate-y-1">Идеи за подарък</Link>
            </div>
          </Reveal>
        </div>
        <Float className="absolute right-[4%] top-[8%] hidden h-24 w-24 place-items-center rounded-[2rem] bg-yellow text-4xl shadow-soft md:grid">★</Float>
        <Float className="absolute bottom-[7%] left-[44%] hidden rounded-full bg-white px-5 py-3 text-sm font-black shadow-soft lg:block" delay={1}>4.9 ★ от щастливи родители</Float>
      </section>

      <section className="section-space container-shell">
        <Reveal className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="eyebrow mb-3 text-turquoise-dark">Открий по интерес</p><h2 className="section-title">Малки светове<br />за големи идеи.</h2></div>
          <Link href="/shop" className="inline-flex items-center gap-2 font-black">Всички категории <ArrowRight size={18} /></Link>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {categories.map((category, index) => (
            <Reveal key={category.slug} delay={index * 0.045}>
              <Link href={`/category/${category.slug}`} className="group flex min-h-52 flex-col justify-between overflow-hidden rounded-[2rem] p-5 transition hover:-translate-y-1.5" style={{ background: category.color }}>
                <span className="text-5xl transition duration-300 group-hover:rotate-6 group-hover:scale-110">{category.icon}</span>
                <div><h3 className="text-xl font-black">{category.name}</h3><p className="mt-1 hidden text-sm text-ink/55 sm:block">{category.description}</p></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="container-shell">
          <Reveal className="mb-10 flex items-end justify-between"><div><p className="eyebrow mb-3 text-coral">Най-обичани</p><h2 className="section-title">Дечко фаворити.</h2></div><Link href="/shop?sort=popular" className="hidden items-center gap-2 font-black sm:flex">Виж всички <ArrowRight size={18} /></Link></Reveal>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">{featuredProducts.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </div>
      </section>

      <section className="section-space container-shell">
        <div className="relative overflow-hidden rounded-[2.8rem] bg-turquoise px-6 py-14 md:px-14 md:py-20">
          <div className="blob -right-16 -top-20 h-72 w-72 bg-yellow/80" />
          <div className="blob bottom-[-8rem] left-[45%] h-80 w-80 bg-lime/70" />
          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <p className="eyebrow mb-4 text-white">Творческа селекция</p>
              <h2 className="section-title max-w-xl text-white">Цветове без правила. Идеи без край.</h2>
              <p className="mt-6 max-w-lg font-semibold leading-8 text-white/80">Комплекти, с които малките ръце рисуват, строят, изрязват и измислят.</p>
              <Link href="/category/arts-crafts" className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-white px-7 font-black shadow-soft">Към творческите комплекти <ArrowRight size={18} /></Link>
            </Reveal>
            <Reveal className="relative aspect-square overflow-hidden rounded-[2.3rem] shadow-soft">
              <Image src="/creative-kit.png" alt="Творчески комплект за деца" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="container-shell pb-24">
        <Reveal className="mb-10"><p className="eyebrow mb-3 text-lime">Току-що пристигнаха</p><h2 className="section-title">Нови причини за игра.</h2></Reveal>
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">{newProducts.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <section className="container-shell overflow-hidden rounded-[2.8rem] bg-[#ffe0d5]">
        <div className="grid min-h-[620px] lg:grid-cols-2">
          <div className="relative min-h-[420px]"><Image src="/playroom.png" alt="Деца играят с дървени играчки" fill className="object-cover object-left" sizes="(max-width: 1024px) 100vw, 50vw" /></div>
          <Reveal className="flex flex-col justify-center p-8 md:p-14">
            <p className="eyebrow mb-4 text-coral">Подарък от нас</p>
            <h2 className="section-title">-10% за първата малка радост.</h2>
            <p className="mt-6 max-w-lg text-base font-semibold leading-8 text-ink/65">Използвай код <strong className="rounded-lg bg-white px-2 py-1 text-ink">DECHKO10</strong> при първата си поръчка.</p>
            <Link href="/shop" className="mt-8 inline-flex h-14 w-fit items-center gap-2 rounded-full bg-coral px-8 font-black text-white shadow-soft">Избери подарък <Gift size={19} /></Link>
          </Reveal>
        </div>
      </section>

      <section className="section-space container-shell">
        <Reveal className="text-center"><p className="eyebrow mb-3 text-turquoise-dark">Думи от родители</p><h2 className="section-title">Споделена радост.</h2></Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {reviews.map((review, index) => (
            <Reveal key={review.name} delay={index * .08} className="rounded-[2rem] bg-white p-7 shadow-soft">
              <Quote className="mb-8 text-yellow" size={34} fill="currentColor" />
              <p className="text-lg font-bold leading-8">“{review.text}”</p>
              <p className="mt-7 text-sm font-black text-ink/45">{review.name}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-shell grid gap-3 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Truck, "Бърза доставка", "До 1-3 работни дни"],
          [BadgeCheck, "Проверено качество", "Подбрани материали"],
          [PackageCheck, "Лесно връщане", "До 30 дни"],
          [HeartHandshake, "Тук сме за теб", "Истинска човешка грижа"],
        ].map(([Icon, title, copy]) => {
          const BenefitIcon = Icon as typeof Truck;
          return <div key={String(title)} className="flex items-center gap-4 rounded-[1.6rem] bg-white p-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint"><BenefitIcon size={22} /></span><div><p className="font-black">{String(title)}</p><p className="text-xs font-semibold text-ink/50">{String(copy)}</p></div></div>;
        })}
      </section>

      <section className="container-shell">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {["/creative-kit.png", "/playroom.png", "/hero-shop.png", "/creative-kit.png"].map((src, index) => <Reveal key={index} delay={index * .06} className="relative aspect-square overflow-hidden rounded-[1.8rem]"><Image src={src} alt={`Дечко вдъхновение ${index + 1}`} fill className="object-cover transition duration-700 hover:scale-105" /></Reveal>)}
        </div>
      </section>

      <section className="section-space container-shell">
        <Reveal className="relative overflow-hidden rounded-[2.8rem] bg-yellow px-6 py-16 text-center md:py-24">
          <Float className="absolute left-[7%] top-[20%] text-5xl">✿</Float><Float className="absolute bottom-[15%] right-[8%] text-5xl" delay={1}>★</Float>
          <p className="eyebrow mb-4 text-coral">Време е за игра</p>
          <h2 className="section-title mx-auto max-w-4xl">Нека намерим следващото любимо нещо.</h2>
          <Link href="/shop" className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-ink px-8 font-black text-white shadow-soft">Разгледай магазина <ArrowRight size={18} /></Link>
        </Reveal>
      </section>
    </>
  );
}
