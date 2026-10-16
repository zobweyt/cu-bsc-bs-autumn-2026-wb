import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { getStats } from '../../store/metrics.js';
import { formatDuration } from '../../store/format.js';
import { StatsSchema } from '../schemas.js';
import { UI } from '../resources.js';

export function registerStatsTools(server: McpServer) {
  // Бизнес-метрики: воронка от первого поиска до оплаты, конверсии, топы
  registerAppTool(
    server,
    'show_stats',
    {
      description:
        'Бизнес-метрики магазина: выручка, заказы, средний чек, конверсии, среднее время от первого поиска до оплаты, топ запросов и товаров, последние заказы. Вызывай, когда спрашивают про статистику, метрики, аналитику, продажи.',
      inputSchema: z.object({}),
      outputSchema: z.object({ stats: StatsSchema }),
      _meta: { ui: { resourceUri: UI.stats } },
    },
    async () => {
      const stats = getStats();
      const avg = stats.funnel.avgMs == null ? 'замеров пока нет' : formatDuration(stats.funnel.avgMs);
      const pct = (x: number | null) => (x == null ? '—' : Math.round(x * 100) + '%');
      return {
        content: [
          {
            type: 'text' as const,
            text:
              `Заказов: ${stats.totals.orders}, выручка: ${stats.totals.revenue} ₽, ` +
              `средний чек: ${stats.totals.avgOrderValue} ₽. ` +
              `Среднее время от первого поиска до оплаты: ${avg}. ` +
              `Конверсия поиск → заказ: ${pct(stats.conversion.searchToOrder)}, ` +
              `корзина → заказ: ${pct(stats.conversion.cartToOrder)}.`,
          },
        ],
        structuredContent: { stats },
      };
    },
  );
}
