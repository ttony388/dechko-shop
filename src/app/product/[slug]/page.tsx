import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductActions } from "@/components/product-actions";
import { ProductCard } from "@/components/product-card";
import {
  getCatalogProduct,
  getCatalogProducts,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getCatalogProduct((await params).slug);
  return { title: product?.name || "Продукт", description: product?.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getCatalogProduct((await params).slug);
  if (!product) notFound();
  const products = await getCatalogProducts();
  const related = products.filter((item) => item.categorySlug === product.categorySlug && item.id !== product.id).slice(0, 4);
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: product.name, image: product.image, description: product.description, offers: { "@type": "Offer", priceCurrency: "EUR", price: product.price, availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" }, aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviews } };
  return (
    <div className="container-shell py-8 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mb-7 flex flex-wrap items-center gap-2 text-xs font-bold text-ink/45"><Link href="/">Начало</Link><ChevronRight size={13} /><Link href={`/category/${product.categorySlug}`}>{product.category}</Link><ChevronRight size={13} /><span>{product.name}</span></div>
      <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr]">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((index) => <div key={index} className={`relative overflow-hidden rounded-[2rem] bg-mint ${index === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"}`}><Image src={product.image} alt={`${product.name} - изглед ${index + 1}`} fill priority={index === 0} className="object-cover transition duration-500 hover:scale-110" style={{ objectPosition: product.imagePosition }} sizes={index === 0 ? "(max-width: 1024px) 100vw, 55vw" : "30vw"} unoptimized={product.image.startsWith("http")} /></div>)}
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start lg:pl-8">
          <p className="eyebrow mb-4 text-turquoise-dark">{product.category}</p>
          <h1 className="text-4xl font-black leading-[1.02] tracking-[-.045em] md:text-6xl">{product.name}</h1>
          <div className="mt-4 flex items-center gap-3"><span className="flex items-center gap-1 font-black"><Star size={17} className="fill-yellow text-yellow-dark" /> {product.rating}</span><a href="#reviews" className="text-sm font-bold text-ink/45 underline">{product.reviews} отзива</a></div>
          <div className="my-6 flex items-end gap-3"><span className="text-3xl font-black">{formatPrice(product.price)}</span>{product.compareAt && <span className="pb-1 text-lg text-ink/35 line-through">{formatPrice(product.compareAt)}</span>}</div>
          <p className="mb-7 font-semibold leading-8 text-ink/65">{product.description}</p>
          <ProductActions product={product} />
          <div className="mt-8 grid gap-3 rounded-[1.7rem] bg-white p-5 text-sm font-bold sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <span className="flex items-center gap-2"><Truck size={18} className="text-turquoise-dark" /> 1-3 дни</span>
            <span className="flex items-center gap-2"><RotateCcw size={18} className="text-coral" /> 30 дни връщане</span>
            <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-lime" /> Сигурно плащане</span>
          </div>
          <div className="mt-8 border-t border-ink/10 pt-7"><h2 className="mb-4 text-lg font-black">Защо ще го обикнете</h2>{product.details.map((detail) => <p key={detail} className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink/65"><Check size={17} className="text-lime" />{detail}</p>)}</div>
        </div>
      </div>
      <section id="reviews" className="section-space"><div className="rounded-[2.4rem] bg-white p-7 md:p-12"><p className="eyebrow mb-4 text-yellow-dark">Отзиви</p><div className="grid gap-8 md:grid-cols-[.5fr_1fr]"><div><p className="text-7xl font-black">{product.rating}</p><div className="my-3 flex text-yellow-dark">{Array.from({ length: 5 }).map((_, i) => <Star key={i} fill="currentColor" />)}</div><p className="text-sm font-bold text-ink/45">От {product.reviews} проверени покупки</p></div><div className="space-y-4">{["Прекрасно качество и много красиви цветове.", "Детето ми не го оставя от деня, в който пристигна."].map((text, i) => <div key={text} className="rounded-2xl bg-cream p-5"><p className="font-bold">{text}</p><p className="mt-3 text-xs font-black text-ink/40">{i ? "Анна П." : "Мила Д."} · Проверена покупка</p></div>)}</div></div></div></section>
      <section><p className="eyebrow mb-3 text-coral">Може да харесате</p><h2 className="section-title mb-10">Още малки радости.</h2><div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>
    </div>
  );
}
