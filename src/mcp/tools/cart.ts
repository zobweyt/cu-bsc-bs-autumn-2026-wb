import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { getCart, setQty, clearCart } from '../../store/cart.js';
import { rub } from '../../store/catalog.js';
import { createOrder, orderView } from '../../store/orders.js';
import { trackAdd, recordPurchase } from '../../store/metrics.js';
import { CartSchema, OrderSchema } from '../schemas.js';
import { UI } from '../resources.js';

export function registerCartTools(server: McpServer) {
  // Добавить в корзину (модель и UI)
  registerAppTool(
    server,
    'cart_add',
    {
      description: 'Добавить товар в корзину. Показывает обновлённую корзину.',
      inputSchema: z.object({
        id: z.string().describe('ID товара'),
        qty: z.number().int().min(1).max(99).default(1).describe('Количество'),
      }),
      outputSchema: z.object({ cart: CartSchema }),
      _meta: { ui: { resourceUri: UI.cart } },
    },
    async (args: { id: string; qty: number }) => {
      try {
        const current = getCart().lines.find((l) => l.id === args.id);
        const cart = setQty(args.id, (current?.qty ?? 0) + args.qty);
        trackAdd(args.id, args.qty);
        return {
          content: [{ type: 'text' as const, text: `В корзине: ${cart.count} шт на ${rub(cart.total)}` }],
          structuredContent: { cart },
        };
      } catch (e) {
        return { isError: true, content: [{ type: 'text' as const, text: (e as Error).message }] };
      }
    },
  );

  // Изменить количество (0 = убрать)
  registerAppTool(
    server,
    'cart_update',
    {
      description: 'Изменить количество товара в корзине. qty 0 убирает товар.',
      inputSchema: z.object({
        id: z.string(),
        qty: z.number().int().min(0).max(99),
      }),
      outputSchema: z.object({ cart: CartSchema }),
      _meta: { ui: { resourceUri: UI.cart } },
    },
    async (args: { id: string; qty: number }) => {
      try {
        const cart = setQty(args.id, args.qty);
        return {
          content: [{ type: 'text' as const, text: `В корзине: ${cart.count} шт на ${rub(cart.total)}` }],
          structuredContent: { cart },
        };
      } catch (e) {
        return { isError: true, content: [{ type: 'text' as const, text: (e as Error).message }] };
      }
    },
  );

  // Показать корзину
  registerAppTool(
    server,
    'show_cart',
    {
      description: 'Показать корзину: состав, количество, итог и кнопка перехода к оформлению в WB.',
      inputSchema: z.object({}),
      outputSchema: z.object({ cart: CartSchema }),
      _meta: { ui: { resourceUri: UI.cart } },
    },
    async () => {
      const cart = getCart();
      return {
        content: [
          {
            type: 'text' as const,
            text: cart.lines.length ? `В корзине: ${cart.count} шт на ${rub(cart.total)}` : 'Корзина пуста',
          },
        ],
        structuredContent: { cart },
      };
    },
  );

  // Передача корзины в оформление WB (в прототипе — имитация)
  registerAppTool(
    server,
    'checkout',
    {
      description:
        'Передать корзину в оформление Wildberries. Подтверждение заказа, выбор ПВЗ, оплата и чек — на стороне WB, ' +
        'не в чате. В прототипе этот переход имитируется: создаётся тестовый заказ с меткой источника «ассистент», ' +
        'деньги не списываются. Вызывай только когда покупатель сам попросил оформить заказ.',
      inputSchema: z.object({}),
      outputSchema: z.object({ order: OrderSchema }),
      _meta: { ui: { resourceUri: UI.order } },
    },
    async () => {
      try {
        const { lines, total } = getCart();
        if (!lines.length) throw new Error('Корзина пуста');
        const order = createOrder(
          lines.map((l) => ({ id: l.id, title: l.title, price: l.price, qty: l.qty })),
          total,
        );
        clearCart();
        recordPurchase(order);
        const view = orderView(order);
        return {
          content: [{ type: 'text' as const, text: `Корзина передана в оформление WB (имитация, деньги не списываются). Тестовый заказ ${view.id}: ${rub(view.total)}` }],
          structuredContent: { order: view },
        };
      } catch (e) {
        return { isError: true, content: [{ type: 'text' as const, text: (e as Error).message }] };
      }
    },
  );
}
