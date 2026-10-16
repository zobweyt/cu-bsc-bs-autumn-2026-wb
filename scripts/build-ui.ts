// Сборка гостевых React-вьюх в автономные single-file HTML.
// Запуск: `bun run build:ui` (вшит в dev/start/build, руками не нужен).
// Результат: dist/ui/<view>.html — коммитятся, сервер читает их с диска.
//
// Важно: хост вставляет HTML через document.write, поэтому последовательности
// `</script` и `<!--` внутри бандла экранируются (`<\/script`, `<\!--`) —
// иначе парсер режет скрипт и вьюха умирает с SyntaxError. На рантайм это не
// влияет: в JS-строках `\/` === `/`.
import { mkdir } from 'node:fs/promises';

const views = ['search', 'product', 'cart', 'orders', 'order', 'stats'] as const;

const shell = await Bun.file('src/ui/shell.html').text();
const rawCss = await Bun.file('src/ui/styles.css').text();
// Минифицируем CSS для продакшена: исходник остаётся читаемым.
const css = rawCss
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();

const b = await Bun.build({
  entrypoints: views.map((v) => 'src/ui/views/' + v + '.tsx'),
  minify: true,
  target: 'browser',
  format: 'iife',
});
if (!b.success) {
  console.error(b.logs);
  process.exit(1);
}

await mkdir('dist/ui', { recursive: true });

for (let i = 0; i < b.outputs.length; i++) {
  const raw = await b.outputs[i].text();
  const js = raw.replace(/<\/script/gi, '<\\/script>').replace(/<!--/g, '<\\!-->');
  const html = shell.split('<!--CSS-->').join(css).split('<!--JS-->').join(js);
  await Bun.write(`dist/ui/${views[i]}.html`, html);
}

console.log('ui built: dist/ui/*.html');
