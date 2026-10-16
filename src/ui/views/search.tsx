import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { App as McpApp } from '@modelcontextprotocol/ext-apps';
import { fmt,  fmtDayLong,  meta,  plural,  Star,  ThumbUp,  CartIcon,  Loading,  Stuck,  ViewHead,  useStuckNotice,  useHostTheme,  type Product,   } from '../shared';

function SearchView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const { app, error } = useApp({
    appInfo: { name: 'shop', version: '3.0.0' },
    capabilities: {},
    onAppCreated: (a: McpApp) => {
      a.ontoolresult = (res) => {
        const sc = (res as unknown as { structuredContent?: unknown }).structuredContent;
        setProducts((sc as { products?: Product[] } | undefined)?.products ?? []);
      };
    },
  });
  const stuck = useStuckNotice(!app && !error);
  useHostTheme(app);

  if (error) return <div className="muted">Ошибка: {error.message}</div>;
  if (!app) return stuck ? <Stuck /> : <Loading />;
  if (!products.length) return <div className="muted">Ничего не найдено</div>;

  async function add(p: Product) {
    setBusy((b) => ({ ...b, [p.id]: true }));
    try {
      await app!.callServerTool({ name: 'cart_add', arguments: { id: p.id, qty: 1 } });
      setAdded((a) => ({ ...a, [p.id]: true }));
    } finally {
      setBusy((b) => ({ ...b, [p.id]: false }));
    }
  }

  const delivery = fmtDayLong(Date.now() + 86400000);

  return (
    <>
      <ViewHead title="Каталог" sub={`Найдено: ${products.length}`} />
      <div className="product-grid">
        {products.map((p) => {
          const m = meta(p);
          const done = !!added[p.id];
          const loading = !!busy[p.id];
          return (
            <div className="product-card" key={p.id}>
              <div className="product-media">
                <img src={p.image} alt={p.title} />
                <span className="badge-discount">−{m.off}%</span>
              </div>
              <div className="product-body">
                {m.off >= 25 && (
                  <span className="badge-good">
                    <ThumbUp /> Хорошая цена
                  </span>
                )}
                {m.rating >= 4.8 && m.reviews > 300 && <span className="badge-hit">Хиты</span>}
                <div className="prices">
                  <span className="price-hot">{fmt(p.price)}</span>
                  <span className="price-old">{fmt(m.old)}</span>
                </div>
                <div className="seller">
                  <b>{p.brand}</b>
                  <span className="seller-title"> / {p.title}</span>
                </div>
                <div className="rating">
                  <Star />
                  <b>{m.rating.toFixed(1).replace('.', ',')}</b>
                  <span>
                    {' '}
                    · {m.reviews.toLocaleString('ru-RU')} {plural(m.reviews, ['оценка', 'оценки', 'оценок'])}
                  </span>
                </div>
                <button
                  className="btn-delivery"
                  disabled={done || loading}
                  onClick={() => add(p)}
                  aria-label={done ? 'Уже в корзине' : `Добавить ${p.title} в корзину`}
                >
                  <CartIcon />
                  {done ? 'В корзине' : loading ? '…' : delivery}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<SearchView />);
