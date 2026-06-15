export type Category = {
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  price: number;
  compareAt?: number;
  salePrice?: number;
  rating: number;
  reviews: number;
  stock: number;
  badge?: string;
  image: string;
  imagePosition?: string;
  colors: string[];
  ages: string[];
  tags?: string[];
  brand?: string;
  gender?: "NEUTRAL" | "GIRLS" | "BOYS";
  description: string;
  details: string[];
  featured?: boolean;
  isNew?: boolean;
};

export const categories: Category[] = [
  { name: "Играчки", slug: "toys", icon: "🧸", color: "#dff8f6", description: "Игри, които развиват въображението." },
  { name: "Книги", slug: "books", icon: "📚", color: "#fff2bf", description: "Истории за малки мечтатели." },
  { name: "Дрехи", slug: "clothing", icon: "🧢", color: "#ffe1d7", description: "Меки материи за всеки ден." },
  { name: "Училище", slug: "school", icon: "🎒", color: "#e8f6c9", description: "Цветни помощници за знание." },
  { name: "Бебе", slug: "baby", icon: "🍼", color: "#e3ecff", description: "Нежни избори за най-малките." },
  { name: "Навън", slug: "outdoor", icon: "🛴", color: "#d8f4ff", description: "Повече движение и усмивки." },
  { name: "Творчество", slug: "arts-crafts", icon: "🎨", color: "#fce0f1", description: "Комплекти за малки творци." },
  { name: "Подаръци", slug: "gifts", icon: "🎁", color: "#fff0d8", description: "Подбрани изненади за всеки повод." },
];

const names = [
  "Дървена дъга Мая", "Баланс колело Тико", "Кула от рингове Слънце", "Мек заек Боби",
  "Строителен град", "Магнитни животни", "Куклена къща Лора", "Музикална дъска",
  "Приказки за лека нощ", "Голяма книга за цветовете", "Моите първи думи", "Горската експедиция",
  "Атлас за малки откриватели", "Книжка с капачета", "Пижама Облачета", "Суитшърт Дъга",
  "Меко яке Мента", "Комплект Рая", "Шапка Слънчо", "Раница Корал",
  "Несесер Дино", "Бутилка Океан", "Кутия за обяд Усмивка", "Тефтер Малък герой",
  "Бебешка активна арка", "Муселинено одеяло", "Силиконова купичка", "Дървена дрънкалка",
  "Мека книжка Животни", "Триколка Фини", "Детски скутер Лайм", "Градински комплект",
  "Хвърчило Птица", "Кофичка за плаж", "Тебешири за навън", "Акварелен комплект",
  "Пастели Малък художник", "Направи си динозавър", "Комплект за плетене", "Печатчета Градина",
  "Глинена работилница", "Мъниста Приятелство", "Подаръчна кутия Добре дошло", "Кутия Рожден ден",
  "Мини комплект Пътешественик", "Плюшен приятел Оли", "Дървен влак Експрес", "Пъзел Слънчева система",
  "Лампа Луна", "Театър с кукли",
];

const descriptions = [
  "Красиво изработен продукт, създаден за дълги часове спокойна и смислена игра.",
  "Практичен любимец за ежедневието, подбран с внимание към малките детайли.",
  "Цветно преживяване, което насърчава любопитството, увереността и въображението.",
];

export const products: Product[] = names.map((name, index) => {
  const category = categories[index % 7];
  const base = 14.9 + (index % 8) * 6.25;
  const onSale = index % 6 === 0;
  return {
    id: `prd_${String(index + 1).padStart(3, "0")}`,
    name,
    slug: `product-${index + 1}-${category.slug}`,
    category: category.name,
    categorySlug: category.slug,
    price: Number(base.toFixed(2)),
    compareAt: onSale ? Number((base * 1.24).toFixed(2)) : undefined,
    rating: Number((4.6 + (index % 4) * 0.1).toFixed(1)),
    reviews: 8 + ((index * 13) % 127),
    stock: 4 + ((index * 7) % 31),
    badge: onSale ? "Намаление" : index % 5 === 0 ? "Любим" : index % 4 === 0 ? "Ново" : undefined,
    image: index % 3 === 0 ? "/hero-shop.png" : index % 3 === 1 ? "/creative-kit.png" : "/playroom.png",
    imagePosition: index % 3 === 0 ? "76% center" : index % 3 === 1 ? "center" : "24% center",
    colors: ["Тюркоаз", "Корал", "Слънчево жълто"].slice(0, 1 + (index % 3)),
    ages: index % 4 === 0 ? ["0-2 г.", "3-5 г."] : ["3-5 г.", "6-8 г."],
    description: descriptions[index % descriptions.length],
    details: ["Подбрани безопасни материали", "Създадено за активна детска игра", "Лесно за поддръжка"],
    featured: index < 8,
    isNew: index >= 8 && index < 16,
  };
});

export const featuredProducts = products.filter((product) => product.featured);
export const newProducts = products.filter((product) => product.isNew);

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}
