import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE = /\.[^/]+$/;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip system and public assets immediately
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/manifest.webmanifest") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/images/") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  // Back-compat: redirect locale prefixes to canonical paths without prefix
  if (firstSegment === "bg" || firstSegment === "en") {
    const url = req.nextUrl.clone();
    const pathWithoutLocale = "/" + segments.slice(1).join("/");
    url.pathname = pathWithoutLocale || "/";
    return NextResponse.redirect(url, 308);
  }

  // All other requests proceed normally
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
