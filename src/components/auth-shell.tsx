export function AuthShell({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) {
  return <div className="container-shell flex min-h-[70vh] items-center justify-center py-16"><div className="w-full max-w-lg rounded-[2.5rem] bg-white p-7 shadow-soft md:p-10"><p className="eyebrow mb-3 text-coral">Моят Дечко</p><h1 className="text-4xl font-black tracking-[-.04em]">{title}</h1><p className="my-6 font-semibold text-ink/55">{copy}</p>{children}</div></div>;
}
