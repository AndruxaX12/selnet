import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/rbac/middleware";
import { ROLES } from "@/lib/rbac/roles";

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req, user) => {
    // Both Admin and Operator can view pages, but only Admin usually manages them.
    // Let's allow both to view list.
    try {
      const snapshot = await adminDb.collection("pages").orderBy("updatedAt", "desc").get();
      const pages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ pages });
    } catch (error: any) {
      console.error("GET /api/admin/pages error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req, user) => {
    // Only ADMIN should create pages? Or Operator too? User said "Admin/Operator".
    // Let's assume ADMIN for now as it's "Content Management".
    if (user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    try {
      const body = await req.json();
      const { slug, title, content } = body;
      
      if (!slug || !title) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const docRef = adminDb.collection("pages").doc(slug);
      const doc = await docRef.get();
      if (doc.exists) {
        return NextResponse.json({ error: "Page with this slug already exists" }, { status: 409 });
      }

      await docRef.set({
        slug,
        title,
        content: content || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      });

      return NextResponse.json({ success: true, slug });
    } catch (error: any) {
      console.error("POST /api/admin/pages error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}
