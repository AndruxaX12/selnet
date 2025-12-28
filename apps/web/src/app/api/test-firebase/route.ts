import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/server";

/**
 * GET /api/test-firebase
 * Test Firebase Admin SDK configuration
 */
export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      env: {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        projectId: process.env.FIREBASE_PROJECT_ID || "Not set",
      },
      tests: {},
    };

    // Test 1: Check if adminAuth is initialized
    try {
      const authApp = (adminAuth as any).app;
      results.tests.auth = {
        initialized: true,
        appName: authApp?.name || "unknown",
      };
    } catch (error: any) {
      results.tests.auth = {
        initialized: false,
        error: error.message,
      };
    }

    // Test 2: Check if adminDb is initialized
    try {
      const dbApp = (adminDb as any)._firestore?._settings;
      results.tests.firestore = {
        initialized: true,
        projectId: dbApp?.projectId || "unknown",
      };
    } catch (error: any) {
      results.tests.firestore = {
        initialized: false,
        error: error.message,
      };
    }

    // Test 3: Try to list users (just 1)
    try {
      const listUsersResult = await adminAuth.listUsers(1);
      results.tests.listUsers = {
        success: true,
        userCount: listUsersResult.users.length,
      };
    } catch (error: any) {
      results.tests.listUsers = {
        success: false,
        error: error.message,
        code: error.code,
      };
    }

    // Test 4: Try to read from Firestore
    try {
      const usersSnapshot = await adminDb.collection("users").limit(1).get();
      results.tests.firestoreRead = {
        success: true,
        docCount: usersSnapshot.docs.length,
      };
    } catch (error: any) {
      results.tests.firestoreRead = {
        success: false,
        error: error.message,
        code: error.code,
      };
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Test failed",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
