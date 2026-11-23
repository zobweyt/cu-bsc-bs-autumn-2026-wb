import { z } from 'zod';

// Общие схемы structuredContent. Инпут-схемы живут рядом с тулами.
export const SpecSchema = z.object({ key: z.string(), label: z.string(), value: z.string() });

export const CheckSchema = z.object({
  condition: z.string(),
  ok: z.boolean().nullable(),
  detail: z.string(),
});

export const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  brand: z.string(),
  price: z.number(),
  oldPrice: z.number(),
  discount: z.number(),
  rating: z.number(),
  reviews: z.number(),
  stock: z.number(),
  deliveryDays: z.number(),
  image: z.string(),
  tags: z.array(z.string()),
  specs: z.array(SpecSchema),
});

export const SearchHitSchema = ProductSchema.extend({ checks: z.array(CheckSchema) });

export const CartSchema = z.object({
  lines: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      price: z.number(),
      image: z.string(),
      qty: z.number(),
      oldPrice: z.number(),
    }),
  ),
  total: z.number(),
  count: z.number(),
});

export const OrderSchema = z.object({
  id: z.string(),
  date: z.string(),
  total: z.number(),
  items: z.array(
    z.object({ id: z.string(), title: z.string(), price: z.number(), qty: z.number() }),
  ),
  stage: z.number(),
  stageLabel: z.string(),
  eta: z.string().nullable(),
  source: z.string(),
  mock: z.boolean(),
});

export const StatsSchema = z.object({
  totals: z.object({
    searches: z.number(),
    views: z.number(),
    adds: z.number(),
    unitsAdded: z.number(),
    orders: z.number(),
    revenue: z.number(),
    avgOrderValue: z.number(),
  }),
  conversion: z.object({
    searchToOrder: z.number().nullable(),
    cartToOrder: z.number().nullable(),
  }),
  searches: z.object({
    // поиски с 3+ условиями — целевой сценарий MVP
    complex: z.number(),
    // поиски, где под все условия ничего не нашлось
    noExact: z.number(),
  }),
  funnel: z.object({
    count: z.number(),
    avgMs: z.number().nullable(),
    minMs: z.number().nullable(),
    maxMs: z.number().nullable(),
  }),
  topQueries: z.array(z.object({ query: z.string(), count: z.number() })),
  topProducts: z.array(z.object({ id: z.string(), title: z.string(), qty: z.number() })),
  recent: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      total: z.number(),
      items: z.number(),
      durationMs: z.number().nullable(),
    }),
  ),
});
