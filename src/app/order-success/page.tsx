import Link from "next/link";
import { Check, PackageCheck } from "lucide-react";

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order = "DCH-2026-001" } = await searchParams;
  return (
    <div className="container-shell flex min-h-[70vh] items-center justify-center py-20">
      <div className="max-w-2xl rounded-[2.8rem] bg-white p-8 text-center shadow-soft md:p-14">
        <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-lime text-white"><Check size={44} strokeWidth={3} /></span>
        <p className="eyebrow mt-7 text-turquoise-dark">Поръчка {order}</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Благодарим ви!</h1><p className="mx-auto mt-5 max-w-lg font-semibold leading-8 text-ink/60">Поръчката е приета. Изпратихме потвърждение по имейл и скоро ще подготвим пакета.</p>
        <div className="mx-auto mt-7 flex w-fit items-center gap-3 rounded-2xl bg-cream px-5 py-4 text-sm font-black"><PackageCheck className="text-coral" /> Очаквана доставка: 1-3 работни дни</div>
        <Link href="/shop" className="mt-8 inline-flex h-14 items-center rounded-full bg-ink px-8 font-black text-white">Продължи пазаруването</Link>
      </div>
    </div>
  );
}
