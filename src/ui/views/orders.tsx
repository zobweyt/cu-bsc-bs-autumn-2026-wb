import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { App as McpApp } from '@modelcontextprotocol/ext-apps';
import { fmt,  Loading,  useStuckNotice,  Stuck,  ViewHead,  type OrderView,  useHostTheme } from '../shared';

type OrderListItem = {
  id: string;
  date: string;
  total: number;
  stage: number;
  stageLabel: string;
  items: { qty: number }[];
  eta: string | null;
};

function OrdersView() {
  const [list, setList] = useState<OrderListItem[]>([]);
  const [opened, setOpened] = useState<Record<string, OrderView>>({});
  const [busyId, setBusyId] = useState('');

  const { app, error } = useApp({
    appInfo: { name: 'shop', version: '3.0.0' },
    capabilities: {},
    onAppCreated: (a: McpApp) => {
      a.ontoolresult = (res) => {
        const sc = (res as unknown as { structuredContent?: unknown }).structuredContent;
        setList((sc as { orders?: OrderListItem[] } | undefined)?.orders ?? []);
      };
    },
  });
  const stuck = useStuckNotice(!app && !error);

  if (error) return <div className="muted">Ошибка: {error.message}</div>;
  useHostTheme(app);
  if (!app) return stuck ? <Stuck /> : <Loading />;

  async function toggle(o: OrderListItem) {
    if (opened[o.id]) {
      setOpened((prev) => {
        const next = { ...prev };
        delete next[o.id];
        return next;
      });
      return;
    }
    setBusyId(o.id);
    try {
      const res = await app!.callServerTool({ name: 'show_order', arguments: { id: o.id } });
      const sc = res.structuredContent as { order: OrderView };
      setOpened((prev) => ({ ...prev, [o.id]: sc.order }));
    } finally {
      setBusyId('');
    }
  }

  const active = list.filter((o) => o.stage < 3).length;

  if (!list.length) {
    return (
      <>
        <ViewHead title="Заказы" />
        <div className="panel">
          <div className="muted">Заказов пока нет</div>
        </div>
      </>
    );
  }

  return (
    <>
      <ViewHead
        title="Заказы"
        sub={`${list.length} · активных: ${active}`}
      />
      {list.map((o) => (
        <div key={o.id}>
          <div className="card">
            <div className="card-info">
              <div className="card-title">
                {o.id} · {fmt(o.total)}
              </div>
              <div className="card-meta">
                {o.date} · {o.items.reduce((n, it) => n + it.qty, 0)} шт
                {o.eta ? ` · прибудет ${o.eta}` : ''}
              </div>
            </div>
            <span className="pill">{o.stageLabel}</span>
            <button className="btn-small" disabled={busyId === o.id} onClick={() => toggle(o)}>
              {opened[o.id] ? 'Скрыть' : busyId === o.id ? '…' : 'Детали'}
            </button>
          </div>
          {opened[o.id] && (
            <div className="panel">
              <p className="meta-line">
                {opened[o.id].items.map((it) => `${it.title} × ${it.qty}`).join('; ')}
              </p>
              <p className="meta-line">Статус: {opened[o.id].stageLabel} · MOCK</p>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<OrdersView />);
