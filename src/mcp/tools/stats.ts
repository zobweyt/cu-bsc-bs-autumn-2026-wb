import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { getStats } from '../../store/metrics.js';
import { formatDuration } from '../../store/format.js';
import { StatsSchema } from '../schemas.js';
import { UI } from '../resources.js';

export function registerStatsTools(server: McpServer) {
  // Бизнес-метрики: воронка от первого поиска до оформления, конверсии, топы
  registerAppTool(
    server,
    'show_stats',
    {
      description:
        'Метрики прототипа: оборот, заказы, средний чек, конверсии, время от первого поиска до оформления, поиски с 3+ условиями и без полного совпадения, топ запросов и товаров, последние заказы. Вызывай, когда спрашивают про статистику, метрики, аналитику, продажи.',
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
              `Заказов: ${stats.totals.orders}, оборот (тест): ${stats.totals.revenue} ₽, ` +
              `средний чек: ${stats.totals.avgOrderValue} ₽. ` +
              `Среднее время от первого поиска до оформления: ${avg}. ` +
              `Поисков: ${stats.totals.searches}, из них с 3+ условиями: ${stats.searches.complex}, без полного совпадения: ${stats.searches.noExact}. ` +
              `Конверсия поиск → заказ: ${pct(stats.conversion.searchToOrder)}, ` +
              `корзина → заказ: ${pct(stats.conversion.cartToOrder)}.`,
          },
        ],
        structuredContent: { stats },
      };
    },
  );
}
