export function formatDate(t: number): string {
  return new Date(t).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)} c`;
  return `${Math.floor(ms / 60000)} мин ${Math.round((ms % 60000) / 1000)} c`;
}
