# shop-mcp

Мок MCP-сервер магазина: поиск, корзина, тестовая оплата, заказы, метрики + React-вьюхи (MCP Apps).

Запуск только на Bun, деплоя на serverless нет (стор живёт в памяти процесса).

## Запуск

```bash
bun install
bun run dev      # http://localhost:3000/mcp
```

## Структура (весь код в `src/`)

- `src/server.ts` — точка входа (`Bun.serve`).
- `src/mcp/server.ts` — фабрика `createMcpServer()`.
- `src/mcp/resources.ts` — `ui://` ресурсы (HTML читается из `dist/ui/`).
- `src/mcp/schemas.ts` — общие zod-схемы `structuredContent`.
- `src/mcp/tools/` — по файлу на домен: `search.ts`, `cart.ts`, `orders.ts`, `stats.ts`.
- `src/store/` — стор в памяти: `cart.ts`, `orders.ts`, `metrics.ts`, `format.ts`.
- `src/catalog/` — `products.json` (данные) + `products.ts` (тип, поиск).
- `src/ui/views/*.tsx` — экраны (React + `useApp`), `src/ui/shared.tsx` — общее.
- `dist/ui/<view>.html` — собранные вьюхи (коммитятся).
- `scripts/build-ui.ts` — сборка UI (вшита в `dev`/`start`/`build`).

## Тулы

search_products, show_product, cart_add, cart_update, show_cart, checkout,
show_orders, show_order, show_stats.

## UI

Сборка `bun run build:ui` кладёт автономные single-file HTML в `dist/ui/`.
Внешних запросов из iframe нет.
