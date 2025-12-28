const fetch = globalThis.fetch ?? (await import("node-fetch")).default;

async function fetchExpect(path, code) {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const url = new URL(path, base).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.status !== code) {
      throw new Error(`Expected ${code} for ${path}, got ${res.status}`);
    }
    console.log("✓", path, code);
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  await fetchExpect("/bg", 200);
  await fetchExpect("/bg/events", 200);
  await fetchExpect("/bg/events/map", 200);
  await fetchExpect("/bg/map", 200);
  await fetchExpect("/bg/search", 200);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
