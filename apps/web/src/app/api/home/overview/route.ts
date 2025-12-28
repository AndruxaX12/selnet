import { NextRequest, NextResponse } from "next/server";

async function fetchRows(coll: "signals" | "ideas" | "events", limit = 8) {
  try {
    const url = `http://localhost:3030/api/public/list?coll=${coll}&limit=${limit}`;
    console.log(`[Overview] Fetching ${coll} from: ${url}`);
    
    const res = await fetch(url, { cache: "no-store" });
    console.log(`[Overview] ${coll} response status: ${res.status}`);
    
    if (!res.ok) {
      console.error(`[Overview] ${coll} fetch failed: ${res.status} ${res.statusText}`);
      return [];
    }
    
    const json = await res.json().catch((e) => {
      console.error(`[Overview] ${coll} JSON parse error:`, e);
      return { rows: [] };
    });
    
    const rows = Array.isArray(json.rows) ? json.rows : [];
    console.log(`[Overview] ${coll} loaded ${rows.length} rows`);
    return rows;
  } catch (error) {
    console.error(`[Overview] ${coll} error:`, error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const [signals, ideas, events] = await Promise.all([
    fetchRows("signals", 8),
    fetchRows("ideas", 6),
    fetchRows("events", 6)
  ]);

  return NextResponse.json(
    { signals, ideas, events },
    { headers: { 
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    } }
  );
}
