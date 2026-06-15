export function PolicyShell({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="container-shell max-w-4xl py-14 md:py-20"><p className="eyebrow mb-3 text-coral">Последна актуализация: 14 юни 2026</p><h1 className="section-title mb-10">{title}</h1><div className="prose-copy rounded-[2rem] bg-white p-7 md:p-10">{children}</div></div>;
}
