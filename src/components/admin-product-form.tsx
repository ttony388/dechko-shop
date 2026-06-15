"use client";

import { ImagePlus, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils";

type CategoryOption = { id: string; name: string };
type InitialProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string[];
  regularPrice: number;
  salePrice: number | null;
  sku: string;
  stock: number;
  badge: string | null;
  brand: string | null;
  tags: string[];
  ageGroup: string | null;
  gender: "NEUTRAL" | "GIRLS" | "BOYS";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  featured: boolean;
  categoryIds: string[];
  imageUrl: string;
  colors: string[];
};

export function AdminProductForm({
  categories,
  product,
}: {
  categories: CategoryOption[];
  product?: InitialProduct;
}) {
  const router = useRouter();
  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [image, setImage] = useState<File | null>(null);
  const [categoryIds, setCategoryIds] = useState(product?.categoryIds || []);
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
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: uploadData });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadResult.error || "Снимката не беше качена.");
        imageUrl = uploadResult.url;
      }
      if (!imageUrl) throw new Error("Изберете снимка или въведете URL.");
      if (!categoryIds.length) throw new Error("Изберете поне една категория.");

      const list = (field: string, separator: string | RegExp) =>
        String(form.get(field) || "")
          .split(separator)
          .map((item) => item.trim())
          .filter(Boolean);
      const salePriceValue = String(form.get("salePrice") || "").trim();
      const payload = {
        name,
        slug: slug || suggestedSlug,
        description: form.get("description"),
        details: list("details", "\n"),
        price: Number(form.get("price")),
        salePrice: salePriceValue ? Number(salePriceValue) : null,
        sku: form.get("sku"),
        stock: Number(form.get("stock")),
        badge: form.get("badge") || null,
        brand: form.get("brand") || null,
        tags: list("tags", ","),
        ageGroup: form.get("ageGroup") || null,
        gender: form.get("gender"),
        status: form.get("status"),
        featured: form.get("featured") === "on",
        categoryIds,
        imageUrl,
        colors: list("colors", ","),
      };

      const response = await fetch(
        product ? `/api/admin/products/${product.id}` : "/api/admin/products",
        {
          method: product ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Продуктът не беше записан.");
      router.push("/admin/products");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Възникна неочаквана грешка.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-[1.8rem] bg-white p-6 md:p-8">
        <h2 className="mb-6 text-xl font-black">Основна информация</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Име на продукта *">
            <Input
              name="name"
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!slugEdited) setSlug(slugify(event.target.value));
              }}
            />
          </Field>
          <Field label="Slug *">
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
          </Field>
          <Field label="SKU *">
            <Input name="sku" required defaultValue={product?.sku} />
          </Field>
          <Field label="Марка / колекция">
            <Input name="brand" defaultValue={product?.brand || ""} />
          </Field>
          <Field label="Редовна цена (€) *">
            <Input name="price" type="number" min="0.01" step="0.01" required defaultValue={product?.regularPrice} />
          </Field>
          <Field label="Промоционална цена (€)">
            <Input name="salePrice" type="number" min="0.01" step="0.01" defaultValue={product?.salePrice || ""} />
          </Field>
          <Field label="Наличност *">
            <Input name="stock" type="number" min="0" step="1" required defaultValue={product?.stock ?? 1} />
          </Field>
          <Field label="Етикет">
            <Input name="badge" defaultValue={product?.badge || ""} placeholder="Ново, Намаление..." />
          </Field>
          <Field label="Възрастова група">
            <select name="ageGroup" defaultValue={product?.ageGroup || ""} className={selectClass}>
              <option value="">Без ограничение</option>
              {["0-2 г.", "3-5 г.", "6-8 г.", "9-12 г.", "12+ г."].map((age) => <option key={age}>{age}</option>)}
            </select>
          </Field>
          <Field label="Пол">
            <select name="gender" defaultValue={product?.gender || "NEUTRAL"} className={selectClass}>
              <option value="NEUTRAL">Неутрално</option>
              <option value="GIRLS">Момичета</option>
              <option value="BOYS">Момчета</option>
            </select>
          </Field>
        </div>

        <div className="mt-5">
          <span className="field-label">Категории *</span>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-black">
                <input
                  type="checkbox"
                  checked={categoryIds.includes(category.id)}
                  onChange={(event) => setCategoryIds((current) =>
                    event.target.checked
                      ? [...current, category.id]
                      : current.filter((id) => id !== category.id),
                  )}
                  className="h-5 w-5 accent-[#20c4c8]"
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>
        <Field label="Описание *" className="mt-5">
          <textarea name="description" required minLength={10} rows={5} defaultValue={product?.description} className={textareaClass} />
        </Field>
        <Field label="Характеристики, по една на ред" className="mt-5">
          <textarea name="details" rows={4} defaultValue={product?.details.join("\n")} className={textareaClass} />
        </Field>
        <Field label="Тагове, разделени със запетая" className="mt-5">
          <Input name="tags" defaultValue={product?.tags.join(", ")} placeholder="дървени, образователни, подарък" />
        </Field>
        <Field label="Цветове, разделени със запетая" className="mt-5">
          <Input name="colors" defaultValue={product?.colors.join(", ")} placeholder="Тюркоаз, Корал, Жълто" />
        </Field>
      </section>

      <section className="rounded-[1.8rem] bg-white p-6 md:p-8">
        <h2 className="mb-6 text-xl font-black">Снимка</h2>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-ink/15 bg-cream px-6 py-10 text-center transition hover:border-turquoise">
          <ImagePlus size={32} className="mb-3 text-turquoise-dark" />
          <span className="font-black">{image ? image.name : "Изберете снимка от компютъра"}</span>
          <span className="mt-1 text-xs font-bold text-ink/45">JPG, PNG, WebP или AVIF · максимум 8 MB</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(event) => setImage(event.target.files?.[0] || null)} />
        </label>
        <Field label="Или URL на снимка" className="mt-5">
          <Input name="imageUrl" type="url" defaultValue={product?.imageUrl} placeholder="https://..." />
        </Field>
      </section>

      <section className="rounded-[1.8rem] bg-white p-6 md:p-8">
        <h2 className="mb-5 text-xl font-black">Публикуване</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Статус">
            <select name="status" defaultValue={product?.status || "ACTIVE"} className={selectClass}>
              <option value="DRAFT">Чернова</option>
              <option value="ACTIVE">Активен</option>
              <option value="ARCHIVED">Архивиран</option>
            </select>
          </Field>
          <label className="flex items-center gap-3 self-end pb-3 text-sm font-black">
            <input type="checkbox" name="featured" defaultChecked={product?.featured} className="h-5 w-5 accent-[#20c4c8]" />
            Покажи сред избраните
          </label>
        </div>
      </section>

      {error && <p role="alert" className="rounded-2xl bg-coral/10 p-4 text-sm font-black text-coral">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "Записване..." : product ? "Запази промените" : "Запази продукт"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={`block ${className}`}><span className="field-label">{label}</span>{children}</label>;
}

const selectClass = "h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm outline-none focus:border-turquoise";
const textareaClass = "w-full rounded-2xl border border-ink/10 p-4 text-sm outline-none focus:border-turquoise";
