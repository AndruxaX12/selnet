import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const roles = (decoded.roles as string[]) || [];
    
    const hasAccess = roles.includes("operator") || roles.includes("admin");
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const signalId = params.id;
    const body = await req.json();
    const { type, body: noteBody, files } = body;

    // Validate
    if (!type || !noteBody) {
      return NextResponse.json(
        { error: "Missing type or body" },
        { status: 400 }
      );
    }

    if (type !== "public" && type !== "internal") {
      return NextResponse.json(
        { error: "Invalid note type" },
        { status: 400 }
      );
    }

    // Mock note creation
    const newNote = {
      id: `note_${Date.now()}`,
      signal_id: signalId,
      type,
      author_id: decoded.uid,
      author_name: decoded.name || decoded.email || "Неизвестен",
      body: noteBody,
      files: files || [],
      created_at: new Date().toISOString()
    };

    console.log("Created note:", newNote);

    return NextResponse.json(newNote, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/operator/signals/:id/notes error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
