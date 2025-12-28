import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getSessionUser } from "@/lib/auth/server-session";
import { FieldValue } from "firebase-admin/firestore";

interface RouteParams {
  params: {
    id: string;        // signalId
    commentId: string; // commentId
  };
}

// PUT - Редактирай коментар
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Не сте влезли в профила си" },
        { status: 401 }
      );
    }
    
    const { id: signalId, commentId } = params;
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
    
    // Вземи коментара
    const commentRef = adminDb
      .collection("signals")
      .doc(signalId)
      .collection("admin_comments")
      .doc(commentId);
    
    const commentDoc = await commentRef.get();
    
    if (!commentDoc.exists) {
      return NextResponse.json(
        { error: "Коментарът не е намерен" },
        { status: 404 }
      );
    }
    
    const commentData = commentDoc.data();
    const isAdmin = user.role === "admin";
    const isOwner = commentData?.authorId === user.uid;
    
    // Провери права: admin може всичко, coordinator/municipal само своите
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Нямате права да редактирате този коментар" },
        { status: 403 }
      );
    }
    
    // Обнови коментара
    await commentRef.update({
      text: text.trim(),
      editedAt: FieldValue.serverTimestamp(),
    });
    
    return NextResponse.json({
      success: true,
      message: "Коментарът е редактиран успешно",
    });
  } catch (error) {
    console.error("Error editing admin comment:", error);
    return NextResponse.json(
      { error: "Грешка при редактиране на коментар" },
      { status: 500 }
    );
  }
}

// DELETE - Изтрий коментар
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Не сте влезли в профила си" },
        { status: 401 }
      );
    }
    
    const { id: signalId, commentId } = params;
    
    // Вземи коментара
    const commentRef = adminDb
      .collection("signals")
      .doc(signalId)
      .collection("admin_comments")
      .doc(commentId);
    
    const commentDoc = await commentRef.get();
    
    if (!commentDoc.exists) {
      return NextResponse.json(
        { error: "Коментарът не е намерен" },
        { status: 404 }
      );
    }
    
    const commentData = commentDoc.data();
    const isAdmin = user.role === "admin";
    const isOwner = commentData?.authorId === user.uid;
    
    // Провери права: admin може всичко, coordinator/municipal само своите
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Нямате права да изтриете този коментар" },
        { status: 403 }
      );
    }
    
    // Изтрий коментара
    await commentRef.delete();
    
    return NextResponse.json({
      success: true,
      message: "Коментарът е изтрит успешно",
    });
  } catch (error) {
    console.error("Error deleting admin comment:", error);
    return NextResponse.json(
      { error: "Грешка при изтриване на коментар" },
      { status: 500 }
    );
  }
}
