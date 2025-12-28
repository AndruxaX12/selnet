// apps/web/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "selnet_session";

function getLocaleFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const maybeLocale = parts[0];
  if (maybeLocale === "bg" || maybeLocale === "en") return maybeLocale;
  return "bg";
}

function isPublicPath(pathname: string) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const locale = getLocaleFromPath(pathname);
  const isProtected = pathname.startsWith(`/${locale}/admin`) || pathname.startsWith(`/${locale}/operator`);
  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set("reason", "auth_required");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};