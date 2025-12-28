import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Няма качени файлове" }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: "Максимум 5 файла" }, { status: 400 });
    }

    const uploadPromises = files.map(async (file) => {
      // Валидация на файла
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        throw new Error(`Неподдържан формат: ${file.type}`);
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error(`Файлът ${file.name} е твърде голям (макс. 10MB)`);
      }

      // Генериране на уникално име
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const extension = file.name.split('.').pop();
      const fileName = `signals/${timestamp}_${randomString}.${extension}`;

      // Качване в Firebase Storage
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        name: file.name,
        url: downloadURL,
        size: file.size
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Грешка при качване" },
      { status: 500 }
    );
  }
}
