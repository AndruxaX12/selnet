import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { calculateTTADeadline, calculateProcessDeadline } from "@/lib/operator/sla-utils";

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
    const tab = searchParams.get("tab") || "novo";
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") || "sla_urgent";
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");

    // Mock данни за сега (в production ще query-ваме Firestore)
    const mockSignals = generateMockSignals(tab, q, sort, limit, decoded.uid);

    return NextResponse.json({
      items: mockSignals,
      next_cursor: mockSignals.length >= limit ? "next_page_token" : undefined,
      total: 150
    });
  } catch (error: any) {
    console.error("GET /api/operator/signals error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Mock function за генериране на тестови данни
function generateMockSignals(tab: string, q: string | null, sort: string, limit: number, userId: string) {
  const now = Date.now();
  const signals: any[] = [];

  for (let i = 0; i < limit; i++) {
    const createdAt = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const status = tab === "novo" ? "novo" : tab === "in_process" ? "v_proces" : "potvurden";
    const confirmedAt = status !== "novo" ? new Date(createdAt.getTime() + 3600000).toISOString() : undefined;
    
    const signal: any = {
      id: `sig_${Date.now()}_${i}`,
      title: `${q || "Сигнал"} #${i + 1} - Проблем в района`,
      description: "Описание на проблема. Нужна е спешна намеса от компетентните органи.",
      status,
      category_id: "roads",
      category_name: ["Пътища", "Осветление", "Отпадъци", "Паркове"][Math.floor(Math.random() * 4)],
      priority: ["normal", "high", "urgent"][Math.floor(Math.random() * 3)] as any,
      address: `ул. ${["Раковска", "Цар Борис", "Марица", "Пловдивска"][Math.floor(Math.random() * 4)]} ${i + 1}`,
      coordinates: { lat: 42.1354, lng: 24.7453 },
      reporter: {
        name: "Иван Петров",
        contact_masked: "08*****234"
      },
      owner_user_id: Math.random() > 0.5 ? userId : undefined,
      owner_name: Math.random() > 0.5 ? "Стоян Георгиев" : undefined,
      department_name: Math.random() > 0.7 ? "Благоустрояване" : undefined,
      has_complaint: Math.random() > 0.9,
      has_duplicates: Math.random() > 0.8,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
      confirmed_at: confirmedAt,
      media_count: Math.floor(Math.random() * 5),
      comments_count: Math.floor(Math.random() * 10),
      views_count: Math.floor(Math.random() * 50) + 10,
      sla: {
        tta_deadline: status === "novo" ? calculateTTADeadline(createdAt.toISOString()) : undefined,
        process_deadline: status === "potvurden" && confirmedAt 
          ? calculateProcessDeadline(confirmedAt) 
          : undefined,
        tta_status: "ok" as any,
        process_status: status === "potvurden" ? "ok" as any : undefined
      }
    };

    signals.push(signal);
  }

  return signals;
}
