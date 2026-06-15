"use client";

import { ImagePlus, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils";

type CategoryOption = {
  id: string;
  name: string;
};

export function AdminProductForm({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const suggestedSlug = useMemo(() => slugify(name), [name]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const form = new FormData(event.currentTarget);
      let imageUrl = String(form.get("imageUrl") || "").trim();

      if (image) {
        const uploadData = new FormData();
        uploadData.set("file", image);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || "Снимката не беше качена.");
        }
        imageUrl = uploadResult.url;
      }

      if (!imageUrl) throw new Error("Изберете снимка или въведете URL.");

      const colors = String(form.get("colors") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const details = String(form.get("details") || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      const compareAtValue = String(form.get("compareAt") || "").trim();

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || suggestedSlug,
          description: form.get("description"),
          details,
          price: Number(form.get("price")),
          compareAt: compareAtValue ? Number(compareAtValue) : null,
          sku: form.get("sku"),
          stock: Number(form.get("stock")),
          badge: form.get("badge") || null,
          featured: form.get("featured") === "on",
          active: form.get("active") === "on",
          categoryId: form.get("categoryId"),
          imageUrl,
          colors,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Продуктът не беше записан.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Възникна неочаквана грешка.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-[1.8rem] bg-white p-6 md:p-8">
        <h2 className="mb-6 text-xl font-black">Основна информация</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="field-label">Име на продукта *</span>
            <Input
              name="name"
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!slugEdited) setSlug(slugify(event.target.value));
              }}
            />
          </label>
          <label>
            <span className="field-label">Slug *</span>
            <Input
              name="slug"
              required
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(slugify(event.target.value));
              }}
              placeholder={suggestedSlug}
            />
          </label>
          <label>
            <span className="field-label">Категория *</span>
            <select
              name="categoryId"
              required
              className="h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm outline-none focus:border-turquoise"
            >
              <option value="">Изберете категория</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">SKU *</span>
            <Input name="sku" required placeholder="DCH-TOY-001" />
          </label>
          <label>
            <span className="field-label">Цена (€) *</span>
            <Input
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
          </label>
          <label>
            <span className="field-label">Стара цена (€)</span>
            <Input
              name="compareAt"
              type="number"
              min="0.01"
              step="0.01"
            />
          </label>
          <label>
            <span className="field-label">Наличност *</span>
            <Input
              name="stock"
              type="number"
              min="0"
              step="1"
              defaultValue="1"
              required
            />
          </label>
          <label>
            <span className="field-label">Етикет</span>
            <Input name="badge" placeholder="Ново, Намаление..." />
          </label>
        </div>
        <label className="mt-5 block">
          <span className="field-label">Описание *</span>
          <textarea
            name="description"
            required
            minLength={10}
            rows={5}
            className="w-full rounded-2xl border border-ink/10 p-4 text-sm outline-none focus:border-turquoise"
          />
        </label>
        <label className="mt-5 block">
          <span className="field-label">
            Характеристики, по една на ред
          </span>
          <textarea
            name="details"
            rows={4}
            placeholder={"Безопасни материали\nПодходящо за 3+ години"}
            className="w-full rounded-2xl border border-ink/10 p-4 text-sm outline-none focus:border-turquoise"
          />
        </label>
        <label className="mt-5 block">
          <span className="field-label">
            Цветове, разделени със запетая
          </span>
          <Input name="colors" placeholder="Тюркоаз, Корал, Жълто" />
        </label>
      </section>

      <section className="rounded-[1.8rem] bg-white p-6 md:p-8">
        <h2 className="mb-6 text-xl font-black">Снимка</h2>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-ink/15 bg-cream px-6 py-10 text-center transition hover:border-turquoise">
          <ImagePlus size={32} className="mb-3 text-turquoise-dark" />
          <span className="font-black">
            {image ? image.name : "Изберете снимка от компютъра"}
          </span>
          <span className="mt-1 text-xs font-bold text-ink/45">
            JPG, PNG, WebP или AVIF · максимум 8 MB
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(event) => setImage(event.target.files?.[0] || null)}
          />
        </label>
        <label className="mt-5 block">
          <span className="field-label">Или URL на снимка</span>
          <Input name="imageUrl" type="url" placeholder="https://..." />
        </label>
      </section>

      <section className="rounded-[1.8rem] bg-white p-6 md:p-8">
        <h2 className="mb-5 text-xl font-black">Публикуване</h2>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 text-sm font-black">
            <input
              type="checkbox"
              name="active"
              defaultChecked
              className="h-5 w-5 accent-[#20c4c8]"
            />
            Активен продукт
          </label>
          <label className="flex items-center gap-3 text-sm font-black">
            <input
              type="checkbox"
              name="featured"
              className="h-5 w-5 accent-[#20c4c8]"
            />
            Покажи сред избраните
          </label>
        </div>
      </section>

      {error && (
        <p className="rounded-2xl bg-coral/10 p-4 text-sm font-black text-coral">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Записване..." : "Запази продукт"}
        </Button>
      </div>
    </form>
  );
}
