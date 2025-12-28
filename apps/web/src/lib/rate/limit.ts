import { adminDb } from "@/lib/firebase-admin";

interface RateLimitParams {
  key: string;
  channel: string;
  windowSec?: number;
  capacity?: number;
  refill?: number;
}

interface RateLimitResult {
  allowed: boolean;
  tokens: number;
}

/**
 * Firestore-backed token bucket limiter shared across SSR/API contexts.
 */
export async function rateLimit({
  key,
  channel,
  windowSec = 60,
  capacity = 60,
  refill = 60
}: RateLimitParams): Promise<RateLimitResult> {
  // В development режим без Firebase credentials, disable rate limiting
  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    return { allowed: true, tokens: capacity };
  }

  const now = Date.now();
  const bucketId = `${channel}:${key}`;
  const safeId = bucketId.replace(/\//g, '_'); // Заменя всички '/' с '_'
  const ref = adminDb.collection("_rate").doc(safeId);


  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists
        ? (snap.data() as { tokens?: number; updatedAt?: number })
        : { tokens: capacity, updatedAt: now };

      const last = data.updatedAt ?? now;
      const elapsed = Math.max(0, now - last);
      const windowsPassed = Math.floor(elapsed / (windowSec * 1000));

      let tokens = Math.min(capacity, (data.tokens ?? capacity) + windowsPassed * refill);
      const allowed = tokens > 0;
      if (allowed) {
        tokens -= 1;
      }

      tx.set(
        ref,
        {
          tokens,
          updatedAt: now,
          windowSec,
          capacity,
          refill
        },
        { merge: true }
      );

      return { allowed, tokens };
    });

    return result;
  } catch (error) {
    console.error('[Rate Limit] Error:', error);
    // Fallback: allow request при грешка
    return { allowed: true, tokens: capacity };
  }
}
