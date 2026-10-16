// Общие типы данных тулов, хелперы и мелкие компоненты гостевых вьюх.
import { useEffect, useState, type ReactNode } from 'react';
import type { App as McpApp } from '@modelcontextprotocol/ext-apps';

export type Product = { id: string; title: string; brand: string; price: number; image: string; tags: string[] };
export type CartLine = { id: string; title: string; price: number; image: string; qty: number };
export type Cart = { lines: CartLine[]; total: number; count: number };
export type OrderItem = { id: string; title: string; price: number; qty: number };
export type OrderView = {
  id: string;
  date: string;
  total: number;
  items: OrderItem[];
  stage: number;
  stageLabel: string;
  eta: string | null;
  mock: boolean;
};
export type Stats = {
  totals: {
    searches: number;
    views: number;
    adds: number;
    unitsAdded: number;
    orders: number;
    revenue: number;
    avgOrderValue: number;
  };
  conversion: { searchToOrder: number | null; cartToOrder: number | null };
  funnel: { count: number; avgMs: number | null; minMs: number | null; maxMs: number | null };
  topQueries: { query: string; count: number }[];
  topProducts: { id: string; title: string; qty: number }[];
  recent: { id: string; date: string; total: number; items: number; durationMs: number | null }[];
};

export const STAGES = ['Оплачен', 'Сборка', 'В пути', 'Доставлен'];

export function fmt(n: number): string {
  return n.toLocaleString('ru-RU') + ' ₽';
}

export function fmtDur(ms: number | null): string {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return s + ' c';
  return Math.floor(s / 60) + ' мин ' + (s % 60) + ' c';
}

export function pct(x: number | null): string {
  return x == null ? '—' : Math.round(x * 100) + '%';
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Демо-витрина: рейтинг и скидка детерминированы по id, стабильны между показами
export function meta(p: { id: string; price: number }): { rating: number; reviews: number; off: number; old: number } {
  const h = hash(p.id);
  const off = 5 + (h % 26);
  return {
    rating: (45 + (h % 6)) / 10,
    reviews: 18 + (h % 480),
    off,
    old: Math.round(p.price / (1 - off / 100) / 10) * 10,
  };
}

// Остаток тоже детерминирован по id: стабилен между показами
export function stockFor(id: string): { left: number; low: boolean } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const left = 3 + (h % 40);
  return { left, low: left < 8 };
}

export function fmtDay(ts: number): string {
  return new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'short' });
}

export function fmtDayLong(ts: number): string {
  return new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'long' });
}

export function plural(n: number, forms: [string, string, string]): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}

export function ViewHead({ title, sub }: { title: string; sub?: string }): ReactNode {
  return (
    <div className="view-head">
      <h2 className="view-title">{title}</h2>
      {sub && <p className="view-sub">{sub}</p>}
    </div>
  );
}

export function Stock({ id }: { id: string }): ReactNode {
  const { left, low } = stockFor(id);
  return (
    <span className={'stock ' + (low ? 'stock-low' : 'stock-ok')}>
      {low ? `Осталось ${left} шт` : 'В наличии'}
    </span>
  );
}

export function Star(): ReactNode {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff8a00" aria-hidden="true">
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" />
    </svg>
  );
}

export function CartIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4h2l2.4 12.2a1.5 1.5 0 0 0 1.5 1.3H18a1.5 1.5 0 0 0 1.5-1.2L21 8H6" />
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
    </svg>
  );
}

export function CheckBadge(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#2f80ed" />
      <path d="M8.5 12.2l2.4 2.4 4.6-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ThumbUp(): ReactNode {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm2 9h7.6a2 2 0 0 0 2-2.4l-1.2-5.2a2 2 0 0 0-2-1.6H9.7l.7-3.9a1.7 1.7 0 0 0-3.3-.7L5 11l4 9z" />
    </svg>
  );
}

export function ChatIcon(): ReactNode {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z" />
    </svg>
  );
}

export function WalletIcon(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
      <rect x="3" y="7" width="18" height="11" rx="2" />
      <circle cx="16.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BoxIcon(): ReactNode {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 7.5L12 3.5l8.5 4L12 11.5z" />
      <path d="M3.5 7.5V16.5L12 20.5l8.5-4V7.5" />
      <path d="M12 11.5V20.5" />
    </svg>
  );
}

export function ShopIcon(): ReactNode {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9l1.5-5h13L20 9" />
      <path d="M4 9v11h16V9" />
      <path d="M4 9h16" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

export function Loading({ text = 'Загрузка…' }: { text?: string }): ReactNode {
  return <div className="muted">{text}</div>;
}

// Тема вьюхи: по умолчанию её выбирает сам браузер через
// `color-scheme: light dark` + `light-dark()` в CSS (ноль JS).
// Этот хук лишь форсит схему, которую прислал хост (Claude),
// и откатывает обратно, когда хост молчит.
export function useHostTheme(app: McpApp | null): void {
  useEffect(() => {
    if (!app) return;
    const root = document.documentElement;
    const apply = (theme: unknown) => {
      root.style.colorScheme = theme === 'light' || theme === 'dark' ? theme : '';
    };
    apply((app.getHostContext() as { theme?: unknown } | undefined)?.theme);
    const prev = app.onhostcontextchanged;
    app.onhostcontextchanged = (ctx) => {
      prev?.(ctx);
      apply((ctx as { theme?: unknown })?.theme);
    };
    return () => {
      root.style.colorScheme = '';
    };
  }, [app]);
}

// Если хост не отвечает дольше N мс — показываем диагноз вместо вечной
// загрузки. true, пока мост ещё не поднялся и ошибки нет.
export function useStuckNotice(waiting: boolean, ms = 10000): boolean {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => setStuck(true), ms);
    return () => clearTimeout(t);
  }, [waiting, ms]);
  return stuck && waiting;
}

export function Stuck(): ReactNode {
  return (
    <div className="panel">
      <div className="muted">
        Вьюха загрузилась, но хост не отвечает на подключение.
        Похоже, этот клиент не поддерживает интерактивные виджеты —
        данные выше текстом, кнопки тут не оживут.
      </div>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }): ReactNode {
  return <div className="error">{message}</div>;
}

export function Stepper({
  qty,
  disabled,
  onChange,
}: {
  qty: number;
  disabled?: boolean;
  onChange: (qty: number) => void;
}): ReactNode {
  return (
    <div className="stepper">
      <button disabled={disabled} aria-label="Убавить" onClick={() => onChange(qty - 1)}>
        −
      </button>
      <span className="qty">{qty}</span>
      <button disabled={disabled} aria-label="Прибавить" onClick={() => onChange(qty + 1)}>
        +
      </button>
    </div>
  );
}

export function Track({ stage }: { stage: number }): ReactNode {
  return (
    <div className="timeline">
      {STAGES.map((s, i) => (
        <div key={s} className={'timeline-step' + (i < stage ? ' done' : '') + (i === stage ? ' now' : '')}>
          <div className="timeline-dot" />
          <div className="timeline-label">{s}</div>
        </div>
      ))}
    </div>
  );
}
