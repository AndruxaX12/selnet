"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "bg";
  const { signOut: ctxSignOut } = useAuth();

  async function doLogout() {
    setLoading(true);
    try {
      await ctxSignOut();
      router.push(`/${locale}/login?loggedout=1`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={doLogout} disabled={loading}>
      {loading ? "Излизане..." : "Изход"}
    </Button>

  );
  window.location.reload();
}
