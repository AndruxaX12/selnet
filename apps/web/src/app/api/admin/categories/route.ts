import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/rbac/middleware";
import { ROLES } from "@/lib/rbac/roles";
import { logAction } from "@/lib/admin/audit";

export async function GET(req: NextRequest) {
  try {
    const snapshot = await adminDb.collection("categories").orderBy("label").get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req, user) => {
    if (user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    try {
      const body = await req.json();
      const { label, color, icon } = body;
      
      if (!label) {
        return NextResponse.json({ error: "Label is required" }, { status: 400 });
      }

      const docRef = adminDb.collection("categories").doc();
      await docRef.set({
        label,
        color: color || "#3B82F6",
        icon: icon || "alert-circle",
        createdAt: new Date().toISOString()
      });

      await logAction(
        user.uid,
        user.email || "unknown",
        `Created category: ${label}`,
        "system",
        `Color: ${color}, Icon: ${icon}`
      );

      return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("POST /api/admin/categories error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}

export async function DELETE(req: NextRequest) {
    return requireAuth(req, async (req, user) => {
      if (user.role !== ROLES.ADMIN) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
  
      try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }
  
        await adminDb.collection("categories").doc(id).delete();
  
        await logAction(
          user.uid,
          user.email || "unknown",
          `Deleted category: ${id}`,
          "system",
          `Category deleted`
        );
  
        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.error("DELETE /api/admin/categories error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    });
  }
