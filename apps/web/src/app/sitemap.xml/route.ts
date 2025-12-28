import { NextResponse } from "next/server";

const LOCALES = ["bg", "en"] as const;
const STATIC_PATHS = ["", "map", "signals", "ideas", "events", "search"]; // ensure trailing slash removal later

async function fetchIds(collection: "signals" | "ideas" | "events") {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/public/ids?coll=${collection}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    console.warn("sitemap fetchIds failed", collection, res.status);
    return [] as { id: string; updatedAt?: number }[];
  }
  const payload = await res.json().catch(() => ({ rows: [] }));
  return (payload.rows || []) as { id: string; updatedAt?: number }[];
}

export async function GET() {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";

  const [signals, ideas, events] = await Promise.all([
    fetchIds("signals"),
    fetchIds("ideas"),
    fetchIds("events")
  ]);

  const urls: string[] = [];

  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS) {
      const loc = `${base}/${locale}/${path}`.replace(/\/+$/, "/");
      urls.push(`<url><loc>${loc}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
    }
  }

  const pushDetail = (locale: string, coll: string, id: string, updated?: number) => {
    const loc = `${base}/${locale}/${coll}/${id}`;
    const lastmod = updated ? `<lastmod>${new Date(updated).toISOString()}</lastmod>` : "";
    urls.push(`<url><loc>${loc}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.6</priority></url>`);
  };

  const locales = Array.from(LOCALES);
  signals.forEach((item) => locales.forEach((locale) => pushDetail(locale, "signals", item.id, item.updatedAt)));
  ideas.forEach((item) => locales.forEach((locale) => pushDetail(locale, "ideas", item.id, item.updatedAt)));
  events.forEach((item) => locales.forEach((locale) => pushDetail(locale, "events", item.id, item.updatedAt)));

  const xml = [`<?xml version="1.0" encoding="UTF-8"?>`, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`, ...urls, `</urlset>`].join("");

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
