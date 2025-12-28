import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac/middleware";

/**
 * GET /api/auth/me
 * Get current user data from Firebase Auth
 */
export async function GET(req: NextRequest) {
  return requireAuth(req, async (req, user) => {
    try {
      return NextResponse.json({
        ok: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          photoURL: user.photoURL,
        },
      });
    } catch (error: any) {
      console.error('GET /api/auth/me error:', error);
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }
  });
}

export const dynamic = "force-dynamic";
