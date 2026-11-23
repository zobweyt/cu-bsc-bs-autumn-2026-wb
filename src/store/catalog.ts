import data from './data.json';

// Характеристики товара. Заполнены для пилотной категории «периферия»
// (мыши и клавиатуры); у остальных товаров specs нет — по ним фильтр
// честно отвечает «нет данных», а не угадывает по названию.
export type Specs = {
  connection?: string; // 'кабель USB' | 'радио 2,4 ГГц' | 'Bluetooth'
  silent?: boolean;
  dpi?: number;
  backlight?: boolean;
  weight?: number;
  ergonomic?: boolean;
  hand?: string;
  switches?: string;
  layout?: string;
};

type RawProduct = {
  id: string;
  title: string;
  brand: string;
  price: number;
  image: string;
  tags: string[];
  specs?: Specs;
};

// То, что видят и ассистент, и карточка: один источник правды.
export type Product = RawProduct & {
  rating: number;
  reviews: number;
  discount: number;
  oldPrice: number;
  stock: number;
  deliveryDays: number;
};

export const SPEC_LABELS: Record<keyof Specs, string> = {
  connection: 'Подключение',
  silent: 'Бесшумные клики',
  dpi: 'Разрешение сенсора, DPI',
  backlight: 'Подсветка',
  weight: 'Вес, г',
  ergonomic: 'Эргономичная форма',
  hand: 'Под руку',
  switches: 'Переключатели',
  layout: 'Формат',
};

export function specList(specs?: Specs): { key: string; label: string; value: string }[] {
  if (!specs) return [];
  return (Object.keys(SPEC_LABELS) as (keyof Specs)[])
    .filter((k) => specs[k] !== undefined)
    .map((k) => {
      const v = specs[k];
      const value = typeof v === 'boolean' ? (v ? 'да' : 'нет') : typeof v === 'number' ? v.toLocaleString('ru-RU') : String(v);
      return { key: k, label: SPEC_LABELS[k], value };
    });
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Демо-витрина: рейтинг, скидка, остаток и срок доставки детерминированы
// по id (стабильны между показами). Раньше их считала вьюха и ассистент
// их не видел — теперь они в данных тула.
function enrich(p: RawProduct): Product {
  const h = hash(p.id);
  const discount = 5 + (h % 26);
  return {
    ...p,
    rating: (45 + (h % 6)) / 10,
    reviews: 18 + (h % 480),
    discount,
    oldPrice: Math.round(p.price / (1 - discount / 100) / 10) * 10,
    stock: 3 + (h % 40),
    deliveryDays: 1 + (h % 4),
  };
}

// Мок-каталог из data.json. Замени на запрос к своей БД / API магазина.
export const PRODUCTS: Product[] = (data as RawProduct[]).map(enrich);

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

// ---------- Поиск по условиям ----------

export type Filters = {
  maxPrice?: number;
  minPrice?: number;
  wireless?: boolean;
  silent?: boolean;
  backlight?: boolean;
  minDpi?: number;
  maxDeliveryDays?: number;
};

// ok: условие выполнено; false: не выполнено; null: в данных нет такого поля.
export type Check = { condition: string; ok: boolean | null; detail: string };

export type SearchHit = { product: Product; checks: Check[]; failed: number };

export type SearchResult = {
  conditions: string[];
  exact: boolean; // есть ли товары, подходящие под все условия
  hits: SearchHit[];
  ignoredWords: string[];
};

export const rub = (n: number) => n.toLocaleString('ru-RU') + ' ₽';
const isWireless = (s: Specs) => s.connection !== undefined && s.connection !== 'кабель USB';

// Свойства, которые покупатель часто пишет прямо в запросе. Если модель
// не вынесла их в параметры, сервер вынесет сам — иначе «беспроводная
// бесшумная мышь» находила бы всё, где встречается хоть одно слово.
const WORD_FILTERS: { re: RegExp; apply: (f: Filters) => void }[] = [
  { re: /^беспровод/, apply: (f) => (f.wireless ??= true) },
  { re: /^проводн/, apply: (f) => (f.wireless ??= false) },
  { re: /^(бесшум|тих)/, apply: (f) => (f.silent ??= true) },
  { re: /^(подсвет|rgb)/, apply: (f) => (f.backlight ??= true) },
];

const STOP = new Set(['и', 'с', 'для', 'до', 'на', 'в', 'по', 'не', 'без', 'нужна', 'нужен', 'нужно', 'хочу', 'купить', 'руб', 'рублей', '₽']);

// Грубый стемминг: «мыши», «мышку», «мышь» → «мыш».
function stem(w: string): string {
  return w.length >= 4 ? w.slice(0, Math.max(3, w.length - 2)) : w;
}

export function conditionLabels(f: Filters): string[] {
  const out: string[] = [];
  if (f.wireless !== undefined) out.push(f.wireless ? 'беспроводная' : 'проводная');
  if (f.silent) out.push('бесшумная');
  if (f.backlight) out.push('с подсветкой');
  if (f.minDpi) out.push(`от ${f.minDpi.toLocaleString('ru-RU')} DPI`);
  if (f.minPrice != null) out.push(`от ${rub(f.minPrice)}`);
  if (f.maxPrice != null) out.push(`до ${rub(f.maxPrice)}`);
  if (f.maxDeliveryDays != null) out.push(`доставка до ${f.maxDeliveryDays} дн.`);
  return out;
}

function checksFor(p: Product, f: Filters): Check[] {
  const s = p.specs;
  const out: Check[] = [];
  const spec = (cond: string, has: boolean, ok: boolean, yes: string, no: string) =>
    out.push(has ? { condition: cond, ok, detail: ok ? yes : no } : { condition: cond, ok: null, detail: 'нет в данных карточки' });

  if (f.wireless !== undefined) {
    const has = !!s && s.connection !== undefined;
    const w = has && isWireless(s!);
    spec(f.wireless ? 'беспроводная' : 'проводная', has, w === f.wireless, `подключение: ${s?.connection}`, `подключение: ${s?.connection}`);
  }
  if (f.silent) spec('бесшумная', s?.silent !== undefined, !!s?.silent, 'бесшумные клики: да', 'бесшумные клики: нет');
  if (f.backlight) spec('с подсветкой', s?.backlight !== undefined, !!s?.backlight, 'подсветка: да', 'подсветка: нет');
  if (f.minDpi) spec(`от ${f.minDpi} DPI`, s?.dpi !== undefined, (s?.dpi ?? 0) >= f.minDpi, `${s?.dpi} DPI`, `только ${s?.dpi} DPI`);
  if (f.maxPrice != null) {
    const ok = p.price <= f.maxPrice;
    out.push({ condition: `до ${rub(f.maxPrice)}`, ok, detail: ok ? rub(p.price) : `дороже бюджета на ${rub(p.price - f.maxPrice)}` });
  }
  if (f.minPrice != null) {
    const ok = p.price >= f.minPrice;
    out.push({ condition: `от ${rub(f.minPrice)}`, ok, detail: rub(p.price) });
  }
  if (f.maxDeliveryDays != null) {
    const ok = p.deliveryDays <= f.maxDeliveryDays;
    out.push({ condition: `доставка до ${f.maxDeliveryDays} дн.`, ok, detail: `доставка за ${p.deliveryDays} дн.` });
  }
  return out;
}

export function searchProducts(query: string, input: Filters = {}): SearchResult {
  const filters: Filters = { ...input };
  const budget = query.match(/до\s*(\d[\d\s]{2,})/i);
  const budgetValue = budget ? Number(budget[1].replace(/\s/g, '')) : NaN;
  // «до 3 000» — бюджет; «до 3 дней» сюда не попадает (меньше 100).
  if (budgetValue >= 100 && filters.maxPrice == null) filters.maxPrice = budgetValue;
  const raw = query.toLowerCase().replace(/[^\p{L}\p{N}\s%]/gu, ' ').split(/\s+/).filter(Boolean);
  const words: string[] = [];
  const ignoredWords: string[] = [];
  for (const w of raw) {
    const rule = WORD_FILTERS.find((r) => r.re.test(w));
    if (rule) rule.apply(filters);
    else if (/^\d+$/.test(w) || STOP.has(w)) ignoredWords.push(w);
    else words.push(stem(w));
  }

  // Тип товара: оставляем товары с максимальным числом совпавших слов запроса.
  let pool = PRODUCTS;
  if (words.length) {
    const scored = PRODUCTS.map((p) => {
      const hay = (p.title + ' ' + p.brand + ' ' + p.tags.join(' ')).toLowerCase();
      return { p, score: words.filter((w) => hay.includes(w)).length };
    });
    const best = Math.max(...scored.map((x) => x.score));
    pool = best > 0 ? scored.filter((x) => x.score === best).map((x) => x.p) : [];
  }

  const hits = pool.map((product) => {
    const checks = checksFor(product, filters);
    return { product, checks, failed: checks.filter((c) => c.ok !== true).length };
  });

  const exactHits = hits.filter((h) => h.failed === 0).sort((a, b) => a.product.price - b.product.price);
  if (exactHits.length || !hits.length) {
    return { conditions: conditionLabels(filters), exact: exactHits.length > 0, hits: exactHits, ignoredWords };
  }

  // Полностью подходящих нет: ближайшие — по «расстоянию» до условий.
  // Невыполненное свойство или «нет данных» = 1; перерасход бюджета меньше
  // 50% = доля перерасхода (на 490 ₽ при бюджете 3 000 ₽ — 0,16). Так товар,
  // который подходит по всем свойствам и чуть дороже, идёт первым.
  const distance = (h: SearchHit) =>
    h.checks.reduce((d, c) => {
      if (c.ok === true) return d;
      if (c.ok === false && filters.maxPrice && c.condition.startsWith('до ')) {
        const over = (h.product.price - filters.maxPrice) / filters.maxPrice;
        return d + (over < 0.5 ? over : 1);
      }
      return d + 1;
    }, 0);
  const sorted = [...hits].sort((a, b) => distance(a) - distance(b) || a.product.price - b.product.price);
  // Разнообразие: сначала по одному варианту на каждое невыполненное условие.
  const picked: SearchHit[] = [];
  const seen = new Set<string>();
  for (const h of sorted) {
    const sig = h.checks.filter((c) => c.ok !== true).map((c) => c.condition).join('|');
    if (seen.has(sig)) continue;
    seen.add(sig);
    picked.push(h);
    if (picked.length === 3) break;
  }
  for (const h of sorted) {
    if (picked.length === 3) break;
    if (!picked.includes(h)) picked.push(h);
  }
  return { conditions: conditionLabels(filters), exact: false, hits: picked, ignoredWords };
}

// Плоский вид товара для structuredContent: specs — списком с подписями,
// чтобы и вьюха, и ассистент показывали одно и то же.
export function productView(p: Product) {
  const { specs, ...rest } = p;
  return { ...rest, specs: specList(specs) };
}

// Текстовая строка для ассистента: только поля из данных, без догадок.
export function productLine(p: Product, checks?: Check[]): string {
  const specs = specList(p.specs).map((s) => `${s.label}: ${s.value}`);
  const parts = [
    `#${p.id} ${p.title} (${p.brand}) — ${rub(p.price)}`,
    `рейтинг ${p.rating.toFixed(1).replace('.', ',')}, доставка за ${p.deliveryDays} дн., в наличии ${p.stock} шт`,
  ];
  if (specs.length) parts.push(specs.join('; '));
  else parts.push('характеристик в данных нет');
  if (checks?.length) {
    parts.push(checks.map((c) => `${c.ok === true ? '✓' : c.ok === false ? '✗' : '?'} ${c.condition} (${c.detail})`).join(', '));
  }
  return parts.join(' | ');
}
