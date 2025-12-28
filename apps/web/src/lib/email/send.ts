// Email sending utility
// Note: This uses console.log for now. In production, integrate with SendGrid, Nodemailer, or similar

import { getFirestore } from "firebase-admin/firestore";
import { getApps, initializeApp, cert } from "firebase-admin/app";

// Helper to ensure Admin SDK is initialized (if running on server)
function getDb() {
  if (getApps().length === 0) {
    // This assumes we are in a server context where standard initialization might have happened
    // or we might need to rely on the existing admin initialization
    // For now, let's assume standard initialization is available or try-catch it
    try {
        initializeApp();
    } catch (e) {
        // ignore if already initialized
    }
  }
  return getFirestore();
}

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  category?: string; // e.g. "marketing", "system", "notification"
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    // Log to console
    console.log("=== EMAIL WOULD BE SENT ===");
    console.log("To:", payload.to);
    console.log("Subject:", payload.subject);
    console.log("Category:", payload.category);
    console.log("===========================");
    
    // Log to Firestore 'mail_logs' collection for Admin visibility
    try {
        const db = getDb();
        await db.collection("mail_logs").add({
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
            category: payload.category || "general",
            sentAt: new Date(),
            status: "sent (mock)"
        });
    } catch (dbError) {
        console.warn("Failed to log email to Firestore:", dbError);
    }
    
    // In production, integrate with SendGrid/Nodemailer here
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

// Helper to send role granted notification
export async function notifyRoleGranted(params: {
  userEmail: string;
  userName?: string;
  role: string;
  reason: string;
  adminEmail: string;
}) {
  const { roleGrantedEmail } = await import('./templates');
  
  const email = roleGrantedEmail({
    ...params,
    date: new Date().toLocaleString("bg-BG", {
      dateStyle: "long",
      timeStyle: "short"
    })
  });
  
  return sendEmail({
    to: params.userEmail,
    subject: email.subject,
    html: email.html,
    text: email.text
  });
}

// Helper to send role revoked notification
export async function notifyRoleRevoked(params: {
  userEmail: string;
  userName?: string;
  role: string;
  reason: string;
  adminEmail: string;
}) {
  const { roleRevokedEmail } = await import('./templates');
  
  const email = roleRevokedEmail({
    ...params,
    date: new Date().toLocaleString("bg-BG", {
      dateStyle: "long",
      timeStyle: "short"
    })
  });
  
  return sendEmail({
    to: params.userEmail,
    subject: email.subject,
    html: email.html,
    text: email.text
  });
}

// Helper to send approval request notification
export async function notifyApprovalRequest(params: {
  adminEmails: string[];
  requesterEmail: string;
  targetUserEmail: string;
  role: string;
  reason: string;
  requestId: string;
}) {
  const { approvalRequestEmail } = await import('./templates');
  
  const email = approvalRequestEmail(params);
  
  // Send to all admins
  const results = await Promise.all(
    params.adminEmails.map(adminEmail =>
      sendEmail({
        to: adminEmail,
        subject: email.subject,
        html: email.html,
        text: email.text
      })
    )
  );
  
  return results.every(r => r);
}
