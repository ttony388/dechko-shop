import { Search } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { getCatalogPage } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q || params.search || "").trim();
  const page = Math.max(1, Number(params.page) || 1);
  const catalog = query ? await getCatalogPage({ search: query, page, limit: 12 }) : null;

  return (
    <div className="container-shell min-h-[60vh] py-14 md:py-20">
      <p className="eyebrow mb-3 text-turquoise-dark">Намери бързо</p>
      <h1 className="section-title">Какво търсите?</h1>
      <form className="relative mt-8 max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-ink/35" />
        <Input name="q" defaultValue={query} autoFocus placeholder="Играчка, книга, подарък..." className="h-16 rounded-full pl-14 text-base shadow-soft" />
      </form>
      {catalog && (
        <>
          <p className="my-8 text-sm font-black text-ink/45">{catalog.pagination.total} резултата за „{query}“</p>
          {catalog.products.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
              {catalog.products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="rounded-[2rem] bg-white p-10 text-center font-bold text-ink/55">Не намерихме продукт с това търсене.</div>
          )}
          {catalog.pagination.pages > 1 && (
            <nav className="mt-12 flex justify-center gap-2">
              {Array.from({ length: catalog.pagination.pages }, (_, index) => index + 1).map((item) => (
                <Link key={item} href={`/search?q=${encodeURIComponent(query)}&page=${item}`} className={`grid h-11 w-11 place-items-center rounded-full font-black ${item === catalog.pagination.page ? "bg-ink text-white" : "bg-white"}`}>{item}</Link>
              ))}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
