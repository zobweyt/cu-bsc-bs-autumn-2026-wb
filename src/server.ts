import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from './mcp/server.js';
import { clearCart } from './store/cart.js';
import { clearOrders } from './store/orders.js';
import { resetMetrics } from './store/metrics.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const PORT = Number(process.env.PORT ?? 3000);

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Last-Event-ID',
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

// Stateless-режим: сессии нет, под каждый запрос — свой McpServer + транспорт.
// Корзина/заказы/метрики общие — живут в памяти модулей src/store/*.
async function handleMcp(req: Request): Promise<Response> {
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  try {
    await server.connect(transport);
    const parsedBody =
      req.method === 'GET' || req.method === 'DELETE' ? undefined : await req.json().catch(() => undefined);
    return withCors(await transport.handleRequest(req, { parsedBody }));
  } catch (e) {
    console.error('MCP error:', e);
    transport.close().catch(() => {});
    server.close().catch(() => {});
    return withCors(Response.json({ error: 'internal error' }, { status: 500 }));
  }
}

Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/health') return withCors(Response.json({ ok: true }));
    // Скриншоты сценария для README и слайдов (docs/screens/*.png).
    const shot = url.pathname.match(/^\/screens\/([a-z0-9_-]+\.png)$/);
    if (shot) {
      // readFile + join(process.cwd(), ...) — как в resources.ts: так Vercel видит
      // файлы при трассировке и кладёт docs/screens в бандл функции.
      const png = await readFile(join(process.cwd(), 'docs', 'screens', shot[1])).catch(() => null);
      if (png) return withCors(new Response(png, { headers: { 'Content-Type': 'image/png' } }));
    }
    if (url.pathname === '/mcp') return handleMcp(req);
    // Сброс перед каждым интервью: корзина, заказы и метрики с нуля.
    // Работает, только если задан RESET_TOKEN (иначе 404 — эндпоинта как бы нет).
    if (url.pathname === '/reset' && req.method === 'POST') {
      const token = process.env.RESET_TOKEN;
      if (!token) return withCors(Response.json({ error: 'not found' }, { status: 404 }));
      if (req.headers.get('authorization') !== `Bearer ${token}`)
        return withCors(Response.json({ error: 'unauthorized' }, { status: 401 }));
      clearCart();
      clearOrders();
      resetMetrics();
      return withCors(Response.json({ ok: true }));
    }
    return withCors(Response.json({ error: 'not found' }, { status: 404 }));
  },
});

console.log(`shop-mcp listening on http://localhost:${PORT}/mcp`);
