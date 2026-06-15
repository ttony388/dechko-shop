import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountNav } from "@/components/account-nav";
import { db } from "@/lib/db";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <div className="container-shell py-14 md:py-20">
      <p className="eyebrow mb-3 text-turquoise-dark">Моят Дечко</p>
      <h1 className="section-title mb-10">
        {firstName ? `Здравейте, ${firstName}!` : "Здравейте!"}
      </h1>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <AccountNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
