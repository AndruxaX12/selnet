import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { calculateTTADeadline, calculateProcessDeadline } from "@/lib/operator/sla-utils";

export async function GET(
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
    
    const hasAccess = roles.includes("operator") || roles.includes("admin") || roles.includes("ombudsman");
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const signalId = params.id;

    // Mock detailed signal data
    const now = Date.now();
    const createdAt = new Date(now - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const confirmedAt = new Date(createdAt.getTime() + 12 * 60 * 60 * 1000);

    const signalDetail = {
      id: signalId,
      title: "Счупен тротоар на ул. Раковска",
      description: "Тротоарът пред No 15 е в много лошо състояние с дупки и неравности. Представлява опасност за пешеходците, особено за възрастни хора и деца.",
      status: "potvurden",
      category_id: "roads",
      category_name: "Пътища",
      priority: "high",
      address: "ул. Раковска 15",
      coordinates: { lat: 42.1354, lng: 24.7453 },
      reporter: {
        name: "Иван Петров",
        contact_masked: "08*****234"
      },
      owner_user_id: decoded.uid,
      owner_name: "Стоян Георгиев",
      department_id: "dept_1",
      department_name: "Благоустрояване",
      has_complaint: false,
      has_duplicates: true,
      created_at: createdAt.toISOString(),
      updated_at: new Date().toISOString(),
      confirmed_at: confirmedAt.toISOString(),
      media_count: 3,
      comments_count: 5,
      views_count: 42,
      sla: {
        tta_deadline: calculateTTADeadline(createdAt.toISOString()),
        process_deadline: calculateProcessDeadline(confirmedAt.toISOString()),
        tta_status: "ok" as any,
        process_status: "warning" as any
      },
      // Timeline events
      timeline: [
        {
          id: "evt_1",
          type: "status_change",
          actor: "Стоян Георгиев (оператор)",
          created_at: confirmedAt.toISOString(),
          data: {
            from: "novo",
            to: "potvurden"
          }
        },
        {
          id: "evt_2",
          type: "assigned",
          actor: "Система",
          created_at: confirmedAt.toISOString(),
          data: {
            owner_name: "Стоян Георгиев"
          }
        },
        {
          id: "evt_3",
          type: "note_added",
          actor: "Иван Петров (гражданин)",
          created_at: createdAt.toISOString(),
          data: {
            type: "public",
            description: "Ситуацията се влошава с всеки ден"
          }
        }
      ],
      // Notes
      notes: [
        {
          id: "note_1",
          signal_id: signalId,
          type: "public" as any,
          author_id: "user_1",
          author_name: "Стоян Георгиев",
          body: "Благодарим за сигнала. Екип е изпратен за оглед на място.",
          files: [],
          created_at: confirmedAt.toISOString()
        },
        {
          id: "note_2",
          signal_id: signalId,
          type: "internal" as any,
          author_id: decoded.uid,
          author_name: "Стоян Георгиев",
          body: "Проверил на място. Нужна е спешна намеса - дупка е дълбока ~30см.",
          files: [],
          created_at: new Date(confirmedAt.getTime() + 2 * 60 * 60 * 1000).toISOString()
        }
      ],
      // Work orders
      workOrders: [
        {
          id: "wo_1",
          signal_id: signalId,
          department_id: "dept_1",
          priority: "high" as any,
          due_at: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "in_progress" as any,
          created_at: confirmedAt.toISOString(),
          updated_at: new Date().toISOString(),
          notes: "Ремонт на тротоар - приоритетна задача",
          assigned_to: "Петър Иванов"
        }
      ],
      // Media
      media: [
        {
          id: "media_1",
          url: "https://via.placeholder.com/400x300?text=Signal+Photo+1",
          type: "image" as any,
          created_at: createdAt.toISOString()
        },
        {
          id: "media_2",
          url: "https://via.placeholder.com/400x300?text=Signal+Photo+2",
          type: "image" as any,
          created_at: createdAt.toISOString()
        },
        {
          id: "media_3",
          url: "https://via.placeholder.com/400x300?text=Signal+Photo+3",
          type: "image" as any,
          created_at: createdAt.toISOString()
        }
      ]
    };

    // Generate ETag
    const etag = `"${Date.now()}"`;

    return NextResponse.json(signalDetail, {
      headers: {
        "ETag": etag
      }
    });
  } catch (error: any) {
    console.error("GET /api/operator/signals/:id error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
