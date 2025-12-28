export type Flag = "search_local_index" | "heat_layer" | "embed_widgets";

const defaults: Record<Flag, boolean> = {
  search_local_index: true,
  heat_layer: true,
  embed_widgets: true
};

export function flag(name: Flag) {
  const env = process.env[`NEXT_PUBLIC_FLAG_${name.toUpperCase()}`];
  if (env === "0" || env === "false") return false;
  if (env === "1" || env === "true") return true;
  return defaults[name];
}
