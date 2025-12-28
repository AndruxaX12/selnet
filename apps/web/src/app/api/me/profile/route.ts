import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = userDoc.data();
    
    return NextResponse.json({
      id: userDoc.id,
      email: data?.email || decoded.email,
      name: data?.name || data?.displayName,
      avatar_url: data?.avatar_url || data?.photoURL,
      bio: data?.bio,
      area_id: data?.area_id,
      locale: data?.locale || "bg",
      timezone: data?.timezone || "Europe/Sofia",
      date_format: data?.date_format || "DD.MM.YYYY",
      map_default: data?.map_default || "list",
      theme: data?.theme || "system",
      roles: data?.roles || [],
      a11y: {
        fontScale: data?.a11y?.fontScale || 100,
        reduceMotion: data?.a11y?.reduceMotion || false
      },
      privacy: {
        public_profile: data?.privacy?.public_profile ?? true,
        show_role: data?.privacy?.show_role ?? true,
        show_activity: data?.privacy?.show_activity ?? true,
        searchable: data?.privacy?.searchable ?? true,
        show_verified_email: data?.privacy?.show_verified_email ?? true
      },
      createdAt: data?.createdAt,
      lastLogin: data?.lastLogin
    });
  } catch (error: any) {
    console.error("GET /api/me/profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;
    const body = await req.json();

    // Validation
    if (body.name && (body.name.length < 2 || body.name.length > 100)) {
      return NextResponse.json(
        { error: "Името трябва да е между 2 и 100 символа" },
        { status: 400 }
      );
    }

    if (body.bio && body.bio.length > 200) {
      return NextResponse.json(
        { error: "Биографията трябва да е максимум 200 символа" },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: Date.now()
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.area_id !== undefined) updateData.area_id = body.area_id;
    if (body.locale !== undefined) updateData.locale = body.locale;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.date_format !== undefined) updateData.date_format = body.date_format;
    if (body.map_default !== undefined) updateData.map_default = body.map_default;
    if (body.theme !== undefined) updateData.theme = body.theme;
    if (body.a11y !== undefined) updateData.a11y = body.a11y;
    if (body.privacy !== undefined) updateData.privacy = body.privacy;

    await adminDb.collection("users").doc(userId).update(updateData);

    // Get updated profile
    const updatedDoc = await adminDb.collection("users").doc(userId).get();
    const updatedData = updatedDoc.data();

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedDoc.id,
        ...updatedData
      }
    });
  } catch (error: any) {
    console.error("PUT /api/me/profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("selnet_session")?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });

  const decoded = await adminAuth.verifyIdToken(token).catch(() => null);
  if (!decoded) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { displayName, photoURL } = (await req.json().catch(() => ({}))) as {
    displayName?: string; photoURL?: string | null;
  };

  const uid = decoded.uid;
  const update: any = { updatedAt: Date.now() };
  if (typeof displayName === "string") update.displayName = displayName.trim().slice(0, 80);
  if (typeof photoURL !== "undefined") update.photoURL = photoURL || null;

  await adminDb.collection("users").doc(uid).set(update, { merge: true });

  // (по избор) синхронизация към Firebase Auth профила
  const authUpdate: any = {};
  if (typeof displayName === "string") authUpdate.displayName = update.displayName;
  if (typeof photoURL !== "undefined") authUpdate.photoURL = update.photoURL || undefined;
  if (Object.keys(authUpdate).length) {
    await adminAuth.updateUser(uid, authUpdate).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
