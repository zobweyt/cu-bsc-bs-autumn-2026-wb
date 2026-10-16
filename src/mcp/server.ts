import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerResource, UI } from './resources.js';
import { registerSearchTools } from './tools/search.js';
import { registerCartTools } from './tools/cart.js';
import { registerOrderTools } from './tools/orders.js';
import { registerStatsTools } from './tools/stats.js';

// Фабрика: в stateless-режиме под каждый запрос создаётся свой McpServer
// (переподключать один инстанс SDK запрещает), стор при этом общий на модуле.
export function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'shop-mcp', version: '0.1.0' });

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
