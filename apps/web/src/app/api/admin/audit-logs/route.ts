import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Support basic filtering
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const type = url.searchParams.get("type");

    let query: FirebaseFirestore.Query = adminDb.collection("audit_logs").orderBy("createdAt", "desc");

    if (type && type !== "all") {
        query = query.where("actionType", "==", type);
    }

    const snapshot = await query.limit(limit).get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
