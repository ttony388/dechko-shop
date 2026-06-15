import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  return <AuthShell title="Вашето място в Дечко." copy="Запазвайте любими продукти и следете поръчките си."><AuthForm mode="register" /><p className="mt-6 text-center text-sm font-semibold text-ink/55">Вече имате профил? <Link href="/login" className="font-black text-turquoise-dark">Вход</Link></p></AuthShell>;
}
