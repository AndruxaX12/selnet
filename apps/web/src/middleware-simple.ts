import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Basic security headers - simplified version
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  res.headers.set("Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.googleapis.com; frame-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'`
  );
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|icons|manifest.webmanifest|sw.js|robots.txt).*)"]
};
