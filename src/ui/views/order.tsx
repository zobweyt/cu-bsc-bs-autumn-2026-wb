import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { App as McpApp } from '@modelcontextprotocol/ext-apps';
import { fmt,  Loading,  useStuckNotice,  Stuck,  ViewHead,  Track,  type OrderView,  useHostTheme } from '../shared';

function OrderDetailView() {
  const [order, setOrder] = useState<OrderView | null>(null);
  const [busy, setBusy] = useState(false);

  const { app, error } = useApp({
    appInfo: { name: 'shop', version: '3.0.0' },
    capabilities: {},
    onAppCreated: (a: McpApp) => {
      a.ontoolresult = (res) => {
        const sc = (res as unknown as { structuredContent?: unknown }).structuredContent;
        setOrder((sc as { order?: OrderView } | undefined)?.order ?? null);
      };
    },
  });
  const stuck = useStuckNotice(!app && !error);

  if (error) return <div className="muted">Ошибка: {error.message}</div>;
  useHostTheme(app);
  if (!app) return stuck ? <Stuck /> : <Loading />;
  if (!order) return <div className="muted">Заказ не найден</div>;

  async function refresh() {
    setBusy(true);
    try {
      const res = await app!.callServerTool({ name: 'show_order', arguments: { id: order!.id } });
      const sc = res.structuredContent as { order: OrderView };
      setOrder(sc.order);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ViewHead
        title={`Заказ ${order.id}`}
        sub={`${order.date} · ${order.items.reduce((n, it) => n + it.qty, 0)} шт`}
      />
      <div className="panel">
        <span className="pill pill-mock">MOCK · деньги не списаны</span>
        <Track stage={order.stage} />
        {order.eta && (
          <p className="meta-line">Прибудет {order.eta}</p>
        )}
        {order.items.map((it) => (
          <div className="card" key={it.id} style={{ margin: '8px 0 0', boxShadow: 'none', padding: '9px 0' }}>
            <div className="card-info">
              <div className="card-title">
                {it.title} × {it.qty}
              </div>
            </div>
            <div className="price">{fmt(it.price * it.qty)}</div>
          </div>
        ))}
        <div className="total">
          <span>Итого</span>
          <span className="total-value">{fmt(order.total)}</span>
        </div>
        <button className="btn-small" disabled={busy} onClick={refresh}>
          {busy ? '…' : 'Обновить статус'}
        </button>
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<OrderDetailView />);
