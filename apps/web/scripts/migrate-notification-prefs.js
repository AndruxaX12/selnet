// Migration script to add default notification preferences to existing users
// Run: node apps/web/scripts/migrate-notification-prefs.js

const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const defaultPrefs = {
  channels: {
    system: { inapp: true, email: true, push: false },
    signals: { inapp: true, email: false, push: true },
    ideas: { inapp: true, email: false, push: false },
    events: { inapp: true, email: true, push: true }
  },
  digest: {
    daily: null,
    weekly: null,
    monthly: null
  },
  quiet_hours: {
    enabled: false,
    from: "22:00",
    to: "07:00"
  }
};

async function migrateNotificationPrefs() {
  try {
    console.log("🔄 Starting notification preferences migration...\n");

    // Get all users
    const usersSnapshot = await db.collection("users").get();
    console.log(`📊 Found ${usersSnapshot.size} users\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        // Check if prefs already exist
        const prefsDoc = await db.collection("notification_prefs").doc(userId).get();
        
        if (prefsDoc.exists) {
          console.log(`⏭️  Skipping ${userId} (already has prefs)`);
          skipped++;
          continue;
        }

        // Create default prefs
        await db.collection("notification_prefs").doc(userId).set(defaultPrefs);
        console.log(`✅ Created prefs for ${userId}`);
        created++;

      } catch (error) {
        console.error(`❌ Error for ${userId}:`, error.message);
        errors++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📈 Migration Summary:");
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors:  ${errors}`);
    console.log(`   Total:   ${usersSnapshot.size}`);
    console.log("=".repeat(50));

    if (errors === 0) {
      console.log("\n✨ Migration completed successfully!");
    } else {
      console.log(`\n⚠️  Migration completed with ${errors} errors`);
    }

    process.exit(errors === 0 ? 0 : 1);
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

migrateNotificationPrefs();
