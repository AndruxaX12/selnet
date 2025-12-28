"use client";

import AppHeader from "./AppHeader";
import Footer from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
