import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// 6 hours in milliseconds
const VIEW_COOLDOWN_MS = 6 * 60 * 60 * 1000;

// In-memory cache for quick lookups (backup for Firestore)
const recentViewsCache = new Map<string, number>();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get client IP for antispam
    const ip = req.ip || 
               req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    // Try to get user ID from request body or header
    let userId: string | null = null;
    
    // First try from X-User-Data header (most reliable)
    const userDataHeader = req.headers.get("X-User-Data");
    if (userDataHeader) {
      try {
        const userData = JSON.parse(userDataHeader);
        userId = userData.uid || null;
      } catch {
        // Invalid header, ignore
      }
    }
    
    // Fallback to request body if no header
    if (!userId) {
      try {
        const text = await req.text();
        if (text) {
          const body = JSON.parse(text);
          userId = body.userId || null;
        }
      } catch {
        // No body or invalid JSON, that's fine
      }
    }
    
    const now = Date.now();
    
    // Create unique view key based on user ID (if logged in) or IP
    const viewerKey = userId || `ip_${ip.replace(/[.:]/g, '_')}`;
    const viewKey = `${viewerKey}_${id}`; // Use underscore for valid Firestore doc ID
    
    // First check in-memory cache for quick rejection
    const cachedViewTime = recentViewsCache.get(viewKey);
    if (cachedViewTime && (now - cachedViewTime) < VIEW_COOLDOWN_MS) {
      const remainingMinutes = Math.ceil((VIEW_COOLDOWN_MS - (now - cachedViewTime)) / 60000);
      return NextResponse.json({ 
        success: false, 
        message: `Вече сте гледали този сигнал. Опитайте отново след ${remainingMinutes} минути.`,
        cooldownRemaining: remainingMinutes
      }, { status: 429 });
    }
    
    // Check Firestore for persistent view tracking
    const viewDocRef = adminDb.collection("signal_views").doc(viewKey);
    const viewDoc = await viewDocRef.get();
    
    if (viewDoc.exists) {
      const lastViewTime = viewDoc.data()?.timestamp?.toMillis?.() || viewDoc.data()?.timestamp || 0;
      if ((now - lastViewTime) < VIEW_COOLDOWN_MS) {
        // Update cache
        recentViewsCache.set(viewKey, lastViewTime);
        const remainingMinutes = Math.ceil((VIEW_COOLDOWN_MS - (now - lastViewTime)) / 60000);
        return NextResponse.json({ 
          success: false, 
          message: `Вече сте гледали този сигнал. Опитайте отново след ${remainingMinutes} минути.`,
          cooldownRemaining: remainingMinutes
        }, { status: 429 });
      }
    }
    
    // Record the view in Firestore
    await viewDocRef.set({
      signalId: id,
      viewerKey,
      ip: ip,
      userId: userId || null,
      timestamp: FieldValue.serverTimestamp(),
      timestampMs: now
    });
    
    // Update cache
    recentViewsCache.set(viewKey, now);
    
    // Clean old cache entries (older than 6 hours) to prevent memory leak
    for (const [key, timestamp] of recentViewsCache.entries()) {
      if (now - timestamp > VIEW_COOLDOWN_MS) {
        recentViewsCache.delete(key);
      }
    }
    
    // Increment view count in Firestore
    await adminDb.collection("signals").doc(id).update({
      views: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "View counted" 
    });
    
  } catch (error) {
    console.error("View tracking error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 });
  }
}
