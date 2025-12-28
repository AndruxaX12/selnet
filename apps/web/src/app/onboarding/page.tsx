import { Metadata } from "next";
import { OnboardingFlow } from "./onboarding-flow";
import { requireAuth } from "@/lib/auth/rbac";

export const metadata: Metadata = {
  title: "Добре дошъл | SelNet",
  description: "Персонализирай своя профил",
};

export default async function OnboardingPage() {
  const user = await requireAuth();
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Добре дошъл, {user.displayName || user.email}!</h1>
          <p className="mt-2 text-muted-foreground">
            Персонализирай своя профил за по-добро изживяване
          </p>
        </div>
        
        <OnboardingFlow userId={user.uid} />
      </div>
    </div>
  );
}

