import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

export async function guard(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") || "";
  try {
    const decoded = await getAuth().verifyIdToken(token);
    // Check if user has admin or moderator roles
    const roles = decoded.roles || [];
    const hasAccess = roles.includes("admin") || roles.includes("moderator") || roles.includes("coordinator") || roles.includes("municipal");
    if (!hasAccess) throw new Error("forbidden");
    return decoded;
  } catch (err) {
    console.error("Auth guard error:", err);
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
}
