import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { POLICIES, RoleKey } from "@/lib/auth/policies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json(
        { roles: ["guest"], abilities: {} },
        { status: 401 }
      );
    }
    
    const role = (user.role as RoleKey) ?? "guest";
    const roles = [role];
    
    // Build abilities map
    const abilities: Record<string, boolean> = {};
    
    for (const [action, allowedRoles] of Object.entries(POLICIES)) {
      abilities[action] = allowedRoles.includes(role);
    }
    
    return NextResponse.json(
      {
        userId: user.uid,
        email: user.email,
        roles,
        abilities,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300", // 5 min cache
        },
      }
    );
  } catch (error) {
    console.error("GET /api/me/abilities error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
