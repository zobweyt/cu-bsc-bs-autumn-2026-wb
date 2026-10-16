import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';

export const UI = {
  search: 'ui://shop/search',
  product: 'ui://shop/product',
  cart: 'ui://shop/cart',
  orders: 'ui://shop/orders',
  order: 'ui://shop/order',
  stats: 'ui://shop/stats',
} as const;

// Вьюхи лежат готовыми файлами в dist/ui/<view>.html (собирает `bun run build:ui`),
// читаются с диска на каждый resources/read — всегда свежие и в деве, и в проде.
async function uiHtml(view: string): Promise<string> {
  return readFile(join(process.cwd(), 'dist', 'ui', view + '.html'), 'utf-8');
}

export function registerResource(server: McpServer, name: string, uri: string, view: string) {
  registerAppResource(server, name, uri, {}, async () => ({
    // HTML полностью автономный (React-бандл заинлайнен сборкой),
    // внешних запросов нет — CSP не требуется.
    contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text: await uiHtml(view) }],
  }));
}
