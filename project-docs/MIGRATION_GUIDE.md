# 🔄 Migration Guide - Profile & Settings System

## 📋 Overview

This guide helps you migrate existing users to the new Profile & Settings system.

---

## 🗄️ Database Changes

### **New Fields in `users` Collection**

#### **Before:**
```javascript
{
  uid: "user-123",
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: "https://...",
  role: "USER",
  createdAt: timestamp,
  blocked: false,
  signalsCount: 5
}
```

#### **After:**
```javascript
{
  uid: "user-123",
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: "https://...",
  phoneNumber: "",              // NEW
  role: "USER",
  createdAt: timestamp,
  blocked: false,
  signalsCount: 5,
  city: "",                     // NEW
  street: "",                   // NEW
  notificationsEnabled: true,   // NEW
  language: "bg",               // NEW
  updatedAt: timestamp          // NEW
}
```

### **New Collection: `subscriptions`**

```javascript
{
  id: "auto-generated",
  userId: "user-123",
  city: "Ботевград",
  street: "ул. Христо Ботев 15",
  receiveCityAlerts: true,
  receiveStreetAlerts: false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 🚀 Migration Steps

### **Option 1: Automatic Migration (Recommended)**

The system will automatically add missing fields when users:
1. First visit their profile page
2. Update their settings
3. Log in after deployment

**No manual migration needed!**

### **Option 2: Manual Firestore Script**

If you want to migrate all users at once:

#### **Step 1: Create Migration Script**

```javascript
// scripts/migrate-users.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateUsers() {
  const usersSnapshot = await db.collection('users').get();
  const batch = db.batch();
  let count = 0;

  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    
    // Add new fields if they don't exist
    const updates = {};
    
    if (data.phoneNumber === undefined) {
      updates.phoneNumber = '';
    }
    
    if (data.city === undefined) {
      updates.city = '';
    }
    
    if (data.street === undefined) {
      updates.street = '';
    }
    
    if (data.notificationsEnabled === undefined) {
      updates.notificationsEnabled = true;
    }
    
    if (data.language === undefined) {
      updates.language = 'bg';
    }
    
    if (data.updatedAt === undefined) {
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`✅ Migrated ${count} users`);
  } else {
    console.log('✅ No users need migration');
  }
}

migrateUsers()
  .then(() => {
    console.log('Migration complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

#### **Step 2: Run Migration**

```bash
# Install dependencies (if not already)
npm install firebase-admin

# Place your serviceAccountKey.json in scripts folder

# Run migration
node scripts/migrate-users.js
```

---

## 🔐 Firebase Security Rules Update

### **Add Rules for `subscriptions` Collection**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... existing rules ...
    
    // Subscriptions collection
    match /subscriptions/{subscriptionId} {
      // Users can read their own subscriptions
      allow read: if request.auth != null 
                  && resource.data.userId == request.auth.uid;
      
      // Users can create/update their own subscriptions
      allow create, update: if request.auth != null 
                            && request.resource.data.userId == request.auth.uid
                            && request.resource.data.keys().hasAll(['userId', 'city', 'receiveCityAlerts', 'receiveStreetAlerts']);
      
      // Users can delete their own subscriptions
      allow delete: if request.auth != null 
                    && resource.data.userId == request.auth.uid;
      
      // Admins can read all subscriptions
      allow read: if request.auth != null 
                  && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'ADMINISTRATOR'];
    }
    
    // Update users rules to allow new fields
    match /users/{userId} {
      allow read: if request.auth != null;
      
      allow update: if request.auth != null 
                    && request.auth.uid == userId
                    && request.resource.data.keys().hasAll(['email', 'displayName', 'role'])
                    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['email', 'role', 'blocked', 'createdAt']);
      
      // Admins can update any user
      allow update: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'ADMINISTRATOR'];
    }
  }
}
```

#### **Deploy Rules**

```bash
firebase deploy --only firestore:rules
```

---

## 📦 Environment Variables

No new environment variables needed. The system uses existing Firebase configuration.

**Verify Your `.env.local`:**
```env
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY=your-private-key
FIREBASE_ADMIN_CLIENT_EMAIL=your-client-email
```

---

## 🧪 Testing After Migration

### **1. Test Existing Users**

```bash
# Login with existing user
# Navigate to /profile
# Verify all fields present
# Try editing profile
# Verify save works
```

### **2. Test New Users**

```bash
# Register new user
# Navigate to /profile
# Verify default values:
#   - phoneNumber: ""
#   - city: ""
#   - street: ""
#   - notificationsEnabled: true
#   - language: "bg"
```

### **3. Test API Endpoints**

```bash
# Get profile
curl -X GET http://localhost:3030/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return all new fields
```

---

## 🔄 Rollback Plan

### **If Issues Occur:**

#### **Step 1: Revert Code**
```bash
git revert HEAD
git push
```

#### **Step 2: Remove New Collections** (Optional)
```javascript
// scripts/rollback-subscriptions.js
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function deleteSubscriptions() {
  const snapshot = await db.collection('subscriptions').get();
  const batch = db.batch();
  
  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log('✅ Deleted subscriptions collection');
}

deleteSubscriptions();
```

#### **Step 3: Remove New Fields** (Optional)
```javascript
// scripts/rollback-user-fields.js
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function removeNewFields() {
  const snapshot = await db.collection('users').get();
  const batch = db.batch();
  
  snapshot.forEach((doc) => {
    batch.update(doc.ref, {
      phoneNumber: admin.firestore.FieldValue.delete(),
      city: admin.firestore.FieldValue.delete(),
      street: admin.firestore.FieldValue.delete(),
      notificationsEnabled: admin.firestore.FieldValue.delete(),
      language: admin.firestore.FieldValue.delete(),
    });
  });
  
  await batch.commit();
  console.log('✅ Removed new fields');
}

removeNewFields();
```

---

## ⚠️ Breaking Changes

### **None!**

This is a **backwards-compatible** update:
- ✅ Existing users continue to work
- ✅ New fields have default values
- ✅ Old API endpoints unchanged
- ✅ No required actions for existing users

### **Optional Actions:**

Users can optionally:
1. Update their profile with location
2. Enable/disable notifications
3. Change password
4. Set language preference

---

## 📊 Monitoring

### **Check Migration Status**

```javascript
// scripts/check-migration-status.js
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function checkMigrationStatus() {
  const snapshot = await db.collection('users').get();
  
  let migrated = 0;
  let notMigrated = 0;
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    
    if (data.city !== undefined && 
        data.notificationsEnabled !== undefined &&
        data.language !== undefined) {
      migrated++;
    } else {
      notMigrated++;
      console.log(`User ${doc.id} needs migration`);
    }
  });
  
  console.log(`✅ Migrated: ${migrated}`);
  console.log(`⏳ Not migrated: ${notMigrated}`);
  console.log(`📊 Total: ${snapshot.size}`);
}

checkMigrationStatus();
```

### **Check Subscriptions Count**

```javascript
// scripts/check-subscriptions.js
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function checkSubscriptions() {
  const snapshot = await db.collection('subscriptions').get();
  console.log(`📋 Total subscriptions: ${snapshot.size}`);
  
  let withCity = 0;
  let withStreet = 0;
  let cityAlerts = 0;
  let streetAlerts = 0;
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.city) withCity++;
    if (data.street) withStreet++;
    if (data.receiveCityAlerts) cityAlerts++;
    if (data.receiveStreetAlerts) streetAlerts++;
  });
  
  console.log(`🏙️  With city: ${withCity}`);
  console.log(`🏠 With street: ${withStreet}`);
  console.log(`🔔 City alerts enabled: ${cityAlerts}`);
  console.log(`📍 Street alerts enabled: ${streetAlerts}`);
}

checkSubscriptions();
```

---

## 🚀 Deployment Checklist

### **Before Deployment**
- [ ] Review all new code
- [ ] Test locally with all user roles
- [ ] Update Firestore security rules
- [ ] Backup Firestore database
- [ ] Prepare rollback plan

### **During Deployment**
- [ ] Deploy to staging first
- [ ] Test with production-like data
- [ ] Monitor error logs
- [ ] Check API response times
- [ ] Verify Firestore writes

### **After Deployment**
- [ ] Run migration status check
- [ ] Monitor user feedback
- [ ] Check analytics
- [ ] Verify no errors in logs
- [ ] Test with different devices

### **Week 1 Monitoring**
- [ ] Check daily active users
- [ ] Monitor API error rates
- [ ] Review user engagement with new features
- [ ] Collect user feedback
- [ ] Fix any reported issues

---

## 📞 Support

### **Common Post-Migration Issues**

#### **Issue 1: Users can't see profile**
**Solution:**
```javascript
// Verify user document exists
const userDoc = await db.collection('users').doc(userId).get();
console.log(userDoc.exists, userDoc.data());
```

#### **Issue 2: Settings not saving**
**Solution:**
```javascript
// Check Firestore rules
// Verify token is valid
// Check API logs for errors
```

#### **Issue 3: Subscriptions not created**
**Solution:**
```javascript
// Verify collection exists
// Check security rules
// Verify API endpoint works
```

---

## ✅ Success Metrics

### **Track These KPIs:**

1. **Adoption Rate**
   - % users who set location
   - % users who enable notifications
   - % users who update profile

2. **Engagement**
   - Daily profile page views
   - Settings page visits
   - Photo uploads

3. **Technical**
   - API response times
   - Error rates
   - Firestore read/write counts

4. **User Satisfaction**
   - Support tickets
   - User feedback
   - Feature requests

---

## 🎉 Conclusion

The migration is designed to be **seamless and automatic**. Most users won't notice any changes until they visit their profile page.

**Key Points:**
- ✅ No downtime required
- ✅ Backwards compatible
- ✅ Auto-migration on first use
- ✅ Easy rollback if needed

---

**Version:** 1.0.0  
**Last Updated:** November 30, 2025  
**Migration Status:** Ready for Production
