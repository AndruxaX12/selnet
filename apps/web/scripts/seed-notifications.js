// Seed script for test notifications
// Run: node apps/web/scripts/seed-notifications.js

const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const sampleNotifications = [
  {
    category: "system",
    type: "new_login",
    title: "Нов вход в профила",
    body: "Вход от Windows, Chrome, Пловдив",
    icon: "⚙️",
    read_at: null
  },
  {
    category: "signals",
    type: "status_change",
    title: "Нов статус на твоя сигнал",
    body: '"Счупен тротоар на ул. Раковска" е променен на В процес',
    icon: "🚩",
    link: "/signals/test-1",
    read_at: null
  },
  {
    category: "ideas",
    type: "new_comment",
    title: "Нов коментар по идеята ти",
    body: 'Иван Трилийски коментира: "Страхотна идея! Подкрепям я!"',
    icon: "💡",
    link: "/ideas/test-1",
    read_at: null
  },
  {
    category: "events",
    type: "reminder",
    title: "Напомняне за събитие",
    body: '"Почистване на Rowing канала" започва утре в 10:00',
    icon: "📅",
    link: "/events/test-1",
    read_at: null
  },
  {
    category: "signals",
    type: "new_signal_nearby",
    title: "Нов сигнал в твоя район",
    body: "Липса на осветление в парк Лаута",
    icon: "🚩",
    link: "/signals/test-2",
    read_at: Date.now() - 3600000 // Read 1 hour ago
  }
];

async function seedNotifications() {
  try {
    // Get first user (or specify a user ID)
    const usersSnapshot = await db.collection("users").limit(1).get();
    
    if (usersSnapshot.empty) {
      console.error("No users found! Create a user first.");
      process.exit(1);
    }

    const userId = usersSnapshot.docs[0].id;
    console.log(`Seeding notifications for user: ${userId}`);

    const batch = db.batch();
    const now = Date.now();

    sampleNotifications.forEach((notif, index) => {
      const ref = db.collection("notifications").doc();
      batch.set(ref, {
        ...notif,
        user_id: userId,
        created_at: now - (index * 3600000), // Spread over hours
        delivered: {
          inapp: true,
          email: false,
          push: false
        }
      });
    });

    await batch.commit();
    console.log(`✅ Created ${sampleNotifications.length} test notifications`);
    
    // Create default notification preferences
    const prefsRef = db.collection("notification_prefs").doc(userId);
    const prefsDoc = await prefsRef.get();
    
    if (!prefsDoc.exists) {
      await prefsRef.set({
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
      });
      console.log("✅ Created default notification preferences");
    }

    console.log("🎉 Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding notifications:", error);
    process.exit(1);
  }
}

seedNotifications();
