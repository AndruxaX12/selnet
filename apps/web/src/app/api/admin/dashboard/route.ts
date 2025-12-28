import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { guard } from "../_guard";

export async function GET(req: NextRequest) {
  const auth = await guard(req);
  if (auth instanceof NextResponse) return auth;

  try {
    // Count total items (simple queries without composite indexes)
    const usersSnapshot = await adminDb.collection("users").limit(1000).get();
    const totalUsers = usersSnapshot.size;
    
    const signalsSnapshot = await adminDb.collection("signals").limit(1000).get();
    const totalSignals = signalsSnapshot.size;
    
    const ideasSnapshot = await adminDb.collection("ideas").limit(1000).get();
    const totalIdeas = ideasSnapshot.size;
    
    const eventsSnapshot = await adminDb.collection("events").limit(1000).get();
    const totalEvents = eventsSnapshot.size;
    
    // Calculate changes from actual data (client-side filtering)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentUsers = usersSnapshot.docs.filter(d => (d.data().createdAt || 0) >= sevenDaysAgo).length;
    const recentSignals = signalsSnapshot.docs.filter(d => (d.data().createdAt || 0) >= sevenDaysAgo).length;
    const recentIdeas = ideasSnapshot.docs.filter(d => (d.data().createdAt || 0) >= sevenDaysAgo).length;
    const recentEvents = eventsSnapshot.docs.filter(d => (d.data().createdAt || 0) >= sevenDaysAgo).length;
    
    // Get pending items with simple queries (no composite index needed)
    const pendingSignals = await adminDb
      .collection("signals")
      .where("status", "==", "new")
      .limit(10)
      .get();
    
    const pendingIdeas = await adminDb
      .collection("ideas")
      .where("status", "==", "new")
      .limit(10)
      .get();
    
    const pendingEvents = await adminDb
      .collection("events")
      .where("status", "==", "new")
      .limit(10)
      .get();
    
    // Combine and sort client-side
    const pendingItems = [
      ...pendingSignals.docs.map(d => ({ id: d.id, type: "signal", ...d.data() })),
      ...pendingIdeas.docs.map(d => ({ id: d.id, type: "idea", ...d.data() })),
      ...pendingEvents.docs.map(d => ({ id: d.id, type: "event", ...d.data() }))
    ]
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 5);
    
    return NextResponse.json({
      users: {
        total: totalUsers,
        change: recentUsers
      },
      signals: {
        total: totalSignals,
        change: recentSignals
      },
      ideas: {
        total: totalIdeas,
        change: recentIdeas
      },
      events: {
        total: totalEvents,
        change: recentEvents
      },
      pendingApprovals: {
        count: pendingItems.length,
        items: pendingItems
      }
    });
  } catch (error: any) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
