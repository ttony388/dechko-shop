import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  return <AuthShell title="Добре дошли отново." copy="Влезте, за да видите поръчките и любимите си продукти."><AuthForm mode="login" /><p className="mt-6 text-center text-sm font-semibold text-ink/55">Нямате профил? <Link href="/register" className="font-black text-turquoise-dark">Регистрация</Link></p></AuthShell>;
}
