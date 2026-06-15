"use client";

import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AccountAddress = {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type AddressDraft = Omit<AccountAddress, "id">;

const emptyAddress: AddressDraft = {
  label: "Дом",
  firstName: "",
  lastName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  postalCode: "",
  country: "BG",
  isDefault: false,
};

export function AddressesClient({ initialAddresses }: { initialAddresses: AccountAddress[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AddressDraft>(emptyAddress);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function startCreate() {
    setEditingId(null);
    setDraft({ ...emptyAddress, isDefault: addresses.length === 0 });
    setMessage("");
    setOpen(true);
  }

  function startEdit(address: AccountAddress) {
    const { id, ...values } = address;
    setEditingId(id);
    setDraft(values);
    setMessage("");
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        editingId ? `/api/account/addresses/${editingId}` : "/api/account/addresses",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );
      const body = (await response.json().catch(() => null)) as
        | (AccountAddress & { error?: string })
        | null;
      if (!response.ok || !body) {
        setMessage(body?.error || "Не успяхме да запазим адреса.");
        return;
      }
      setAddresses((current) => {
        const next = editingId
          ? current.map((address) => (address.id === editingId ? body : address))
          : [...current, body];
        return body.isDefault
          ? next.map((address) => ({ ...address, isDefault: address.id === body.id }))
          : next;
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(address: AccountAddress) {
    if (!window.confirm(`Да изтрием ли адрес „${address.label}“?`)) return;
    const response = await fetch(`/api/account/addresses/${address.id}`, { method: "DELETE" });
    if (!response.ok) return;
    setAddresses((current) => {
      const next = current.filter((item) => item.id !== address.id);
      if (address.isDefault && next[0]) next[0] = { ...next[0], isDefault: true };
      return next;
    });
  }

  async function makeDefault(address: AccountAddress) {
    const response = await fetch(`/api/account/addresses/${address.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...address, isDefault: true }),
    });
    if (!response.ok) return;
    setAddresses((current) =>
      current.map((item) => ({ ...item, isDefault: item.id === address.id })),
    );
  }

  return (
    <>
      <section className="rounded-[1.8rem] bg-white p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black">Адреси</h2>
          <Button size="sm" onClick={startCreate}>
            <Plus size={16} /> Нов адрес
          </Button>
        </div>
        {addresses.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <article key={address.id} className="rounded-2xl border border-ink/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <MapPin className="text-coral" />
                  {address.isDefault && (
                    <span className="rounded-full bg-mint px-3 py-1 text-[11px] font-black text-turquoise-dark">
                      Основен
                    </span>
                  )}
                </div>
                <p className="mt-5 font-black">{address.label}</p>
                <p className="mt-1 text-sm font-bold text-ink/70">
                  {address.firstName} {address.lastName} · {address.phone}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink/55">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city} {address.postalCode}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(address)}
                    className="flex items-center gap-1 text-xs font-black text-turquoise-dark"
                  >
                    <Pencil size={14} /> Редактирай
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => makeDefault(address)}
                      className="flex items-center gap-1 text-xs font-black text-ink/60"
                    >
                      <Check size={14} /> Направи основен
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(address)}
                    className="flex items-center gap-1 text-xs font-black text-coral"
                  >
                    <Trash2 size={14} /> Изтрий
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-cream p-8 text-center">
            <MapPin className="mx-auto text-coral" size={36} />
            <p className="mt-4 font-black">Все още няма запазени адреси.</p>
            <p className="mt-1 text-sm font-semibold text-ink/50">
              Добавеният основен адрес ще се попълва автоматично при поръчка.
            </p>
          </div>
        )}
      </section>

      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/45 p-4 backdrop-blur-sm">
          <form
            onSubmit={save}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl md:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">
                {editingId ? "Редактиране на адрес" : "Нов адрес"}
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Затвори">
                <X />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <AddressField label="Име на адреса">
                <Input
                  value={draft.label}
                  onChange={(event) => setDraft({ ...draft, label: event.target.value })}
                  required
                />
              </AddressField>
              <AddressField label="Телефон">
                <Input
                  type="tel"
                  value={draft.phone}
                  onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                  required
                />
              </AddressField>
              <AddressField label="Име">
                <Input
                  value={draft.firstName}
                  onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
                  required
                />
              </AddressField>
              <AddressField label="Фамилия">
                <Input
                  value={draft.lastName}
                  onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
                  required
                />
              </AddressField>
              <AddressField label="Адрес" className="sm:col-span-2">
                <Input
                  value={draft.line1}
                  onChange={(event) => setDraft({ ...draft, line1: event.target.value })}
                  required
                />
              </AddressField>
              <AddressField label="Допълнение" className="sm:col-span-2">
                <Input
                  value={draft.line2 || ""}
                  onChange={(event) => setDraft({ ...draft, line2: event.target.value })}
                />
              </AddressField>
              <AddressField label="Град">
                <Input
                  value={draft.city}
                  onChange={(event) => setDraft({ ...draft, city: event.target.value })}
                  required
                />
              </AddressField>
              <AddressField label="Пощенски код">
                <Input
                  value={draft.postalCode}
                  onChange={(event) => setDraft({ ...draft, postalCode: event.target.value })}
                  required
                />
              </AddressField>
            </div>
            <label className="mt-5 flex items-center gap-3 rounded-2xl bg-mint p-4 text-sm font-bold">
              <input
                type="checkbox"
                checked={draft.isDefault}
                onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })}
              />
              Използвай като основен адрес
            </label>
            {message && <p className="mt-4 text-sm font-bold text-coral">{message}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Отказ
              </Button>
              <Button disabled={saving}>{saving ? "Запазване..." : "Запази адреса"}</Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function AddressField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
