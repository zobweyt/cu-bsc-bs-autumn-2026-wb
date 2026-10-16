# AGENTS

Стек: Bun + TypeScript, MCP SDK (stateless Streamable HTTP), ext-apps, zod,
React (только гостевые вьюхи в `src/ui/views/*.tsx`). Только Bun, без serverless.

- Точка входа: `src/server.ts` (Bun.serve) → `src/mcp/server.ts`.
- Тулы по доменам: `src/mcp/tools/{search,cart,orders,stats}.ts`; схемы в `src/mcp/schemas.ts`.
- Ресурсы: `src/mcp/resources.ts` (читает `dist/ui/*.html` с диска).
- Стор: `src/store/{cart,orders,metrics,format,catalog}.ts`; данные: `src/store/data.json`.
- Вьюхи: `src/ui/views/*.tsx` → `dist/ui/*.html` (`bun run build:ui`).
