import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = userDoc.data();
    
    // Check privacy settings
    if (!data?.privacy?.public_profile) {
      return NextResponse.json(
        { error: "Профилът е private" },
        { status: 403 }
      );
    }

    // Build public profile
    const publicProfile: any = {
      id: userDoc.id,
      name: data.name || "Потребител",
      avatar_url: data.avatar_url,
      bio: data.bio
    };

    // Add optional fields based on privacy
    if (data.privacy?.show_role && data.roles?.length > 0) {
      publicProfile.role = data.roles[0]; // Show primary role
    }

    if (data.privacy?.show_verified_email && data.emailVerified) {
      publicProfile.verified_email = true;
    }

    if (data.area_id) {
      // In real app, fetch from areas collection
      publicProfile.area = {
        id: data.area_id,
        name: data.area_id === "plovdiv_center" ? "Пловдив Център" : "Район"
      };
    }

    // Get activity if allowed
    if (data.privacy?.show_activity) {
      publicProfile.activity = await getUserActivity(userId);
    }

    return NextResponse.json(publicProfile);
  } catch (error: any) {
    console.error("GET /api/users/:id error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getUserActivity(userId: string) {
  const [signals, ideas, events] = await Promise.all([
    adminDb
      .collection("signals")
      .where("userId", "==", userId)
      .limit(5)
      .get()
      .catch(() => ({ docs: [] })),
    adminDb
      .collection("ideas")
      .where("userId", "==", userId)
      .limit(5)
      .get()
      .catch(() => ({ docs: [] })),
    adminDb
      .collection("events")
      .where("attendees", "array-contains", userId)
      .limit(3)
      .get()
      .catch(() => ({ docs: [] }))
  ]);

  return {
    signals: signals.docs.map(d => ({
      id: d.id,
      title: d.data().title || "Без заглавие",
      status: d.data().status || "new",
      createdAt: d.data().createdAt || Date.now()
    })),
    ideas: ideas.docs.map(d => ({
      id: d.id,
      title: d.data().title || "Без заглавие",
      votes: d.data().votes || 0,
      createdAt: d.data().createdAt || Date.now()
    })),
    events: events.docs.map(d => ({
      id: d.id,
      title: d.data().title || "Без заглавие",
      date: d.data().date || Date.now(),
      rsvp: "going"
    }))
  };
}
