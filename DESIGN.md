---
name: shop-mcp guest UI
description: WB-style product cards, cart, orders and metrics rendered inside chat (MCP Apps)
colors:
  wb: "#cb11ab"
  wb-dark: "#481173"
  bg: "#f4f1f8"
  bg-dark: "#16121e"
  card: "#ffffff"
  card-dark: "#221a30"
  ink: "#241e30"
  ink-dark: "#f5f1fa"
  muted: "#6f6a7e"
  muted-dark: "#b3a9c4"
  line: "#e8e3f0"
  line-dark: "#3b3049"
  sale: "#f8417f"
  ok: "#16a34a"
  err: "#d92d20"
  warn: "#b25e09"
typography:
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "17px"
    fontWeight: 800
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  price:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 800
rounded:
  card: "14px"
  control: "10px"
  pill: "999px"
spacing:
  card-gap: "8px"
  panel-pad: "12px"
components:
  btn:
    backgroundColor: "{colors.wb}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "10px 0"
  btn-small:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
  pill:
    rounded: "{rounded.pill}"
    padding: "2px 9px"
  card-row:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "10px"
---

## Overview

Шесть компактных инлайн-вьюх (поиск, товар, корзина, заказы, заказ, статистика) для чата. Светлая тема бренда WB; фон прозрачный — видна поверхность хоста, скруглены только сами карточки. Светлая/тёмная палитра — через `light-dark()`, хост может форсить схему.

## Colors

База — фиолетовый WB `{colors.wb}` (кнопки, активные точки таймлайна) и тёмный `{colors.wb-dark}`. Карточки `{colors.card}` на прозрачном фоне. Текст `{colors.ink}`, вторичный `{colors.muted}`, разделители `{colors.line}`. Скидка — `{colors.sale}`, успех — `{colors.ok}`, ошибка — `{colors.err}`, предупреждение об остатке — `{colors.warn}`. Тёмные значения — в `*-dark` токенах, применяются автоматически.

## Typography

Системный стек, один голос: заголовок вьюхи 17/800, тело 14/400, цена 15/800 с tabular-nums. Названия товаров обрезаются в одну-две строки многоточием.

## Layout

Вьюха занимает всю ширину чата. Результаты поиска — список строк, от 720px — две колонки. Плитка метрик — 2 колонки, от 720px — 4. Отступы карточек 8px, внутренние 10–12px.

## Elevation & Depth

Одна система: мягкая тень `0 1px 4px rgba(36,30,48,.08)` у карточек, панелей и плиток. Вложенных карточек нет — строки внутри панелей идут без тени.

## Shapes

Карточки и панели 14px, кнопки и степперы 10px, пилюли статусов и бейджи — пилюли. Пульсирующая точка текущего статуса заказа — единственная авторская анимация.

## Components

- `btn` — во всю ширину, «Перейти к оформлению в WB», «В корзину»; `btn-small` — контурная компактная («Детали», степперы рядом).
- `card` — строка: миниатюра 64, название, мета (рейтинг/цена), действие справа.
- `pill` — статус заказа; `pill-mock` — зелёная метка тестового режима.
- `timeline` — 4 стадии заказа с соединителем, текущая пульсирует.
- `stat-grid` — 8 плиток метрик (значение + подпись).
- `conditions` / `condition` — пилюли условий покупателя над подборкой.
- `checks` / `check-ok|fail|unknown` — ✓/✗/? по каждому условию на карточке; `notice` — плашка «полностью подходящих нет»; `product-card-near` — пунктир у ближайших, а не точных вариантов.
- `view-head` — заголовок вьюхи с подзаголовком-сводкой («Найдено: 14»).
- `stock` — наличие с точкой-индикатором (зелёная/оранжевая).
- Состояния: загрузка, пусто («Корзина пуста», «Заказов пока нет»), «полностью подходящих нет», ошибка перехода к оформлению, disabled у степперов во время запроса.

## Do's and Don'ts

- Делай фон прозрачным — красит хост, не мы.
- Не тяни внешние скрипты/картинки: песочница режет, всё инлайнится в один HTML.
- Не используй `</script` и `<!--` внутри бандла как есть — экранируй при сборке, иначе парсер хоста ломает скрипт.
- Не прячь мок: тестовый режим всегда подписан.
- Не повторяй текстом то, что уже показала карточка.
