import { AccountNav } from "@/components/account-nav";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <div className="container-shell py-14 md:py-20"><p className="eyebrow mb-3 text-turquoise-dark">Моят Дечко</p><h1 className="section-title mb-10">Здравейте!</h1><div className="grid gap-6 lg:grid-cols-[240px_1fr]"><AccountNav /><div>{children}</div></div></div>;
}
