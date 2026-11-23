import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { searchProducts, findProduct, productView, productLine, specList } from '../../store/catalog.js';
import { trackSearch, trackView } from '../../store/metrics.js';
import { ProductSchema, SearchHitSchema } from '../schemas.js';
import { UI } from '../resources.js';

export function registerSearchTools(server: McpServer) {
  // Поиск по условиям: точные совпадения или честное «под все условия нет» + ближайшие
  registerAppTool(
    server,
    'search_products',
    {
      description:
        'Подбор товаров в каталоге WB по условиям покупателя. В query — только тип товара ("мышь", "клавиатура"); ' +
        'бюджет и свойства передавай отдельными параметрами. Ответ: товары, подходящие под ВСЕ условия, ' +
        'либо exact=false и до 3 ближайших вариантов с отметкой, какое условие не выполнено. ' +
        'Показывай покупателю не больше 3 вариантов и для каждого — какие условия выполнены по данным карточки. ' +
        'Если exact=false, прямо скажи, что полностью подходящего товара нет. Не утверждай свойств, которых нет в данных.',
      inputSchema: z.object({
        query: z.string().describe('Тип товара, например "мышь". Пустая строка — весь каталог'),
        maxPrice: z.number().optional().describe('Бюджет: максимальная цена в рублях'),
        minPrice: z.number().optional().describe('Минимальная цена в рублях'),
        wireless: z.boolean().optional().describe('true — только беспроводные (радио или Bluetooth), false — только проводные'),
        silent: z.boolean().optional().describe('true — только с бесшумными кликами/клавишами'),
        backlight: z.boolean().optional().describe('true — только с подсветкой'),
        minDpi: z.number().optional().describe('Минимальное разрешение сенсора мыши, DPI'),
        maxDeliveryDays: z.number().optional().describe('Доставка не дольше N дней'),
      }),
      outputSchema: z.object({
        conditions: z.array(z.string()),
        exact: z.boolean(),
        products: z.array(SearchHitSchema),
      }),
      _meta: { ui: { resourceUri: UI.search } },
    },
    async (args: {
      query: string;
      maxPrice?: number;
      minPrice?: number;
      wireless?: boolean;
      silent?: boolean;
      backlight?: boolean;
      minDpi?: number;
      maxDeliveryDays?: number;
    }) => {
      const { query, ...filters } = args;
      const res = searchProducts(query, filters);
      trackSearch(query, res.hits.length, res.conditions.length, res.exact);
      const products = res.hits.map((h) => ({ ...productView(h.product), checks: h.checks }));

      const cond = res.conditions.length ? `Условия: ${res.conditions.join(', ')}.` : 'Условий нет.';
      let text: string;
      if (!res.hits.length) text = `${cond} Ничего не найдено по запросу «${query}».`;
      else if (res.exact)
        text = `${cond} Подходят под все условия: ${res.hits.length}.\n` + res.hits.map((h) => productLine(h.product, h.checks)).join('\n');
      else
        text =
          `${cond} Полностью подходящих товаров нет. Ближайшие варианты (✗ — что не выполнено):\n` +
          res.hits.map((h) => productLine(h.product, h.checks)).join('\n');

      return {
        content: [{ type: 'text' as const, text }],
        structuredContent: { conditions: res.conditions, exact: res.exact, products },
      };
    },
  );

  // Детально один продукт
  registerAppTool(
    server,
    'show_product',
    {
      description:
        'Карточка товара: цена, скидка, рейтинг, срок доставки, наличие, характеристики и кнопка «В корзину». ' +
        'Отвечая про свойства товара, опирайся только на характеристики из ответа.',
      inputSchema: z.object({ id: z.string().describe('ID товара из поиска') }),
      outputSchema: z.object({ product: ProductSchema }),
      _meta: { ui: { resourceUri: UI.product } },
    },
    async (args: { id: string }) => {
      const product = findProduct(args.id);
      if (!product) {
        return { isError: true, content: [{ type: 'text' as const, text: 'Товар не найден: ' + args.id }] };
      }
      trackView(args.id);
      const specs = specList(product.specs);
      return {
        content: [
          {
            type: 'text' as const,
            text:
              productLine(product) +
              (specs.length ? '' : '\nХарактеристик в данных нет — о свойствах товара ничего не утверждай.'),
          },
        ],
        structuredContent: { product: productView(product) },
      };
    },
  );
}
