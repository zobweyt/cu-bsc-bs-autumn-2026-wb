import { findProduct } from './catalog.js';

export type CartLine = { id: string; title: string; price: number; oldPrice: number; image: string; qty: number };

const cart = new Map<string, number>();

export function getCart() {
  const lines: CartLine[] = [];
  let total = 0;
  cart.forEach((qty, id) => {
    const p = findProduct(id);
    if (!p) return;
    lines.push({ id: p.id, title: p.title, price: p.price, oldPrice: p.oldPrice, image: p.image, qty });
    total += p.price * qty;
  });
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return { lines, total, count };
}

export function setQty(id: string, qty: number) {
  const p = findProduct(id);
  if (!p) throw new Error('Товар не найден: ' + id);
  if (!Number.isInteger(qty) || qty < 0 || qty > 99) throw new Error('Некорректное количество');
  if (qty === 0) cart.delete(id);
  else cart.set(id, qty);
  return getCart();
}

export function clearCart() {
  cart.clear();
}
