"use client";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import AppFooter from "@/components/layout/AppFooter";
import ScrollToTop from "@/components/layout/ScrollToTop";

const OfflineBanner = lazy(() => import("@/components/layout/OfflineBanner"));
const TabBar = lazy(() => import("@/components/layout/TabBar"));
const PWAInitializer = lazy(() => import("@/components/pwa/PWAInitializer"));
const PWADebugger = lazy(() => import("@/components/pwa/PWADebugger"));
const InstallBanner = lazy(() => import("@/components/pwa/InstallBanner"));
const NotifyToaster = lazy(() => import("@/components/notify/NotifyToaster"));
const ForegroundPushListener = lazy(() => import("@/components/notify/ForegroundPushListener"));
const PerformanceMonitor = lazy(() => import("@/components/PerformanceMonitor"));

interface ClientLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
}

export default function ClientLayout({ children, header }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <PWAInitializer />
      </Suspense>
      <Suspense fallback={null}>
        <OfflineBanner />
      </Suspense>
      <Suspense fallback={null}>
        <NotifyToaster />
      </Suspense>
      <Suspense fallback={null}>
        <ForegroundPushListener />
      </Suspense>
      <Suspense fallback={null}>
        <InstallBanner />
      </Suspense>
      {header}
      <main id="main" className="pb-20 min-h-screen">
        {children}
      </main>
      <AppFooter />
      <ScrollToTop />
      <Suspense fallback={
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40">
          <div className="flex justify-around py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center p-2">
                <div className="h-6 w-6 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-8 bg-gray-200 animate-pulse rounded mt-1" />
              </div>
            ))}
          </div>
        </div>
      }>
        <TabBar />
      </Suspense>
      {process.env.NODE_ENV === "development" && (
        <>
          <Suspense fallback={null}>
            <PWADebugger />
          </Suspense>
          <Suspense fallback={null}>
            <PerformanceMonitor />
          </Suspense>
        </>
      )}
    </AuthProvider>
  );
}
