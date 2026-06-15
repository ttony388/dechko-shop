"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  name: z.string().optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Въведете валиден имейл адрес."),
  password: z.string().min(8, "Паролата трябва да е поне 8 символа."),
  confirmPassword: z.string().optional(),
});

type Values = z.infer<typeof formSchema>;

function getSchema(mode: "login" | "register") {
  return formSchema.superRefine((values, context) => {
    if (mode !== "register") return;

    if (!values.name || values.name.trim().length < 2) {
      context.addIssue({
        code: "custom",
        path: ["name"],
        message: "Името трябва да е поне 2 символа.",
      });
    }

    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Паролите не съвпадат.",
      });
    }
  });
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const schema = useMemo(() => getSchema(mode), [mode]);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: Values) {
    setServerError("");

    if (mode === "register") {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setServerError(body?.error || "Регистрацията не беше успешна.");
        return;
      }
    }

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError(
        mode === "register"
          ? "Профилът е създаден, но автоматичният вход не беше успешен."
          : "Грешен имейл или парола.",
      );
      return;
    }

    router.replace("/account");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {mode === "register" && (
        <label className="block">
          <span className="field-label">Име</span>
          <Input
            {...register("name")}
            autoComplete="name"
            required
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && (
            <small className="text-coral">{errors.name.message}</small>
          )}
        </label>
      )}

      <label className="block">
        <span className="field-label">Имейл</span>
        <Input
          type="email"
          {...register("email")}
          autoComplete="email"
          required
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && (
          <small className="text-coral">{errors.email.message}</small>
        )}
      </label>

      <label className="block">
        <span className="field-label">Парола</span>
        <Input
          type="password"
          {...register("password")}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password && (
          <small className="text-coral">{errors.password.message}</small>
        )}
      </label>

      {mode === "register" && (
        <label className="block">
          <span className="field-label">Потвърдете паролата</span>
          <Input
            type="password"
            {...register("confirmPassword")}
            autoComplete="new-password"
            required
            aria-invalid={Boolean(errors.confirmPassword)}
          />
          {errors.confirmPassword && (
            <small className="text-coral">
              {errors.confirmPassword.message}
            </small>
          )}
        </label>
      )}

      {serverError && (
        <p
          role="alert"
          className="rounded-xl bg-coral/10 p-3 text-sm font-bold text-coral"
        >
          {serverError}
        </p>
      )}

      {mode === "login" && (
        <Link
          href="/forgot-password"
          className="block text-right text-xs font-black text-turquoise-dark"
        >
          Забравена парола?
        </Link>
      )}

      <Button className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting
          ? "Моля, изчакайте..."
          : mode === "login"
            ? "Вход"
            : "Създай профил"}
      </Button>
    </form>
  );
}
