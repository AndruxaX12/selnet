import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/system/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import MainLayout from "@/components/layout/MainLayout";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

const VitalsBoot = dynamic(() => import("@/components/telemetry/VitalsBoot"), { ssr: false });
const ErrorsBoot = dynamic(() => import("@/components/telemetry/ErrorsBoot"), { ssr: false });

export const metadata: Metadata = {
  title: "Моят Ботевград | СелНет",
  description: "Гражданска платформа за сигнали в община Ботевград",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
    shortcut: "/icons/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg">
      <body className={inter.className}>
        <ErrorBoundary>
          <VitalsBoot />
          <ErrorsBoot />
          <AuthProvider>
            <ToastProvider>
              <MainLayout>
                {children}
              </MainLayout>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
