import { NextRequest } from "next/server";
import { apiRequireRole } from "@/lib/auth/rbac";

// SSE endpoint for real-time admin updates
export async function GET(req: NextRequest) {
  try {
    await apiRequireRole(["admin"]);
    
    const encoder = new TextEncoder();
    
    const customReadable = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`));
        
        // Keep-alive ping every 30 seconds
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: keep-alive\n\n`));
          } catch (e) {
            clearInterval(keepAlive);
          }
        }, 30000);
        
        // In production, subscribe to Firestore changes here
        // For now, this is a placeholder
        
        // Cleanup on close
        req.signal.addEventListener("abort", () => {
          clearInterval(keepAlive);
          controller.close();
        });
      }
    });
    
    return new Response(customReadable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return new Response("Unauthorized", { status: 401 });
    }
    
    return new Response("Internal server error", { status: 500 });
  }
}

// Helper function to send SSE event (to be used from other parts of the code)
export function sendSSEEvent(event: {
  type: string;
  data: any;
}): void {
  // In production, this would push to all connected SSE clients
  // For now, it's a placeholder
  console.log("SSE Event:", event);
}
