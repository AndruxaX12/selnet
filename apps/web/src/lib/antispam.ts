"use client";
// прост cooldown (ключ по тип форма)
export function canSubmit(key: string, seconds = 45) {
  const last = Number(localStorage.getItem(key) || 0);
  const now = Date.now();
  return now - last > seconds * 1000;
}

export function markSubmitted(key: string) {
  localStorage.setItem(key, String(Date.now()));
}
