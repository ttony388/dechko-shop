import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { VerifyEmailClient } from "@/components/verify-email-client";

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Потвърждение на имейл" copy="Защитаваме профила ви с една кратка проверка.">
      <Suspense fallback={<p className="text-center font-bold">Проверяваме линка...</p>}>
        <VerifyEmailClient />
      </Suspense>
    </AuthShell>
  );
}
