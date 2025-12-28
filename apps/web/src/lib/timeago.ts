export function timeAgo(ts?: number) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `преди ${s} сек`;
  const m = Math.floor(s / 60);
  if (m < 60) return `преди ${m} м`;
  const h = Math.floor(m / 60);
  if (h < 24) return `преди ${h} ч`;
  const d = Math.floor(h / 24);
  return `преди ${d} д`;
}
