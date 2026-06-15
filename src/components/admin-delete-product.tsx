"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminDeleteProduct({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!window.confirm(`Да изтрием ли „${name}“?`)) return;
    setDeleting(true);
    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (response.ok) router.refresh();
    else {
      setDeleting(false);
      window.alert("Продуктът не беше изтрит.");
    }
  }

  return (
    <button
      onClick={remove}
      disabled={deleting}
      className="text-ink/35 transition hover:text-coral disabled:opacity-40"
      aria-label={`Изтрий ${name}`}
    >
      <Trash2 size={17} />
    </button>
  );
}
