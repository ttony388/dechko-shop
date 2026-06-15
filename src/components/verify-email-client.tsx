"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type VerificationState = "loading" | "verified" | "expired" | "invalid" | "resend";

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerificationState>(token ? "loading" : "resend");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const body = (await response.json()) as {
          status: VerificationState;
          email?: string;
          message?: string;
          error?: string;
        };
        if (!active) return;
        setState(response.ok ? "verified" : body.status);
        setEmail(body.email || "");
        setMessage(body.message || body.error || "Възникна неочаквана грешка.");
      })
      .catch(() => {
        if (active) {
          setState("invalid");
          setMessage("Не успяхме да проверим линка. Моля, опитайте отново.");
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function resend(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = (await response.json().catch(() => null)) as {
      message?: string;
      error?: string;
    } | null;
    setMessage(body?.message || body?.error || "Не успяхме да изпратим линка.");
    setSending(false);
  }

  if (state === "loading") {
    return <LoaderCircle className="mx-auto animate-spin text-turquoise-dark" size={44} />;
  }
  if (state === "verified") {
    return (
      <Result icon={<CheckCircle2 size={46} />} title="Имейлът е потвърден" message={message}>
        <Link href="/login" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 font-black text-white">
          Вход в профила
        </Link>
      </Result>
    );
  }

  return (
    <Result
      icon={<AlertCircle size={46} />}
      title={state === "expired" ? "Линкът е изтекъл" : "Нужен е нов линк"}
      message={message || "Въведете имейла си, за да получите нов линк за потвърждение."}
      error
    >
      <form onSubmit={resend} className="mx-auto mt-6 max-w-sm space-y-3">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Имейл адрес"
          required
        />
        <Button className="w-full" disabled={sending}>
          <Send size={17} />
          {sending ? "Изпращане..." : "Изпрати нов линк"}
        </Button>
      </form>
    </Result>
  );
}

function Result({
  icon,
  title,
  message,
  error = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className={error ? "text-coral" : "text-turquoise-dark"}>{icon}</div>
      <h2 className="mt-4 text-2xl font-black">{title}</h2>
      <p className="mt-3 font-semibold leading-7 text-ink/60">{message}</p>
      {children}
    </div>
  );
}
