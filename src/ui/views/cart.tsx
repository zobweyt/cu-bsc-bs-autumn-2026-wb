import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { App as McpApp } from '@modelcontextprotocol/ext-apps';
import { fmt, Loading,  useStuckNotice,  Stuck,  ViewHead,  ErrorBox,  Stepper,  type Cart,  useHostTheme } from '../shared';

const EMPTY: Cart = { lines: [], total: 0, count: 0 };

function CartView() {
  const [cart, setCart] = useState<Cart>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [doneId, setDoneId] = useState('');

  const { app, error } = useApp({
    appInfo: { name: 'shop', version: '3.1.0' },
    capabilities: {},
    onAppCreated: (a: McpApp) => {
      a.ontoolresult = (res) => {
        const sc = (res as unknown as { structuredContent?: unknown }).structuredContent;
        setCart((sc as { cart?: Cart } | undefined)?.cart ?? EMPTY);
        setBusy(false);
      };
    },
  });
  const stuck = useStuckNotice(!app && !error);

  useHostTheme(app);

  if (error) return <div className="muted">Ошибка: {error.message}</div>;
  if (!app) return stuck ? <Stuck /> : <Loading />;

  async function upd(id: string, qty: number) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await app!.callServerTool({ name: 'cart_update', arguments: { id, qty: Math.max(0, qty) } });
      const sc = res.structuredContent as { cart?: Cart } | undefined;
      setCart(sc?.cart ?? EMPTY);
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (busy || !cart.lines.length) return;
    setBusy(true);
    setErr('');
    try {
      const res = await app!.callServerTool({ name: 'checkout', arguments: {} });
      if (res.isError) {
        const first = res.content[0];
        throw new Error(first && first.type === 'text' ? first.text : 'Не удалось перейти к оформлению');
      }
      const sc = res.structuredContent as { order: { id: string } };
      setDoneId(sc.order.id);
      setCart(EMPTY);
      await app!.sendMessage({
        role: 'user',
        content: [{ type: 'text', text: `Я перешёл к оформлению в WB, заказ ${sc.order.id}. Покажи статус заказа.` }],
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ViewHead
        title="Корзина"
        sub={cart.lines.length ? `${cart.count} шт на ${fmt(cart.total)}` : undefined}
      />
      {doneId && (
        <div className="panel">
          <div className="muted">
            Корзина передана в оформление WB, заказ {doneId} (тест). Статус — попросите показать заказ.
          </div>
        </div>
      )}
      {!cart.lines.length ? (
        <div className="panel">
          <div className="muted">{doneId ? '' : 'Корзина пуста'}</div>
        </div>
      ) : (
        <div className="panel">
          {cart.lines.map((l) => (
            <div className="card" key={l.id} style={{ margin: 0, boxShadow: 'none', padding: '10px 0' }}>
              <img src={l.image} alt="" />
              <div className="card-info">
                <div className="card-title">{l.title}</div>
                <div className="card-meta">{fmt(l.price)} / шт</div>
              </div>
              <div>
                <Stepper qty={l.qty} disabled={busy} onChange={(q) => upd(l.id, q)} />
                <div className="price">{fmt(l.price * l.qty)}</div>
              </div>
            </div>
          ))}
          <div className="savings">
            <span>Выгода по скидкам</span>
            <span>−{fmt(cart.lines.reduce((n, l) => n + (l.oldPrice - l.price) * l.qty, 0))}</span>
          </div>
          <div className="total">
            <span>Итого</span>
            <span className="total-value">{fmt(cart.total)}</span>
          </div>
          <button className="btn" disabled={busy} onClick={pay}>
            {busy ? 'Передаём в WB…' : `Перейти к оформлению в WB · ${fmt(cart.total)}`}
          </button>
          <p className="note">Подтверждение, оплата и чек — на стороне WB. Тестовый режим: переход имитируется, деньги не списываются</p>
          {err && <ErrorBox message={err} />}
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<CartView />);
