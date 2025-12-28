import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/rbac/middleware";
import { ROLES } from "@/lib/rbac/roles";
import { logAction } from "@/lib/admin/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return requireAuth(req, async (req, user) => {
    const { slug } = params;
    try {
      const doc = await adminDb.collection("pages").doc(slug).get();
      if (!doc.exists) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }
      return NextResponse.json(doc.data());
    } catch (error: any) {
      console.error("GET /api/admin/pages/[slug] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return requireAuth(req, async (req, user) => {
    if (user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { slug } = params;
    try {
      const body = await req.json();
      const { title, content } = body;

      if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }

      await adminDb.collection("pages").doc(slug).update({
        title,
        content,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      });

      // Audit Log
      await logAction(
        user.uid,
        user.email || "unknown",
        `Updated static page: ${slug}`,
        "page_update",
        `Title: ${title}`
      );

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("PUT /api/admin/pages/[slug] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return requireAuth(req, async (req, user) => {
    if (user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { slug } = params;
    try {
      await adminDb.collection("pages").doc(slug).delete();

      // Audit Log
      await logAction(
        user.uid,
        user.email || "unknown",
        `Deleted static page: ${slug}`,
        "page_update",
        `Page deleted`
      );

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("DELETE /api/admin/pages/[slug] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}
