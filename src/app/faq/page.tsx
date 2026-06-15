const groups = [
  ["Поръчки", ["Как да проследя поръчката си?", "Мога ли да променя вече направена поръчка?", "Предлагате ли подаръчна опаковка?"]],
  ["Доставка и връщане", ["Колко време отнема доставката?", "Как мога да върна продукт?", "Кога доставката е безплатна?"]],
  ["Продукти", ["Как избирате продуктите?", "Подходящи ли са за конкретна възраст?", "Как се грижа за дървените играчки?"]],
];
export default function FaqPage() {
  return <div className="container-shell max-w-5xl py-14 md:py-20"><p className="eyebrow mb-3 text-turquoise-dark">Нужда от помощ?</p><h1 className="section-title mb-12">Често задавани въпроси.</h1>{groups.map(([title, questions]) => <section key={title as string} className="mb-10" id={title === "Доставка и връщане" ? "delivery" : undefined}><h2 className="mb-4 text-2xl font-black">{title}</h2><div className="space-y-3">{(questions as string[]).map((question, index) => <details key={question} className="group rounded-2xl bg-white p-5"><summary className="cursor-pointer list-none font-black">{question}<span className="float-right text-xl group-open:rotate-45">+</span></summary><p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-ink/55">{index === 0 ? "След изпращане ще получите имейл с номер за проследяване и връзка към куриера." : "Свържете се с нас на hello@dechko.bg. Ще ви помогнем бързо и ще обясним следващите стъпки."}</p></details>)}</div></section>)}</div>;
}
