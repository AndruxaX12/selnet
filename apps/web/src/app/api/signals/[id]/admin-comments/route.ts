import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { adminAuth } from "@/lib/firebase/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { FieldValue } from "firebase-admin/firestore";

// Типове за admin коментари
interface AdminComment {
  id: string;
  signalId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorPhoto?: string;
  authorRole: "ADMIN" | "MODERATOR";
  text: string;
  createdAt: string;
  editedAt?: string;
}

// Helper function to get user from session or Authorization header
async function getAuthenticatedUser(request: NextRequest) {
  // First try session cookie
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    return sessionUser;
  }
  
  // Fallback to Authorization header (Bearer token)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const idToken = authHeader.substring(7);
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      
      // Get user role from Firestore
      const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
      const userData = userDoc.data();
      
      return {
        uid: decodedToken.uid,
        email: decodedToken.email || undefined,
        displayName: decodedToken.name || userData?.displayName || undefined,
        photoURL: decodedToken.picture || userData?.photoURL || undefined,
        role: (userData?.role || decodedToken.role || "resident")?.toLowerCase(),
        emailVerified: decodedToken.email_verified
      };
    } catch (error) {
      console.log("[admin-comments] Error verifying token:", error);
      return null;
    }
  }
  
  // Fallback to X-User-Data header (from localStorage)
  const userDataHeader = request.headers.get("X-User-Data");
  if (userDataHeader) {
    try {
      const decodedHeader = decodeURIComponent(userDataHeader);
      const userData = JSON.parse(decodedHeader);
      if (userData.uid) {
        return {
          uid: userData.uid,
          email: userData.email || undefined,
          displayName: userData.displayName || undefined,
          photoURL: userData.photoURL || undefined,
          role: userData.role?.toLowerCase() || "resident",
          emailVerified: true
        };
      }
    } catch (error) {
      console.log("[admin-comments] Error parsing X-User-Data:", error);
    }
  }
  
  return null;
}

// GET - Вземи всички admin коментари за сигнал
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const signalId = params.id;
    
    // Провери дали сигналът съществува
    const signalDoc = await adminDb.collection("signals").doc(signalId).get();
    if (!signalDoc.exists) {
      return NextResponse.json(
        { error: "Сигналът не е намерен" },
        { status: 404 }
      );
    }
    
    // Вземи коментарите от под-колекцията
    const commentsSnapshot = await adminDb
      .collection("signals")
      .doc(signalId)
      .collection("admin_comments")
      .orderBy("createdAt", "desc")
      .get();
    
    const comments: AdminComment[] = commentsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        signalId: data.signalId,
        authorId: data.authorId,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        authorRole: data.authorRole,
        text: data.text,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        editedAt: data.editedAt?.toDate?.()?.toISOString() || data.editedAt,
      };
    });
    
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching admin comments:", error);
    return NextResponse.json(
      { error: "Грешка при зареждане на коментарите" },
      { status: 500 }
    );
  }
}

// POST - Добави нов admin коментар
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Не сте влезли в профила си" },
        { status: 401 }
      );
    }
    
    // Провери дали потребителят е admin, administrator, coordinator или municipal
    // Роли от системата: resident, coordinator, municipal, admin, administrator
    const allowedRoles = ["admin", "administrator", "coordinator", "municipal"];
    console.log("[admin-comments] User role:", user.role, "Allowed:", allowedRoles.includes(user.role || ""));
    
    if (!user.role || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: `Само администрацията може да пише коментари. Вашата роля: ${user.role || "няма"}` },
        { status: 403 }
      );
    }
    
    const signalId = params.id;
    const body = await request.json();
    const { text } = body;
    
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Текстът на коментара е задължителен" },
        { status: 400 }
      );
    }
    
    if (text.length > 2000) {
      return NextResponse.json(
        { error: "Коментарът е твърде дълъг (макс. 2000 символа)" },
        { status: 400 }
      );
    }
    
    // Провери дали сигналът съществува
    const signalDoc = await adminDb.collection("signals").doc(signalId).get();
    if (!signalDoc.exists) {
      return NextResponse.json(
        { error: "Сигналът не е намерен" },
        { status: 404 }
      );
    }
    
    // Запази оригиналната роля на потребителя
    // Роли: admin, coordinator, municipal
    const authorRole = user.role || "admin";
    
    // Създай коментара
    const commentData = {
      signalId,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split("@")[0] || "Администратор",
      authorEmail: user.email || "",
      authorPhoto: (user as any).photoURL || null,
      authorRole: authorRole,
      text: text.trim(),
      createdAt: FieldValue.serverTimestamp(),
    };
    
    console.log("[admin-comments] Creating comment:", { authorRole, authorName: commentData.authorName });
    
    const docRef = await adminDb
      .collection("signals")
      .doc(signalId)
      .collection("admin_comments")
      .add(commentData);
    
    // Създай нотификация за автора на сигнала (ако е различен от коментиращия)
    const signalData = signalDoc.data();
    const signalAuthorId = signalData?.author_id || signalData?.authorId;
    
    if (signalAuthorId && signalAuthorId !== user.uid) {
      try {
        await adminDb.collection("notifications").add({
          userId: signalAuthorId,
          signalId,
          type: "ADMIN_COMMENT",
          message: `Администрацията коментира вашия сигнал "${signalData?.title?.substring(0, 50) || "Сигнал"}"`,
          createdAt: FieldValue.serverTimestamp(),
          read: false,
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Не спираме заради грешка в нотификацията
      }
    }
    
    return NextResponse.json({
      success: true,
      comment: {
        id: docRef.id,
        ...commentData,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error adding admin comment:", error);
    return NextResponse.json(
      { error: "Грешка при добавяне на коментар" },
      { status: 500 }
    );
  }
}
