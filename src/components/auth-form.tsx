"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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
  email: z.string().trim().toLowerCase().email("Въведете валиден имейл адрес."),
  password: z.string().min(8, "Паролата трябва да е поне 8 символа."),
  confirmPassword: z.string().optional(),
});

type Values = z.infer<typeof formSchema>;
type RegistrationState = {
  email: string;
  emailSent: boolean;
  existing: boolean;
  verificationRequired: boolean;
};

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
  const [registrationState, setRegistrationState] = useState<RegistrationState | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: Values) {
    setServerError("");

    if (mode === "register") {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const body = (await response.json().catch(() => null)) as {
          error?: string;
          email?: string;
          emailSent?: boolean;
          requiresVerification?: boolean;
          verificationRequired?: boolean;
        } | null;
        if (!response.ok) {
          if (body?.requiresVerification && body.email) {
            setRegistrationState({
              email: body.email,
              emailSent: false,
              existing: true,
              verificationRequired: true,
            });
            return;
          }
          setServerError(body?.error || "Регистрацията не беше успешна.");
          return;
        }
        if (body?.verificationRequired === false) {
          const result = await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
          });
          if (!result?.error) {
            router.replace("/account");
            router.refresh();
            return;
          }
        }
        setRegistrationState({
          email: body?.email || values.email,
          emailSent: body?.emailSent !== false,
          existing: false,
          verificationRequired: body?.verificationRequired !== false,
        });
      } catch {
        setServerError("Връзката с услугата за регистрация беше прекъсната. Моля, опитайте отново.");
      }
      return;
    }

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (result?.error) {
      const statusResponse = await fetch("/api/auth/verification-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const status = (await statusResponse.json().catch(() => null)) as {
        requiresVerification?: boolean;
      } | null;
      setServerError(
        status?.requiresVerification
          ? "Моля, потвърдете имейла си, преди да влезете."
          : "Грешен имейл или парола.",
      );
      return;
    }

    router.replace("/account");
    router.refresh();
  }

  if (registrationState) {
    const needsResend = registrationState.verificationRequired && !registrationState.emailSent;
    const isActive = !registrationState.verificationRequired;
    return (
      <div className="rounded-[1.8rem] bg-mint p-6 text-center">
        {needsResend ? (
          <AlertCircle className="mx-auto text-coral" size={42} />
        ) : (
          <CheckCircle2 className="mx-auto text-turquoise-dark" size={42} />
        )}
        <h2 className="mt-4 text-xl font-black">
          {needsResend
            ? registrationState.existing
              ? "Профилът очаква потвърждение"
              : "Профилът е създаден"
            : isActive
              ? "Профилът е активен"
              : "Проверете пощата си"}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">
          {needsResend
            ? "Не успяхме да доставим линка за потвърждение. Изпратете нов линк, за да активирате профила си."
            : isActive
              ? "Регистрацията е успешна. Можете да влезете с новия си профил."
              : "Регистрацията е успешна! Изпратихме линк за потвърждение на вашия имейл."}
        </p>
        <p className="mt-2 text-sm font-black">{registrationState.email}</p>
        <Link
          href={
            isActive
              ? "/login"
              : `/verify-email?email=${encodeURIComponent(registrationState.email)}`
          }
          className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-black text-white"
        >
          {isActive
            ? "Вход в профила"
            : needsResend
              ? "Изпрати линк за потвърждение"
              : "Изпрати нов линк"}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {mode === "register" && (
        <Field label="Име" error={errors.name?.message}>
          <Input {...register("name")} autoComplete="name" required />
        </Field>
      )}
      <Field label="Имейл" error={errors.email?.message}>
        <Input type="email" {...register("email")} autoComplete="email" required />
      </Field>
      <Field label="Парола" error={errors.password?.message}>
        <Input
          type="password"
          {...register("password")}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </Field>
      {mode === "register" && (
        <Field label="Потвърдете паролата" error={errors.confirmPassword?.message}>
          <Input
            type="password"
            {...register("confirmPassword")}
            autoComplete="new-password"
            required
          />
        </Field>
      )}

      {serverError && (
        <p role="alert" className="rounded-xl bg-coral/10 p-3 text-sm font-bold text-coral">
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
        {isSubmitting ? "Моля, изчакайте..." : mode === "login" ? "Вход" : "Създай профил"}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {error && <small className="text-coral">{error}</small>}
    </label>
  );
}
