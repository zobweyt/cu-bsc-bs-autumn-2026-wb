import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { App as McpApp } from '@modelcontextprotocol/ext-apps';
import {
  fmt,
  fmtRating,
  deliveryDate,
  plural,
  Star,
  ThumbUp,
  CartIcon,
  Checks,
  Loading,
  Stuck,
  ViewHead,
  useStuckNotice,
  useHostTheme,
  type SearchHit,
} from '../shared';

type Result = { conditions: string[]; exact: boolean; products: SearchHit[] };
const EMPTY: Result = { conditions: [], exact: true, products: [] };

function SearchView() {
  const [result, setResult] = useState<Result>(EMPTY);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const { app, error } = useApp({
    appInfo: { name: 'shop', version: '3.1.0' },
    capabilities: {},
    onAppCreated: (a: McpApp) => {
      a.ontoolresult = (res) => {
        const sc = (res as unknown as { structuredContent?: Partial<Result> }).structuredContent;
        setResult({ ...EMPTY, ...sc, products: sc?.products ?? [] });
      };
    },
  });
  const stuck = useStuckNotice(!app && !error);
  useHostTheme(app);

  if (error) return <div className="muted">Ошибка: {error.message}</div>;
  if (!app) return stuck ? <Stuck /> : <Loading />;

  const { conditions, exact, products } = result;

  async function add(p: SearchHit) {
    setBusy((b) => ({ ...b, [p.id]: true }));
    try {
      await app!.callServerTool({ name: 'cart_add', arguments: { id: p.id, qty: 1 } });
      setAdded((a) => ({ ...a, [p.id]: true }));
    } finally {
      setBusy((b) => ({ ...b, [p.id]: false }));
    }
  }

  const sub = !products.length
    ? 'Ничего не найдено'
    : exact
      ? `Подходят под все условия: ${products.length}`
      : 'Полностью подходящих нет';

  return (
    <>
      <ViewHead title="Подбор" sub={sub} />
      {conditions.length > 0 && (
        <ul className="conditions" aria-label="Условия покупателя">
          {conditions.map((c) => (
            <li key={c} className="condition">
              {c}
            </li>
          ))}
        </ul>
      )}
      {products.length > 0 && !exact && (
        <div className="notice" role="status">
          Под все условия в каталоге ничего нет. Ниже — ближайшие варианты, у каждого отмечено, какое условие не выполнено.
        </div>
      )}
      <div className="product-grid">
        {products.map((p) => {
          const done = !!added[p.id];
          const loading = !!busy[p.id];
          return (
            <div className={'product-card' + (exact ? '' : ' product-card-near')} key={p.id}>
              <div className="product-media">
                <img src={p.image} alt={p.title} />
                <span className="badge-discount">−{p.discount}%</span>
              </div>
              <div className="product-body">
                {p.discount >= 25 && (
                  <span className="badge-good">
                    <ThumbUp /> Хорошая цена
                  </span>
                )}
                <div className="prices">
                  <span className="price-hot">{fmt(p.price)}</span>
                  <span className="price-old">{fmt(p.oldPrice)}</span>
                </div>
                <div className="seller">
                  <b>{p.brand}</b>
                  <span className="seller-title"> / {p.title}</span>
                </div>
                <div className="rating">
                  <Star />
                  <b>{fmtRating(p.rating)}</b>
                  <span>
                    {' '}
                    · {p.reviews.toLocaleString('ru-RU')} {plural(p.reviews, ['оценка', 'оценки', 'оценок'])}
                  </span>
                </div>
                <Checks checks={p.checks} />
                <button
                  className="btn-delivery"
                  disabled={done || loading}
                  onClick={() => add(p)}
                  aria-label={done ? 'Уже в корзине' : `Добавить ${p.title} в корзину`}
                >
                  <CartIcon />
                  {done ? 'В корзине' : loading ? '…' : deliveryDate(p.deliveryDays)}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {products.length > 0 && <p className="meta-line">Данные из каталога WB · тестовый каталог</p>}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<SearchView />);
