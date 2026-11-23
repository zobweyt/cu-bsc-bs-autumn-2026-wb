import { formatDate } from './format.js';

export type OrderItem = { id: string; title: string; price: number; qty: number };
export type Order = {
  id: string;
  createdAt: number;
  total: number;
  items: OrderItem[];
  // Откуда пришёл заказ: метка нужна, чтобы отделить заказы из ассистента.
  // Сама по себе она не доказывает, что заказ новый — это меряет только A/B.
  source: 'assistant';
  mock: true;
};

// Граница MVP: оформление и оплата — на стороне WB; ассистент только
// передаёт корзину. Первая стадия поэтому «Оформлен в WB», а не «Оплачен».
export const STAGES = ['Оформлен в WB', 'Сборка', 'В пути', 'Доставлен'] as const;
// Пороги переходов 0→1, 1→2, 2→3 (мс с момента оформления). Статус выводится
// из времени, а не таймерами — переживает рестарт инстанса.
const STAGE_AFTER = [5000, 15000, 30000];

const orders: Order[] = [];

export function stageOf(o: Order): number {
  const age = Date.now() - o.createdAt;
  if (age >= STAGE_AFTER[0] + STAGE_AFTER[1] + STAGE_AFTER[2]) return 3;
  if (age >= STAGE_AFTER[0] + STAGE_AFTER[1]) return 2;
  if (age >= STAGE_AFTER[0]) return 1;
  return 0;
}

export function createOrder(items: OrderItem[], total: number): Order {
  const order: Order = {
    id: 'WB-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    createdAt: Date.now(),
    total,
    items,
    source: 'assistant',
    mock: true,
  };
  orders.push(order);
  return order;
}

export function orderView(o: Order) {
  const stage = stageOf(o);
  return {
    id: o.id,
    date: formatDate(o.createdAt),
    total: o.total,
    items: o.items,
    stage,
    stageLabel: STAGES[stage],
    eta: stage >= 3 ? null : formatDate(o.createdAt + 3 * 86400000),
    source: o.source,
    mock: true as const,
  };
}

export function listOrders() {
  return [...orders].reverse().map(orderView);
}

export function getOrder(id: string) {
  const o = orders.find((x) => x.id === id);
  if (!o) throw new Error('Заказ не найден: ' + id);
  return orderView(o);
}

export function clearOrders() {
  orders.length = 0;
}
