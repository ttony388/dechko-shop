"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  products: number;
};

type Draft = Omit<CategoryRow, "id" | "products">;
const emptyDraft: Draft = { name: "", slug: "", description: "", color: "#dff8f6" };

export function AdminCategories({ initialCategories }: { initialCategories: CategoryRow[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  function create() {
    setEditingId(null);
    setDraft(emptyDraft);
    setError("");
    setOpen(true);
  }

  function edit(category: CategoryRow) {
    setEditingId(category.id);
    setDraft({
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
    });
    setError("");
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(
      editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      },
    );
    const body = (await response.json().catch(() => null)) as (CategoryRow & { error?: string }) | null;
    if (!response.ok || !body) {
      setError(body?.error || "Категорията не беше запазена.");
      return;
    }
    setCategories((current) =>
      editingId
        ? current.map((category) =>
            category.id === editingId ? { ...body, products: category.products } : category,
          )
        : [...current, { ...body, products: 0 }],
    );
    setOpen(false);
  }

  async function remove(category: CategoryRow) {
    if (!window.confirm(`Да изтрием ли категория „${category.name}“?`)) return;
    const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      window.alert(body?.error || "Категорията не беше изтрита.");
      return;
    }
    setCategories((current) => current.filter((item) => item.id !== category.id));
  }

  return (
    <>
      <section className="overflow-hidden rounded-[1.6rem] bg-white">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-2xl font-black">Категории</h2>
          <Button size="sm" onClick={create}><Plus size={16} /> Добави</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-wider text-ink/45">
              <tr><th className="px-6 py-4">Име</th><th className="px-6 py-4">Slug</th><th className="px-6 py-4">Продукти</th><th className="px-6 py-4">Действия</th></tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t border-ink/5">
                  <td className="px-6 py-4 font-black">{category.name}</td>
                  <td className="px-6 py-4 font-semibold text-ink/55">{category.slug}</td>
                  <td className="px-6 py-4 font-semibold">{category.products}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => edit(category)} aria-label="Редактирай"><Pencil size={17} /></button>
                      <button onClick={() => remove(category)} className="text-coral" aria-label="Изтрий"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {open && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-lg rounded-[2rem] bg-white p-7">
            <div className="flex justify-between"><h2 className="text-2xl font-black">{editingId ? "Редактирай категория" : "Нова категория"}</h2><button type="button" onClick={() => setOpen(false)}><X /></button></div>
            <label className="mt-5 block"><span className="field-label">Име</span><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value, ...(!editingId ? { slug: slugify(event.target.value) } : {}) })} required /></label>
            <label className="mt-4 block"><span className="field-label">Slug</span><Input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })} required /></label>
            <label className="mt-4 block"><span className="field-label">Описание</span><textarea value={draft.description || ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={4} className="w-full rounded-2xl border border-ink/10 p-4 outline-none" /></label>
            <label className="mt-4 block"><span className="field-label">Цвят</span><Input type="color" value={draft.color || "#dff8f6"} onChange={(event) => setDraft({ ...draft, color: event.target.value })} /></label>
            {error && <p className="mt-4 text-sm font-bold text-coral">{error}</p>}
            <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Отказ</Button><Button>Запази</Button></div>
          </form>
        </div>
      )}
    </>
  );
}
