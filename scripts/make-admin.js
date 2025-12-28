/**
 * Скрипт за създаване на първи администратор
 * 
 * Използване:
 * node scripts/make-admin.js YOUR_EMAIL@example.com
 */

const admin = require('firebase-admin');
const serviceAccount = require('../apps/web/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function makeAdmin(email) {
  try {
    console.log(`🔍 Търсене на потребител с email: ${email}`);
    
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✓ Намерен потребител: ${userRecord.uid}`);
    
    // Update Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.update({
      roles: ['ADMIN'],
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: 'system'
    });
    console.log(`✓ Firestore обновен: roles = ['ADMIN']`);
    
    // Update Firebase Auth custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'ADMIN',
      roles: ['ADMIN']
    });
    console.log(`✓ Firebase Auth custom claims обновени`);
    
    // Create audit log
    await db.collection('audit_logs').add({
      event: 'role.granted',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      actor: {
        id: 'system',
        email: 'system',
        roles: ['system']
      },
      target: {
        type: 'user',
        id: userRecord.uid,
        email: email
      },
      details: {
        role: 'ADMIN',
        reason: 'Initial admin setup via script',
        scope: null
      }
    });
    console.log(`✓ Audit log създаден`);
    
    console.log(`\n✅ Успешно! ${email} вече е ADMIN.`);
    console.log(`\n⚠️  ВАЖНО: Потребителят трябва да излезе и влезе отново (logout/login) за да зареди новите claims!`);
    
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
  console.log('  node scripts/make-admin.js your-email@example.com');
  process.exit(1);
}

makeAdmin(email);
