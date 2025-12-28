import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const roles = (decoded.roles as string[]) || [];
    
    const hasAccess = roles.includes("operator") || roles.includes("admin") || roles.includes("ombudsman");
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "today";

    // Изчисляваме времеви рамки
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    let fromTime: number;
    if (period === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      fromTime = today.getTime();
    } else if (period === "7days") {
      fromTime = now - 7 * dayMs;
    } else {
      fromTime = now - 30 * dayMs;
    }

    // Mock данни за сега (в production ще query-ваме Firestore)
    const kpi = {
      new_today: 12,
      new_7days: 84,
      new_30days: 342,
      confirmed_within_48h: 76,
      confirmed_within_48h_pct: 90.5,
      tta_overdue: 3,
      tta_overdue_trend: -2,
      in_process: 28,
      resolved_period: period === "today" ? 8 : period === "7days" ? 62 : 289,
      ttr_median_days: 11
    };

    const inflow_vs_processed = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now - (6 - i) * dayMs);
      return {
        date: date.toISOString(),
        new: Math.floor(Math.random() * 20) + 5,
        processed: Math.floor(Math.random() * 18) + 3
      };
    });

    const top_categories = [
      { id: "roads", name: "Пътища", count: 45, pct: 35, change: 5 },
      { id: "lighting", name: "Осветление", count: 32, pct: 25, change: -2 },
      { id: "waste", name: "Отпадъци", count: 28, pct: 22, change: 3 },
      { id: "parks", name: "Паркове", count: 23, pct: 18, change: 0 }
    ];

    const top_areas = [
      { id: "center", name: "Център", count: 56 },
      { id: "north", name: "Север", count: 42 },
      { id: "south", name: "Юг", count: 30 }
    ];

    const recent_escalations = [
      {
        id: "esc1",
        signal_id: "sig123",
        signal_title: "Счупен тротоар на ул. Раковска",
        created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "esc2",
        signal_id: "sig456",
        signal_title: "Липса на осветление в парк Лаута",
        created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString()
      }
    ];

    return NextResponse.json({
      kpi,
      inflow_vs_processed,
      top_categories,
      top_areas,
      recent_escalations
    });
  } catch (error: any) {
    console.error("GET /api/operator/dashboard error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
