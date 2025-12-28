import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

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
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const group = searchParams.get("group") || "day";

    // Mock report data (в production ще query-ваме Firestore)
    const reportData = {
      sla: {
        tta_within_48h: 84,
        tta_within_48h_pct: 93.3,
        tta_overdue: 6,
        process_within_5d: 72,
        process_within_5d_pct: 88.9,
        ttr_median_days: 11,
        ttr_over_14d: 15
      },
      volumes: {
        by_category: [
          { id: "roads", name: "Пътища", count: 145 },
          { id: "lighting", name: "Осветление", count: 98 },
          { id: "waste", name: "Отпадъци", count: 87 },
          { id: "parks", name: "Паркове", count: 64 },
          { id: "other", name: "Други", count: 42 }
        ],
        by_area: [
          { id: "center", name: "Център", count: 156 },
          { id: "north", name: "Север", count: 124 },
          { id: "south", name: "Юг", count: 98 },
          { id: "west", name: "Запад", count: 58 }
        ],
        by_status: [
          { status: "novo", count: 45 },
          { status: "potvurden", count: 32 },
          { status: "v_proces", count: 78 },
          { status: "popraven", count: 234 },
          { status: "arhiv", count: 47 }
        ]
      },
      trends: generateTrendData(from, to, group)
    };

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error("GET /api/operator/reports error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateTrendData(from: string | null, to: string | null, group: string) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = 30;

  const trends = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * dayMs);
    trends.push({
      date: date.toISOString().split("T")[0],
      new: Math.floor(Math.random() * 20) + 5,
      confirmed: Math.floor(Math.random() * 15) + 3,
      in_process: Math.floor(Math.random() * 10) + 2,
      resolved: Math.floor(Math.random() * 18) + 4
    });
  }

  return trends;
}
