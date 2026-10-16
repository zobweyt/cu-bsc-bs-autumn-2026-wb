import { z } from 'zod';

// Общие схемы structuredContent. Инпут-схемы живут рядом с тулами.
export const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  brand: z.string(),
  price: z.number(),
  image: z.string(),
  tags: z.array(z.string()),
});

export const CartSchema = z.object({
  lines: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      price: z.number(),
      image: z.string(),
      qty: z.number(),
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
