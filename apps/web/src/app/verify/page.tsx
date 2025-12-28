"use client";
import { auth } from "@/lib/firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function VerifyPage() {
  const [msg, setMsg] = useState("Проверка на връзката за вход...");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const next = params.get("next") || "/me";

  useEffect(() => {
    const run = async () => {
      try {
        if (isSignInWithEmailLink(auth, window.location.href)) {
          let email = window.localStorage.getItem("emailForSignIn") || params.get("email") || "";
          if (!email) email = window.prompt("Въведи имейл за потвърждение:") || "";
          await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem("emailForSignIn");
          setMsg("Успешен вход. Пренасочване…");
          router.replace(next);
        } else {
          setMsg("Линкът е невалиден или вече е използван.");
        }
      } catch (e: any) {
        setMsg(e?.message ?? "Грешка при потвърждението.");
      }
    };
    run();
  }, [router, next, params]);

  return <div className="max-w-md mx-auto">{msg}</div>;
}

