"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import MainLayout from "./MainLayout";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <MainLayout>
        {children}
      </MainLayout>
    </AuthProvider>
  );
}
