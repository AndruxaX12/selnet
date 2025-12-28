// apps/web/src/components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ROLES } from "@/lib/rbac/roles";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = (params?.locale as string) || "bg";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.message || "Грешка при вход");
      }

      const authInstance = auth();
      if (!authInstance) {
        throw new Error("Firebase auth is not available");
      }

      if (payload?.customToken) {
        await signInWithCustomToken(authInstance, payload.customToken);
      }

      if (payload?.idToken) {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: payload.idToken }),
          credentials: "include",
        }).catch(() => {});
      }

      if (typeof window !== "undefined") {
        if (payload?.user) {
          localStorage.setItem("user", JSON.stringify(payload.user));
        }
        if (payload?.idToken) {
          localStorage.setItem("idToken", payload.idToken);
          localStorage.setItem("firebaseToken", payload.idToken);
        }
      }

      const role = String(payload?.user?.role || ROLES.USER).toUpperCase();
      if (role === ROLES.ADMIN) {
        router.push(`/${locale}/admin`);
      } else if (role === ROLES.OPERATOR) {
        router.push(`/${locale}/operator`);
      } else {
        router.push(`/${locale}/me/signals`);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError("Грешен имейл или парола. Моля, опитайте отново.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Имейл адрес
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          placeholder="вашият@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Парола
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          placeholder="••••••••"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "Влизане..." : "Влез в акаунта си"}
        </button>
      </div>
    </form>
  );
}