import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerResource, UI } from './resources.js';
import { registerSearchTools } from './tools/search.js';
import { registerCartTools } from './tools/cart.js';
import { registerOrderTools } from './tools/orders.js';
import { registerStatsTools } from './tools/stats.js';

// Правила для ассистента: граница MVP и честность подборки (ДЗ 3.1).
const INSTRUCTIONS = [
  'Ты помогаешь покупателю подобрать товар в каталоге Wildberries (учебный прототип, каталог тестовый).',
  'Выдели обязательные условия покупателя (бюджет, свойства, срок доставки) и передай их в search_products отдельными параметрами.',
  'Показывай не больше 3 вариантов и для каждого — какие условия выполнены по данным карточки.',
  'Если search_products вернул exact=false, прямо скажи, что полностью подходящего товара нет, и назови, какое условие не выполнено у ближайших вариантов.',
  'Не утверждай свойств, цен и сроков, которых нет в ответах инструментов.',
  'Ассистент собирает подборку и корзину. Подтверждение заказа, оплата и чек — на стороне WB: checkout только передаёт корзину в оформление WB (в прототипе это имитация).',
].join('\n');

// Фабрика: в stateless-режиме под каждый запрос создаётся свой McpServer
// (переподключать один инстанс SDK запрещает), стор при этом общий на модуле.
export function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'shop-mcp', version: '0.2.0' }, { instructions: INSTRUCTIONS });

  registerResource(server, 'search_results', UI.search, 'search');
  registerResource(server, 'product_card', UI.product, 'product');
  registerResource(server, 'cart_view', UI.cart, 'cart');
  registerResource(server, 'orders_view', UI.orders, 'orders');
  registerResource(server, 'order_view', UI.order, 'order');
  registerResource(server, 'stats_view', UI.stats, 'stats');

  registerSearchTools(server);
  registerCartTools(server);
  registerOrderTools(server);
  registerStatsTools(server);

  return server;
}
