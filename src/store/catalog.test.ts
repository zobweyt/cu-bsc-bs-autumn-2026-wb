import { describe, expect, test } from 'bun:test';
import { searchProducts, findProduct, productView } from './catalog';

describe('searchProducts', () => {
  test('тип товара: «мышь» находит только мыши', () => {
    const r = searchProducts('мышь');
    expect(r.hits.length).toBeGreaterThan(10);
    expect(r.hits.every((h) => h.product.tags.includes('мышь'))).toBe(true);
  });

  test('сценарий интервью: беспроводная бесшумная до 3 000 ₽ — полностью подходящих нет', () => {
    const r = searchProducts('мышь', { wireless: true, silent: true, maxPrice: 3000 });
    expect(r.exact).toBe(false);
    expect(r.hits.length).toBe(3);
    // у каждого ближайшего варианта не выполнено ровно одно условие
    for (const h of r.hits) expect(h.checks.filter((c) => c.ok === false).length).toBe(1);
    const ids = r.hits.map((h) => h.product.id);
    expect(ids).toContain('201'); // подходит по свойствам, но дороже бюджета
    const price = r.hits.find((h) => h.product.id === '201')!.checks.find((c) => c.condition.startsWith('до'))!;
    expect(price.ok).toBe(false);
    expect(price.detail).toContain('дороже бюджета на 490');
    expect(ids[0]).toBe('201');
    // остальные два — разные компромиссы: одна не бесшумная, другая проводная
    const misses = r.hits.slice(1).map((h) => h.checks.find((c) => c.ok === false)!.condition).sort();
    expect(misses).toEqual(['беспроводная', 'бесшумная']);
  });

  test('с бюджетом 4 000 ₽ находится точное совпадение', () => {
    const r = searchProducts('мышь', { wireless: true, silent: true, maxPrice: 4000 });
    expect(r.exact).toBe(true);
    expect(r.hits.map((h) => h.product.id)).toEqual(['201']);
  });

  test('свойства и бюджет из текста запроса выносятся в условия', () => {
    const r = searchProducts('беспроводная бесшумная мышь до 3 000 ₽');
    // ru-RU разделяет разряды неразрывным пробелом
    expect(r.conditions.map((c) => c.replace(/ /g, ' '))).toEqual(['беспроводная', 'бесшумная', 'до 3 000 ₽']);
    expect(r.exact).toBe(false);
  });

  test('«до 3 дней» не считается бюджетом', () => {
    const r = searchProducts('клавиатура с доставкой до 3 дней');
    expect(r.conditions.some((c) => c.includes('₽'))).toBe(false);
  });

  test('нет данных о свойстве — «?», а не догадка', () => {
    const r = searchProducts('монитор', { silent: true });
    expect(r.exact).toBe(false);
    expect(r.hits[0].checks[0].ok).toBeNull();
  });

  test('смена бюджета или срока доставки меняет подборку', () => {
    const cheap = searchProducts('клавиатура', { maxPrice: 5000 }).hits.map((h) => h.product.id);
    const all = searchProducts('клавиатура', { maxPrice: 20000 }).hits.map((h) => h.product.id);
    expect(cheap.length).toBeLessThan(all.length);
    const fast = searchProducts('клавиатура', { maxDeliveryDays: 1 }).hits;
    expect(fast.every((h) => h.product.deliveryDays <= 1)).toBe(true);
  });
});

test('productView отдаёт характеристики списком с подписями', () => {
  const v = productView(findProduct('18')!);
  expect(v.specs.find((s) => s.key === 'silent')?.value).toBe('да');
  expect(v.specs.find((s) => s.key === 'connection')?.value).toBe('кабель USB');
});
