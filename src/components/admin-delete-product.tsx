"use client";

import { LoaderCircle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminDeleteProduct({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function remove() {
    setDeleting(true);
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const body = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
    setDeleting(false);
    setOpen(false);
    setToast({
      type: response.ok ? "success" : "error",
      text: response.ok ? "Продуктът беше изтрит успешно." : body?.error || "Продуктът не беше изтрит.",
    });
    if (response.ok) router.refresh();
    window.setTimeout(() => setToast(null), 3500);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-ink/35 transition hover:text-coral" aria-label={`Изтрий ${name}`}>
        <Trash2 size={17} />
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/35 p-4 backdrop-blur-sm" onClick={() => !deleting && setOpen(false)}>
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-soft" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-coral">Потвърждение</p>
                <h2 className="mt-2 text-2xl font-black">Изтриване на продукт</h2>
              </div>
              <button onClick={() => setOpen(false)} disabled={deleting} aria-label="Затвори"><X /></button>
            </div>
            <p className="mt-5 font-semibold leading-7 text-ink/60">
              Сигурни ли сте, че искате да изтриете „{name}“? Продуктът ще изчезне от магазина и резултатите.
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={deleting}>Отказ</Button>
              <Button variant="coral" onClick={remove} disabled={deleting}>
                {deleting ? <LoaderCircle size={17} className="animate-spin" /> : <Trash2 size={17} />}
                {deleting ? "Изтриване..." : "Изтрий"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div role="status" className={`fixed bottom-6 right-6 z-[110] rounded-2xl px-5 py-4 text-sm font-black text-white shadow-soft ${toast.type === "success" ? "bg-turquoise-dark" : "bg-coral"}`}>
          {toast.text}
        </div>
      )}
    </>
  );
}
