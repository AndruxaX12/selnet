import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "Файлът липсва" }, { status: 400 });
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Файлът е твърде голям (макс 5MB)" },
        { status: 400 }
      );
    }
    
    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Позволени са само изображения" },
        { status: 400 }
      );
    }
    
    // TODO: Upload to cloud storage (Firebase Storage, Cloudinary, AWS S3, etc.)
    // For now, return a mock URL
    const mockUrl = `https://images.unsplash.com/photo-${Date.now()}?w=800`;
    
    console.log(`[Upload] File: ${file.name}, Size: ${file.size}, Type: ${file.type}, User: ${user.email}`);
    
    return NextResponse.json({
      url: mockUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
