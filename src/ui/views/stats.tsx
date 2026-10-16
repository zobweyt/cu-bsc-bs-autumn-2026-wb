import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { App as McpApp } from '@modelcontextprotocol/ext-apps';
import { fmt,  fmtDur,  pct,  Loading,  useStuckNotice,  Stuck,  ViewHead,  type Stats,  useHostTheme } from '../shared';

function StatsView() {
  const [stats, setStats] = useState<Stats | null>(null);

  const { app, error } = useApp({
    appInfo: { name: 'shop', version: '3.0.0' },
    capabilities: {},
    onAppCreated: (a: McpApp) => {
      a.ontoolresult = (res) => {
        const sc = (res as unknown as { structuredContent?: unknown }).structuredContent;
        setStats((sc as { stats?: Stats } | undefined)?.stats ?? null);
      };
    },
  });
  const stuck = useStuckNotice(!app && !error);

  if (error) return <div className="muted">Ошибка: {error.message}</div>;
  useHostTheme(app);
  if (!app) return stuck ? <Stuck /> : <Loading />;
  if (!stats) return <div className="muted">Нет данных</div>;

  const t = stats.totals;
  const f = stats.funnel;
  const c = stats.conversion;
  const tiles: [string, string][] = [
    ['Выручка', fmt(t.revenue)],
    ['Заказы', String(t.orders)],
    ['Средний чек', fmt(t.avgOrderValue)],
    ['Поисков', String(t.searches)],
    ['Время до оплаты', fmtDur(f.avgMs)],
    ['Поиск → заказ', pct(c.searchToOrder)],
    ['Корзина → заказ', pct(c.cartToOrder)],
    ['Просмотров', String(t.views)],
  ];

  return (
    <>
      <ViewHead
        title="Метрики"
        sub={
          t.orders
            ? `${t.orders} зак. · ${fmt(t.revenue)} · чек ${fmt(t.avgOrderValue)}`
            : 'Пока пусто — оформите первый заказ'
        }
      />
      <div className="stat-grid">
        {tiles.map(([label, value]) => (
          <div className="stat-card" key={label}>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
      {f.count > 1 && (
        <div className="panel">
          <p className="meta-line">
            Быстрее всего: {fmtDur(f.minMs)} · дольше всего: {fmtDur(f.maxMs)} · замеров: {f.count}
          </p>
        </div>
      )}
      {!!stats.recent.length && (
        <div className="panel">
          <h2>Заказы</h2>
          {stats.recent.map((o) => (
            <div className="list-row" key={o.id}>
              <div className="card-info">
                <div className="card-title">
                  {o.id} · {o.date}
                </div>
                <div className="card-sub">
                  {o.items} шт · до оплаты {fmtDur(o.durationMs)}
                </div>
              </div>
              <div className="list-sum">{fmt(o.total)}</div>
            </div>
          ))}
        </div>
      )}
      {!!stats.topQueries.length && (
        <div className="panel">
          <h2>Топ запросов</h2>
          {stats.topQueries.map((q, i) => (
            <p className="meta-line" key={q.query}>
              {i + 1}. {q.query} — {q.count}
            </p>
          ))}
        </div>
      )}
      {!!stats.topProducts.length && (
        <div className="panel">
          <h2>Топ товаров</h2>
          {stats.topProducts.map((p, i) => (
            <p className="meta-line" key={p.id}>
              {i + 1}. {p.title} — {p.qty} шт
            </p>
          ))}
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<StatsView />);
