"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HomeContent() {

  // Demo data - always show same content on server and client
  const demoSignals = [
    {
      id: "demo-1",
      title: "Дупка на ул. Рила, Врачеш",
      description: "Голяма дупка на главната улица, опасна за автомобилите",
      settlementLabel: "Врачеш"
    },
    {
      id: "demo-2", 
      title: "Неосветена спирка – Литаково",
      description: "Автобусната спирка няма осветление, опасно вечер",
      settlementLabel: "Литаково"
    },
    {
      id: "demo-3",
      title: "Замърсено дере – Скравена", 
      description: "Дерето е замърсено с боклуци и отпадъци",
      settlementLabel: "Скравена"
    }
  ];

  const demoEvents = [
    {
      id: "demo-e1",
      title: "Почистване на парка – Трудовец",
      description: "Доброволческа акция за почистване на централния парк",
      when: "12.10.2025",
      settlementLabel: "Трудовец"
    },
    {
      id: "demo-e2",
      title: "Селски събор – Новачене", 
      description: "Традиционен селски събор с музика и танци",
      when: "20.10.2025",
      settlementLabel: "Новачене"
    },
    {
      id: "demo-e3",
      title: "Работилница за компост – Липница",
      description: "Научете как да правите компост от органични отпадъци",
      when: "05.11.2025", 
      settlementLabel: "Липница"
    }
  ];

  const cards = [
    {
      href: "/signals/new",
      title: "Подай сигнал",
      desc: "Съобщи за проблем в населеното място.",
      icon: "🚨",
      color: "bg-red-50 hover:bg-red-100 border-red-200"
    },
    {
      href: "/events/new",
      href: `${base}/events/new`,
      title: "Предложи идея",
      desc: "Сподели идея за подобрение.",
      icon: "💡",
      color: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
    },
    {
      href: `${base}/events`,
      title: "Добави събитие",
      desc: "Организирай и покани хора.",
      icon: "🎉",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200"
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Добре дошли в СелНет
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Гражданска платформа за сигнали, идеи и събития в населените места
        </p>
      </div>

      {/* Action cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`rounded-xl border p-6 transition-all ${card.color} hover:shadow-md hover:-translate-y-1`}
          >
            <div className="text-2xl mb-3">{card.icon}</div>
            <h3 className="font-semibold mb-2">{card.title}</h3>
            <p className="text-sm text-gray-600">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent content sections */}
      <div className="space-y-8">
        {/* Recent Signals */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Последни сигнали</h2>
            <Link href={`${base}/signals`} className="text-blue-600 hover:text-blue-800 text-sm">
              Виж всички →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {demoSignals.map((signal) => (
              <Link
                key={signal.id}
                href={`${base}/signals/${signal.id}`}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium mb-2 line-clamp-2">{signal.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {signal.description}
                </p>
                <div className="text-xs text-gray-500">
                  📍 {signal.settlementLabel}
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">ДЕМО</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Предстоящи събития</h2>
            <Link href={`${base}/events`} className="text-blue-600 hover:text-blue-800 text-sm">
              Виж всички →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {demoEvents.map((event) => (
              <Link
                key={event.id}
                href={`${base}/events/${event.id}`}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium mb-2 line-clamp-2">{event.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {event.description}
                </p>
                <div className="text-xs text-gray-500">
                  📅 {event.when} • 📍 {event.settlementLabel}
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">ДЕМО</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Features section */}
      <div className="bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">Какво предлага СелНет?</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-medium mb-2">Офлайн режим</h3>
            <p className="text-sm text-gray-600">Работи дори без интернет връзка</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🔔</div>
            <h3 className="font-medium mb-2">Push известия</h3>
            <p className="text-sm text-gray-600">Получавайте актуални новини</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">📷</div>
            <h3 className="font-medium mb-2">Снимки от камера</h3>
            <p className="text-sm text-gray-600">Качвайте снимки директно</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🗺️</div>
            <h3 className="font-medium mb-2">Интерактивна карта</h3>
            <p className="text-sm text-gray-600">Преглеждайте всички сигнали</p>
          </div>
        </div>
      </div>
    </div>
  );
}

