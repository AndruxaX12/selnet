"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  const path = usePathname() || `/${current}` ;
  const swap = (to: Locale) => {
    const parts = path.split("/");
    parts[1] = to;
    return parts.join("/") || `/${to}` ;
  };
  return (
    <div className="flex gap-2">
      {locales.map(l => (
        <Link key={l} href={swap(l)} className={`text-xs border rounded px-2 py-1 ${l===current?"bg-black text-white":""}` } hrefLang={l}>
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
