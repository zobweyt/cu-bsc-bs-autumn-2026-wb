import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { listOrders, getOrder } from '../../store/orders.js';
import { OrderSchema } from '../schemas.js';
import { UI } from '../resources.js';

export function registerOrderTools(server: McpServer) {
  // Список заказов со статусами
  registerAppTool(
    server,
    'show_orders',
    {
      description: 'Показать заказы: статусы Оплачен → Сборка → В пути → Доставлен.',
      inputSchema: z.object({}),
      outputSchema: z.object({ orders: z.array(OrderSchema) }),
      _meta: { ui: { resourceUri: UI.orders } },
    },
    async () => {
      const orders = listOrders();
      return {
        content: [
          {
            type: 'text' as const,
            text: orders.length
              ? orders.map((o) => `${o.id} — ${o.stageLabel}, ${o.total} ₽`).join('\n')
              : 'Заказов пока нет',
          },
        ],
        structuredContent: { orders },
      };
    },
  );

  // Один заказ детально
  registerAppTool(
    server,
    'show_order',
    {
      description: 'Карточка заказа: таймлайн статуса, состав, итог.',
      inputSchema: z.object({ id: z.string().describe('Номер заказа, например WB-XXXXXX') }),
      outputSchema: z.object({ order: OrderSchema }),
      _meta: { ui: { resourceUri: UI.order } },
    },
    async (args: { id: string }) => {
      try {
        const order = getOrder(args.id);
        return {
          content: [{ type: 'text' as const, text: `${order.id} — ${order.stageLabel}, ${order.total} ₽` }],
          structuredContent: { order },
        };
      } catch (e) {
        return { isError: true, content: [{ type: 'text' as const, text: (e as Error).message }] };
      }
    },
  );
}
