import { findProduct } from './catalog.js';
import { formatDate } from './format.js';
import type { Order } from './orders.js';

// Метрики воронки (только запись событий, на логику не влияет).
// Начало текущей воронки — первый поиск после прошлой оплаты.
const searchEvents: { t: number; query: string; count: number }[] = [];
const viewEvents: { t: number; id: string }[] = [];
const addEvents: { t: number; id: string; qty: number }[] = [];
const purchaseEvents: { id: string; total: number; items: number; durationMs: number | null; t: number }[] = [];
let funnelStart: number | null = null;

export function trackSearch(query: string, count: number) {
  if (funnelStart == null) funnelStart = Date.now();
  searchEvents.push({ t: Date.now(), query, count });
}

export function trackView(id: string) {
  viewEvents.push({ t: Date.now(), id });
}

export function trackAdd(id: string, qty: number) {
  addEvents.push({ t: Date.now(), id, qty });
}

export function recordPurchase(order: Order) {
  const now = Date.now();
  const durationMs = funnelStart == null ? null : now - funnelStart;
  funnelStart = null;
  purchaseEvents.push({
    id: order.id,
    total: order.total,
    items: order.items.reduce((n, i) => n + i.qty, 0),
    durationMs,
    t: now,
  });
}

export function getStats() {
  const unitsAdded = addEvents.reduce((n, a) => n + a.qty, 0);
  const unitsOrdered = purchaseEvents.reduce((n, p) => n + p.items, 0);
  const revenue = purchaseEvents.reduce((n, p) => n + p.total, 0);
  const orders = purchaseEvents.length;
  const durs = purchaseEvents
    .map((p) => p.durationMs)
    .filter((d): d is number => d != null);
  const byQuery = new Map<string, number>();
  for (const s of searchEvents) {
    const q = s.query.trim() || 'весь каталог';
    byQuery.set(q, (byQuery.get(q) ?? 0) + 1);
  }
  const byProduct = new Map<string, number>();
  for (const a of addEvents) byProduct.set(a.id, (byProduct.get(a.id) ?? 0) + a.qty);
  return {
    totals: {
      searches: searchEvents.length,
      views: viewEvents.length,
      adds: addEvents.length,
      unitsAdded,
      orders,
      revenue,
      avgOrderValue: orders ? Math.round(revenue / orders) : 0,
    },
    conversion: {
      // доля поисков, закончившихся заказом; доля добавленных штук, дошедших до оплаты
      searchToOrder: searchEvents.length ? orders / searchEvents.length : null,
      cartToOrder: unitsAdded ? unitsOrdered / unitsAdded : null,
    },
    funnel: {
      // время от первого поиска воронки до оплаты
      count: durs.length,
      avgMs: durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : null,
      minMs: durs.length ? Math.min(...durs) : null,
      maxMs: durs.length ? Math.max(...durs) : null,
    },
    topQueries: [...byQuery.entries()]
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    topProducts: [...byProduct.entries()]
      .map(([id, qty]) => ({ id, title: findProduct(id)?.title ?? id, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5),
    recent: [...purchaseEvents]
      .reverse()
      .slice(0, 10)
      .map((p) => ({ id: p.id, date: formatDate(p.t), total: p.total, items: p.items, durationMs: p.durationMs })),
  };
}
