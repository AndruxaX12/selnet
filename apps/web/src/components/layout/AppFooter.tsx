"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Lightbulb, AlertCircle, Map, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

export default function AppFooter() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const base = `/${locale}`;

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 text-white mt-12 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img
                src="/images/SelNet - Logo.png"
                alt="СелНет"
                className="h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <h3 className="text-xl font-bold">СелНет</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Гражданска платформа за сигнали, идеи и събития в населените места. 
              Свързваме общността с местната власт за по-добро бъдеще.
            </p>
            <div className="flex space-x-3 pt-2">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-emerald-400">Бързи действия</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href={`${base}/signals`} 
                  className="flex items-center text-gray-400 hover:text-emerald-400 transition-colors group"
                >
                  <AlertCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span>Подай сигнал</span>
                </Link>
              </li>
              <li>
                <Link 
                  href={`${base}/ideas/new`} 
                  className="flex items-center text-gray-400 hover:text-purple-400 transition-colors group"
                >
                  <Lightbulb className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span>Сподели идея</span>
                </Link>
              </li>
              <li>
                <Link 
                  href={`${base}/events/new`} 
                  className="flex items-center text-gray-400 hover:text-blue-400 transition-colors group"
                >
                  <Calendar className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span>Създай събитие</span>
                </Link>
              </li>
              <li>
                <Link 
                  href={`${base}/map`} 
                  className="flex items-center text-gray-400 hover:text-teal-400 transition-colors group"
                >
                  <Map className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span>Виж картата</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Information Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-emerald-400">Информация</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href={`${base}/signals`} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Всички сигнали
                </Link>
              </li>
              <li>
                <Link 
                  href={`${base}/ideas`} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Популярни идеи
                </Link>
              </li>
              <li>
                <Link 
                  href={`${base}/events`} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Предстоящи събития
                </Link>
              </li>
              <li>
                <Link 
                  href={`${base}/about`} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  За нас
                </Link>
              </li>
              <li>
                <Link 
                  href={`${base}/faq`} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Често задавани въпроси
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-emerald-400">Контакти</h4>
            <ul className="space-y-3">
              <li className="flex items-start text-gray-400">
                <MapPin className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-emerald-400" />
                <span className="text-sm">
                  гр. Ботевград<br />
                  обл. София
                </span>
              </li>
              <li className="flex items-center text-gray-400">
                <Phone className="w-5 h-5 mr-2 flex-shrink-0 text-emerald-400" />
                <a href="tel:+359123456789" className="hover:text-white transition-colors">
                  +359 123 456 789
                </a>
              </li>
              <li className="flex items-center text-gray-400">
                <Mail className="w-5 h-5 mr-2 flex-shrink-0 text-emerald-400" />
                <a href="mailto:info@selnet.bg" className="hover:text-white transition-colors">
                  info@selnet.bg
                </a>
              </li>
            </ul>

            {/* Newsletter */}
            <div className="mt-6">
              <h5 className="text-sm font-semibold mb-2">Абонирай се за новини</h5>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Твоят email"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
                >
                  →
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} СелНет. Всички права запазени.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link 
                href={`${base}/privacy`} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Политика за поверителност
              </Link>
              <Link 
                href={`${base}/terms`} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Условия заползване
              </Link>
              <Link 
                href={`${base}/cookies`} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Бисквитки
              </Link>
              <Link 
                href={`${base}/accessibility`} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Достъпност
              </Link>
            </div>
          </div>

          {/* Credits */}
          <div className="text-center mt-6 text-xs text-gray-500">
            Платформа за гражданско участие | Изградена с ❤️ за общността
          </div>
        </div>
      </div>

      {/* Decorative gradient line */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
    </footer>
  );
}
