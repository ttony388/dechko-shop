import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");

  return (
    <div className="container-shell py-10">
      <div className="mb-8">
        <p className="eyebrow text-coral">Дечко Admin</p>
        <h1 className="mt-2 text-3xl font-black">
          Управление на магазина
        </h1>
      </div>
      <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
        <AdminSidebar />
        <div>{children}</div>
      </div>
    </div>
  );
}
