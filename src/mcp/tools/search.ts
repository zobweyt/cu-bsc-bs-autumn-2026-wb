import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { searchProducts, findProduct } from '../../store/catalog.js';
import { trackSearch, trackView } from '../../store/metrics.js';
import { ProductSchema } from '../schemas.js';
import { UI } from '../resources.js';

export function registerSearchTools(server: McpServer) {
  // Поиск: компактные карточки с кнопкой «В корзину»
  registerAppTool(
    server,
    'search_products',
    {
      description:
        'Поиск товаров в каталоге. Показывает компактные карточки с кнопкой добавления в корзину. Используй, когда пользователь ищет товар.',
      inputSchema: z.object({
        query: z.string().describe('Что искать, например "мышь". Пустая строка — весь каталог'),
        maxPrice: z.number().optional().describe('Максимальная цена в рублях'),
      }),
      outputSchema: z.object({ products: z.array(ProductSchema) }),
      _meta: { ui: { resourceUri: UI.search } },
    },
    async (args: { query: string; maxPrice?: number }) => {
      const products = searchProducts(args.query, args.maxPrice);
      trackSearch(args.query, products.length);
      return {
        content: [
          {
            type: 'text' as const,
            text: products.length
              ? products.map((p) => `#${p.id} ${p.title} — ${p.price} ₽`).join('\n')
              : 'Ничего не найдено',
          },
        ],
        structuredContent: { products },
      };
    },
  );

  // Детально один продукт
  registerAppTool(
    server,
    'show_product',
    {
      description: 'Карточка товара: фото, цена, скидка, рейтинг и кнопка «В корзину».',
      inputSchema: z.object({ id: z.string().describe('ID товара из поиска') }),
      outputSchema: z.object({ product: ProductSchema }),
      _meta: { ui: { resourceUri: UI.product } },
    },
    async (args: { id: string }) => {
      const product = findProduct(args.id);
      if (!product) {
        return { isError: true, content: [{ type: 'text' as const, text: 'Товар не найден' }] };
      }
      trackView(args.id);
      return {
        content: [{ type: 'text' as const, text: `${product.title} — ${product.price} ₽` }],
        structuredContent: { product },
      };
    },
  );
}
