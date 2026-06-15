"use client";

import { Save, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type InventoryRow = { id: string; name: string; sku: string; stock: number; category: string };

export function AdminInventory({ initialProducts }: { initialProducts: InventoryRow[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query),
    );
  }, [products, search]);

  async function save(product: InventoryRow) {
    const stock = drafts[product.id] ?? product.stock;
    const response = await fetch(`/api/admin/inventory/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock }),
    });
    const body = (await response.json().catch(() => null)) as { stock?: number; error?: string } | null;
    if (!response.ok || body?.stock === undefined) {
      window.alert(body?.error || "Наличността не беше запазена.");
      return;
    }
    setProducts((current) =>
      current.map((candidate) => candidate.id === product.id ? { ...candidate, stock: body.stock! } : candidate),
    );
    setDrafts((current) => {
      const next = { ...current };
      delete next[product.id];
      return next;
    });
  }

  return (
    <section className="overflow-hidden rounded-[1.6rem] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div><h2 className="text-2xl font-black">Наличности</h2><p className="mt-1 text-sm font-bold text-ink/45">{filtered.length} продукта</p></div>
        <label className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" size={17} />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Търси по име или SKU..." className="pl-11" />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wider text-ink/45">
            <tr><th className="px-6 py-4">Продукт</th><th className="px-6 py-4">SKU</th><th className="px-6 py-4">Категория</th><th className="px-6 py-4">Наличност</th><th className="px-6 py-4">Състояние</th><th className="px-6 py-4" /></tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const stock = drafts[product.id] ?? product.stock;
              return (
                <tr key={product.id} className="border-t border-ink/5">
                  <td className="px-6 py-4 font-black">{product.name}</td>
                  <td className="px-6 py-4 font-semibold text-ink/50">{product.sku}</td>
                  <td className="px-6 py-4 font-semibold text-ink/55">{product.category}</td>
                  <td className="px-6 py-4"><Input type="number" min="0" value={stock} onChange={(event) => setDrafts((current) => ({ ...current, [product.id]: Number(event.target.value) }))} className="w-24" /></td>
                  <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${stock <= 7 ? "bg-coral/10 text-coral" : "bg-lime/20"}`}>{stock <= 7 ? "Ниска" : "Наличен"}</span></td>
                  <td className="px-6 py-4"><button onClick={() => save(product)} disabled={drafts[product.id] === undefined} className="disabled:opacity-25" aria-label="Запази"><Save size={18} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
