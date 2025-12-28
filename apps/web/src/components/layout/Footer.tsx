"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Footer() {

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
        <div className="mb-4 md:mb-0 flex items-center gap-3">
          <Image 
            src="/logo-selnet-full.png" 
            alt="СелНет" 
            width={100} 
            height={24} 
            className="object-contain h-6 w-auto" 
          />
          <span className="text-gray-400">|</span>
          <span>© 2025 ДАНТРИ Тех ООД</span>
        </div>
        <nav className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6">
          <Link href="/signals" className="hover:text-green-600 transition-colors">Архив сигнали</Link>
          <Link href="/about" className="hover:text-green-600 transition-colors">За платформата</Link>
          <Link href="/terms" className="hover:text-green-600 transition-colors">Условия за ползване</Link>
          <Link href="/privacy" className="hover:text-green-600 transition-colors">Защита на данни</Link>
          <Link href="/contact" className="hover:text-green-600 transition-colors">Контакти</Link>
        </nav>
      </div>
    </footer>
  );
}
