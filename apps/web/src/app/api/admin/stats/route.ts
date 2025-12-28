import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebase-admin";

initAdmin();

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = getFirestore();

    // 1. Status Counts
    const signalsSnap = await db.collection("signals").get();
    const signals = signalsSnap.docs.map(d => d.data());

    const statusCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const timelineData: Record<string, number> = {};

    // Initialize timeline for last 30 days
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        timelineData[key] = 0;
    }

    signals.forEach(s => {
        // Status
        const status = s.status || "submitted";
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        // Category
        const category = s.category || "other";
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        // Timeline
        if (s.createdAt) {
            const date = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
            const key = date.toISOString().split('T')[0];
            if (timelineData[key] !== undefined) {
                timelineData[key]++;
            }
        }
    });

    const usersSnap = await db.collection("users").count().get();
    const totalUsers = usersSnap.data().count;

    return NextResponse.json({
        totalSignals: signals.length,
        totalUsers,
        statusCounts,
        categoryCounts,
        timeline: Object.entries(timelineData).map(([date, count]) => ({ date, count }))
    });

  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
