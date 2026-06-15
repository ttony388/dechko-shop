"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
};

export function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const body = (await response.json().catch(() => null)) as
        | (Profile & { error?: string })
        | null;
      if (!response.ok) {
        setMessage(body?.error || "Не успяхме да запазим профила.");
        return;
      }
      setProfile(body || profile);
      setMessage("Личните данни са запазени.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <label>
        <span className="field-label">Име</span>
        <Input
          value={profile.firstName}
          onChange={(event) => setProfile({ ...profile, firstName: event.target.value })}
          autoComplete="given-name"
          required
        />
      </label>
      <label>
        <span className="field-label">Фамилия</span>
        <Input
          value={profile.lastName}
          onChange={(event) => setProfile({ ...profile, lastName: event.target.value })}
          autoComplete="family-name"
        />
      </label>
      <label className="sm:col-span-2">
        <span className="field-label">Имейл</span>
        <Input type="email" value={profile.email} disabled />
      </label>
      {message && (
        <p className="text-sm font-bold text-turquoise-dark sm:col-span-2" role="status">
          {message}
        </p>
      )}
      <Button className="mt-2 w-fit" disabled={saving}>
        {saving ? "Запазване..." : "Запази"}
      </Button>
    </form>
  );
}
