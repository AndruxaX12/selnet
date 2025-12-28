"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabBar() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;

  const tabs = [
    { href: base, label: "Начало", icon: "🏠" },
    { href: `${base}/map`, label: "Карта", icon: "🗺️" },
    { href: `${base}/signals/new`, label: "Добави", icon: "➕" },
    { href: `${base}/me`, label: "Моите", icon: "👤" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t grid grid-cols-4 text-xs md:hidden safe-bottom">
      {tabs.map(tab => {
        const isActive = pathname === tab.href || (tab.href !== base && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`py-2 px-1 text-center flex flex-col items-center justify-center min-h-[60px] transition-colors ${
              isActive
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-xs mt-1">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
