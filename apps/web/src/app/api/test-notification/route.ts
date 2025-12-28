import { NextRequest, NextResponse } from "next/server";
import { sendNotificationToUser } from "@/lib/admin/notify";
import { requireModerator } from "@/lib/admin-guard";

export async function POST(req: NextRequest) {
  // Ensure only admins can trigger this test
  const auth = await requireModerator(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { userId, type = "system" } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await sendNotificationToUser(userId, {
      title: "Test Notification",
      body: `This is a test notification of type ${type} sent at ${new Date().toLocaleTimeString()}`,
      type: type,
      link: "/admin",
      icon: "bell"
    });

    return NextResponse.json({ success: true, message: `Notification sent to ${userId}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
