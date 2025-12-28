/**
 * Скрипт за проверка на роли на потребител
 * 
 * Използване:
 * node scripts/check-user-roles.js YOUR_EMAIL@example.com
 */

const admin = require('firebase-admin');
const serviceAccount = require('../apps/web/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function checkUserRoles(email) {
  try {
    console.log(`🔍 Търсене на потребител: ${email}\n`);
    
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✓ Намерен потребител:`);
    console.log(`  UID: ${userRecord.uid}`);
    console.log(`  Email: ${userRecord.email}`);
    console.log(`  Display Name: ${userRecord.displayName || '(няма)'}\n`);
    
    // Check custom claims
    console.log(`🔐 Firebase Auth Custom Claims:`);
    if (userRecord.customClaims) {
      console.log(JSON.stringify(userRecord.customClaims, null, 2));
    } else {
      console.log(`  (няма custom claims)`);
    }
    console.log();
    
    // Check Firestore document
    console.log(`📄 Firestore Document (/users/${userRecord.uid}):`);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      console.log(`  Roles: ${JSON.stringify(data.roles || [])}`);
      console.log(`  Updated at: ${data.updated_at?.toDate() || '(няма)'}`);
      console.log(`  Updated by: ${data.updated_by || '(няма)'}`);
    } else {
      console.log(`  (документът не съществува)`);
    }
    
    console.log(`\n✅ Проверката завърши.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Грешка:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Моля предостави email адрес!');
  console.log('\nИзползване:');
  console.log('  node scripts/check-user-roles.js your-email@example.com');
  process.exit(1);
}

checkUserRoles(email);
