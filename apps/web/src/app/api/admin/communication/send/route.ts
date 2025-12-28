import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email/send";
import { logAction } from "@/lib/admin/audit";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userRole = decodedToken.role || "user";

    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { subject, message, targetGroup, targetUsers } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let recipients: string[] = [];

    if (targetGroup === "all") {
      const usersSnap = await adminDb.collection("users").get();
      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.email) recipients.push(data.email);
      });
    } else if (targetGroup === "admins") {
      const usersSnap = await adminDb.collection("users").where("role", "==", "admin").get();
      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.email) recipients.push(data.email);
      });
    } else if (targetGroup === "operators") {
      const usersSnap = await adminDb.collection("users").where("role", "==", "operator").get();
      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.email) recipients.push(data.email);
      });
    } else if (targetGroup === "selected" && Array.isArray(targetUsers)) {
      recipients = targetUsers;
    }

    if (recipients.length === 0) {
      return NextResponse.json({ message: "No recipients found" });
    }

    await sendEmail({
      to: recipients,
      subject,
      html: `<div style="white-space: pre-wrap;">${message}</div>`,
      text: message,
      category: "bulk_communication"
    });

    // Audit Log
    await logAction(
        decodedToken.uid,
        decodedToken.email || "unknown",
        `Sent bulk email to ${targetGroup}`,
        "communication",
        `Subject: ${subject}. Recipients count: ${recipients.length}`
    );

    return NextResponse.json({ success: true, count: recipients.length });
  } catch (error) {
    console.error("Error sending bulk email:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
