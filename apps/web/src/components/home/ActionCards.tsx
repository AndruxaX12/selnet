"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

type Item = {
  href: string;
  colorClass: string;
  title: string;
  desc: string;
  icon: string;
};

export default function ActionCards({ locale = "bg" }: { locale?: "bg" | "en" }) {
  const t = locale === "bg" ? bg : en;
  const prefersReducedMotion = useReducedMotion();

  const items: Item[] = [
    { href: `/${locale}/signals/new`, colorClass: "bg-gradient-to-br from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700", title: t.report, desc: t.report_desc, icon: "⚠️" },
    { href: `/${locale}/ideas/new`, colorClass: "bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700", title: t.idea, desc: t.idea_desc, icon: "💡" },
    { href: `/${locale}/events/new`, colorClass: "bg-gradient-to-br from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700", title: t.event, desc: t.event_desc, icon: "📅" }
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 w-full max-w-4xl px-4 sm:px-0">
      {items.map((item, index) => (
        <Link key={item.href} href={item.href} className="block touch-target" aria-label={item.title}>
          <motion.div
            className={`rounded-2xl shadow-2xl px-4 py-6 sm:px-6 sm:py-8 transition-all duration-300 border-2 border-white/30 ${item.colorClass}`}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            whileHover={prefersReducedMotion ? undefined : { y: -8, scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1], delay: prefersReducedMotion ? 0 : index * 0.1 }}
          >
            <div className="text-4xl mb-3" aria-hidden>
              {item.icon}
            </div>
            <div className="text-xl font-bold mb-2">{item.title}</div>
            <div className="text-sm opacity-95">{item.desc}</div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

const bg = { report: "Подай сигнал", report_desc: "Съобщи за проблем", idea: "Подай идея", idea_desc: "Сподели идея за подобрение", event: "Добави събитие", event_desc: "Организирай събитие" };
const en = { report: "Report issue", report_desc: "Tell us about a problem", idea: "Suggest idea", idea_desc: "Share an improvement idea", event: "Add event", event_desc: "Organize an event" };
