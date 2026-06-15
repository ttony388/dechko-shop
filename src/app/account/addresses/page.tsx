import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AddressesPage() {
  return <section className="rounded-[1.8rem] bg-white p-6 md:p-8"><div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-black">Адреси</h2><Button size="sm"><Plus size={16} /> Нов адрес</Button></div><div className="grid gap-4 sm:grid-cols-2">{["Дом", "Офис"].map((name, i) => <div key={name} className="rounded-2xl border border-ink/10 p-5"><MapPin className="mb-5 text-coral" /><p className="font-black">{name}</p><p className="mt-2 text-sm leading-6 text-ink/55">{i ? "бул. България 88, София 1404" : "ул. Липа 12, Варна 9000"}</p><button className="mt-4 text-xs font-black text-turquoise-dark">Редактирай</button></div>)}</div></section>;
}
