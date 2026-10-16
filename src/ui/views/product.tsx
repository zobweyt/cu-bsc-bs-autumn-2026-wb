import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { App as McpApp } from '@modelcontextprotocol/ext-apps';
import { fmt,  fmtDay,  fmtDayLong,  meta,  plural,  Star,  ThumbUp,  CheckBadge,  ChatIcon,  BoxIcon,  ShopIcon,  Loading,  Stuck,  ErrorBox,  useStuckNotice,  useHostTheme,  type Product,   } from '../shared';

function ProductView() {
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState('');

  const { app, error } = useApp({
    appInfo: { name: 'shop', version: '3.0.0' },
    capabilities: {},
    onAppCreated: (a: McpApp) => {
      a.ontoolresult = (res) => {
        const sc = (res as unknown as { structuredContent?: unknown }).structuredContent;
        setProduct((sc as { product?: Product } | undefined)?.product ?? null);
        setQty(1);
        setAdded(false);
      };
    },
  });
  const stuck = useStuckNotice(!app && !error);
  useHostTheme(app);

  if (error) return <div className="muted">Ошибка: {error.message}</div>;
  if (!app) return stuck ? <Stuck /> : <Loading />;
  if (!product) return <div className="muted">Товар не найден</div>;

  const m = meta(product);
  const questions = 3 + (m.reviews % 27);
  const delivery = fmtDayLong(Date.now() + 86400000);

  async function add() {
    setBusy(true);
    try {
      await app!.callServerTool({ name: 'cart_add', arguments: { id: product!.id, qty } });
      setAdded(true);
      setQty(1);
      setTimeout(() => setAdded(false), 1500);
    } finally {
      setBusy(false);
    }
  }

  async function buyNow() {
    setBuying(true);
    setErr('');
    try {
      await app!.callServerTool({ name: 'cart_add', arguments: { id: product!.id, qty } });
      const res = (await app!.callServerTool({ name: 'checkout', arguments: {} })) as {
        isError?: boolean;
        content?: { type: string; text?: string }[];
        structuredContent?: { order?: { id: string } };
      };
      if (res?.isError) {
        const first = res?.content?.[0];
        throw new Error((first && first.text) || 'Оплата не прошла');
      }
      const id = res?.structuredContent?.order?.id;
      await app!.sendMessage({
        role: 'user',
        content: [
          {
            type: 'text',
            text: id
              ? `Я купил ${product!.title} в один клик, заказ ${id}. Покажи статус заказа.`
              : `Я купил ${product!.title} в один клик.`,
          },
        ],
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBuying(false);
    }
  }

  return (
    <>
      <p className="crumbs">Главная / {product.tags[0] ?? 'Каталог'}</p>
      <div className="panel product-detail">
        <img src={product.image} alt={product.title} />
        <div className="brand-row">
          <span className="brand-pill">{product.brand}</span>
          <span className="brand-pill">
            <CheckBadge /> Оригинал
          </span>
        </div>
        <h2>{product.title}</h2>
        <div className="rating-line">
          <span className="rating">
            <Star />
            <b>{m.rating.toFixed(1).replace('.', ',')}</b>
            <span> · {m.reviews.toLocaleString('ru-RU')} {plural(m.reviews, ['оценка', 'оценки', 'оценок'])}</span>
          </span>
          <span className="questions">
            <ChatIcon /> {questions} {plural(questions, ['вопрос', 'вопроса', 'вопросов'])}
          </span>
          <span className="article">Арт: WB-{product.id.padStart(6, '0')}</span>
        </div>
        <button className="btn-ghost" onClick={() => setMore((v) => !v)} aria-expanded={more}>
          {more ? 'Скрыть характеристики' : 'Больше информации о товаре'}
        </button>
        {more && (
          <dl>
            <div className="spec">
              <dt className="spec-name">Артикул</dt>
              <span className="spec-dots" aria-hidden="true" />
              <dd className="spec-value">WB-{product.id.padStart(6, '0')}</dd>
            </div>
            <div className="spec">
              <dt className="spec-name">Рейтинг</dt>
              <span className="spec-dots" aria-hidden="true" />
              <dd className="spec-value">
                {m.rating.toFixed(1).replace('.', ',')} · {m.reviews} {plural(m.reviews, ['оценка', 'оценки', 'оценок'])}
              </dd>
            </div>
            <div className="spec">
              <dt className="spec-name">Доставка</dt>
              <span className="spec-dots" aria-hidden="true" />
              <dd className="spec-value">{fmtDay(Date.now() + 86400000)}</dd>
            </div>
            <div className="spec">
              <dt className="spec-name">Возврат</dt>
              <span className="spec-dots" aria-hidden="true" />
              <dd className="spec-value">14 дней</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="panel buybox">
        <div className="prices">
          <span className="price-wallet">{fmt(product.price)}</span>
          <span className="price-old">{fmt(m.old)}</span>
        </div>
        {m.off >= 15 && (
          <span className="badge-good">
            <ThumbUp /> Хорошая цена
          </span>
        )}
        <div className="buy-row">
          <div className="stepper">
            <button aria-label="Убавить" disabled={busy || buying} onClick={() => setQty((q) => Math.max(1, q - 1))}>
              −
            </button>
            <span className="qty">{qty}</span>
            <button aria-label="Прибавить" disabled={busy || buying} onClick={() => setQty((q) => Math.min(99, q + 1))}>
              +
            </button>
          </div>
          <button className="btn btn-lg" disabled={busy || buying} onClick={add}>
            {busy ? '…' : added ? 'Добавлено' : 'Добавить в корзину'}
          </button>
        </div>
        <button className="btn-secondary" disabled={busy || buying} onClick={buyNow}>
          {buying ? 'Оформляем…' : 'Купить сейчас'}
        </button>
        {err && <ErrorBox message={err} />}
        <p className="delivery-line">
          <BoxIcon /> {delivery}, склад продавца
        </p>
        <p className="delivery-line">
          <ShopIcon /> Официальный магазин · <Star /> 4,7
        </p>
        <p className="meta-line">Тестовый каталог: оплата мок, деньги не списываются</p>
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<ProductView />);
