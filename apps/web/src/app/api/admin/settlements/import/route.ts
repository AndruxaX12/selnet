import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireModerator } from "@/lib/admin-guard";
import { parse } from "csv-parse/sync";

export async function POST(req: NextRequest) {
  const guard = await requireModerator(req);
  if (!guard.ok) return NextResponse.json(
    { error: guard.error }, 
    { status: guard.status }
  );

  const { csv } = await req.json().catch(() => ({}));
  if (!csv) return NextResponse.json(
    { error: "Липсва CSV съдържание" }, 
    { status: 400 }
  );

  let rows;
  try {
    rows = parse(csv, { 
      columns: true, 
      bom: true, 
      skip_empty_lines: true,
      trim: true
    }) as any[];
  } catch (e) {
    return NextResponse.json(
      { error: "Невалиден CSV формат: " + (e as Error).message },
      { status: 400 }
    );
  }

  if (!rows.length) {
    return NextResponse.json(
      { error: "CSV файлът е празен" },
      { status: 400 }
    );
  }

  let inserted = 0;
  const batch = adminDb.batch();
  const errors: string[] = [];

  for (const [index, r] of rows.entries()) {
    try {
      const name = (r.name || "").toString().trim();
      if (!name) {
        errors.push(`Ред ${index + 2}: Липсва име на селище`);
        continue;
      }

      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        errors.push(`Ред ${index + 2}: Невалидни координати (lat, lng)`);
        continue;
      }

      const center = { lat, lng };
      
      const data = {
        name,
        kind: (r.kind || "other").toString(),
        municipality: (r.municipality || "").toString(),
        province: (r.province || "").toString(),
        country: "BG" as const,
        center,
        bounds: (r.neLat && r.neLng && r.swLat && r.swLng) ? { 
          ne: { 
            lat: parseFloat(r.neLat), 
            lng: parseFloat(r.neLng) 
          }, 
          sw: { 
            lat: parseFloat(r.swLat), 
            lng: parseFloat(r.swLng) 
          } 
        } : undefined,
        search: [name, r.municipality, r.province].filter(Boolean).join(" ").toLowerCase(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const ref = adminDb.collection("settlements").doc();
      batch.set(ref, data);
      inserted++;
      
      if (inserted % 400 === 0) { 
        await batch.commit(); 
      }
    } catch (error) {
      errors.push(`Грешка при обработка на ред ${index + 2}: ${(error as Error).message}`);
    }
  }

  try {
    if (inserted % 400 !== 0) await batch.commit();
  } catch (error) {
    errors.push(`Грешка при запис в базата: ${(error as Error).message}`);
  }

  return NextResponse.json({ 
    ok: true, 
    inserted,
    errors: errors.length > 0 ? errors : undefined
  });
}
