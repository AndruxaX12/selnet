export function highlight(text: string, query: string) {
  if (!query) return text;
  const esc = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${esc})`, "ig");
  return text.replace(re, "<mark>$1</mark>");
}
