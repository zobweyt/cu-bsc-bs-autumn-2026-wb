import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from './mcp/server.js';

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
// Корзина/заказы/метрики общие — живут в памяти модуля src/store.ts.
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
    if (url.pathname === '/mcp') return handleMcp(req);
    return withCors(Response.json({ error: 'not found' }, { status: 404 }));
  },
});

console.log(`shop-mcp listening on http://localhost:${PORT}/mcp`);
