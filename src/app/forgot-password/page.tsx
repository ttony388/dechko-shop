import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  return <AuthShell title="Нова парола." copy="Ще изпратим защитена връзка за възстановяване."><form><label><span className="field-label">Имейл</span><Input type="email" required /></label><Button className="mt-5 w-full" size="lg">Изпрати връзка</Button></form></AuthShell>;
}
