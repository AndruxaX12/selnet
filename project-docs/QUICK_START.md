# 🚀 Quick Start Guide - Profile & Settings System

## 📋 Table of Contents
1. [Setup](#setup)
2. [Testing Profile Page](#testing-profile-page)
3. [Testing Settings Page](#testing-settings-page)
4. [Testing Header Integration](#testing-header-integration)
5. [Common Issues](#common-issues)
6. [API Testing](#api-testing)

---

## 🛠️ Setup

### **1. Prerequisites**
Ensure you have:
- ✅ Firebase Admin SDK configured
- ✅ Firestore database running
- ✅ User authentication working
- ✅ At least one test user created

### **2. Database Setup**
No migration needed! The system will automatically create the required fields on first use.

**Auto-created fields in `users` collection:**
```javascript
{
  city: "",
  street: "",
  notificationsEnabled: true,
  language: "bg"
}
```

**Auto-created collection `subscriptions`:**
```javascript
{
  userId: "user-id",
  city: "Ботевград",
  street: "ул. Христо Ботев 15",
  receiveCityAlerts: true,
  receiveStreetAlerts: false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **3. Start Development Server**
```bash
cd apps/web
npm run dev
```

Open: http://localhost:3030

---

## 👤 Testing Profile Page

### **Step 1: Login**
1. Navigate to http://localhost:3030/login
2. Login with test credentials
3. Verify redirect to home page

### **Step 2: Access Profile**
```
Method 1: Direct URL
→ http://localhost:3030/profile

Method 2: Header Dropdown
→ Click profile photo → "Профил"

Method 3: Settings Quick Link
→ Go to /settings → Click "Виж профил"
```

### **Step 3: View Profile**
Verify you see:
- ✅ Profile photo (or fallback avatar)
- ✅ Display name
- ✅ Email
- ✅ Role badge with correct color
- ✅ Statistics (signals count, member since)
- ✅ Contact information
- ✅ Location (if set)
- ✅ Quick action cards

### **Step 4: Edit Profile**
1. Click "Редактирай профил"
2. **Upload Photo:**
   - Click camera icon
   - Select image (max 5MB, jpg/png/gif)
   - Verify preview appears
3. **Edit Name:**
   - Change display name
   - Try leaving it empty (should show validation)
4. **Edit Phone:**
   - Add/change phone number
5. **Edit Location:**
   - Select city from dropdown
   - Enter street address
6. Click "Запази промените"
7. Verify success message
8. Verify profile view updates

### **Expected Results:**
- ✅ Photo preview shows immediately
- ✅ Save button disabled until changes made
- ✅ Validation works (required fields)
- ✅ Success message after save
- ✅ Data persists after page reload

---

## ⚙️ Testing Settings Page

### **Access Settings**
```
http://localhost:3030/settings

OR

Header → Profile Dropdown → "Настройки"
```

### **Tab 1: General Settings** (`general`)
**Test Cases:**
1. ✅ Language dropdown shows BG/EN
2. ✅ Change language → Save → Success message
3. ✅ **USER role:** See "Delete Account" button
4. ✅ **ADMIN/ADMINISTRATOR:** See info message (no delete)
5. ✅ Click "Изтрий акаунта ми" → Confirm → Account deleted

**Expected:**
- Language selection persists
- Delete only available for USER
- Confirmation required for deletion

---

### **Tab 2: Location Settings** (`location`)
**Test Cases:**
1. ✅ City dropdown populated with 6 locations
2. ✅ Select city (required)
3. ✅ Enter street (optional)
4. ✅ Toggle "City alerts" ON/OFF
5. ✅ Toggle "Street alerts" (disabled if no street)
6. ✅ Save → Success message

**Location List:**
- гр. Ботевград
- с. Врачеш
- с. Трудовец
- с. Боженица
- с. Скравена
- с. Литаково

**Expected:**
- City required for save
- Street alerts disabled without street address
- Toggle switches animate smoothly
- Subscription created in Firestore

---

### **Tab 3: Notification Settings** (`notifications`)
**Test Cases:**
1. ✅ Master toggle OFF → All notifications grey out
2. ✅ Master toggle ON → All notifications active
3. ✅ Signal updates card shows "Активни" badge
4. ✅ Location alerts card shows "Активни" badge
5. ✅ Email digest shows "Скоро" badge
6. ✅ Save → Success message

**Expected:**
- Visual feedback for enabled/disabled states
- Master toggle controls all
- Settings persist after reload

---

### **Tab 4: Security Settings** (`security`)
**Test Cases:**
1. ✅ Enter new password (min 6 chars)
2. ✅ Confirm password (must match)
3. ✅ Click show/hide password icons
4. ✅ Try password < 6 chars → Validation error
5. ✅ Try non-matching passwords → Validation error
6. ✅ Valid password → Save → Success message
7. ✅ Security tips visible
8. ✅ 2FA section shows "Скоро достъпно"

**Expected:**
- Real-time validation feedback
- Password masked by default
- Form clears after successful change

---

### **Tab 5: Admin Settings** (`admin`)
**Visibility:**
- ❌ USER: Tab not visible
- ✅ ADMINISTRATOR: Tab visible (limited links)
- ✅ ADMIN: Tab visible (all links)

**Test ADMINISTRATOR:**
1. ✅ See "Управление на сигнали" link
2. ✅ See "Потребители" link
3. ✅ Info box shows role limitations

**Test ADMIN:**
1. ✅ See "Admin Panel" link
2. ✅ See "Потребители" link
3. ✅ See "Роли" link (if exists)
4. ✅ See "Системни настройки" link
5. ✅ See "Категории" link
6. ✅ Info box shows full permissions

**Expected:**
- Role-based link visibility
- Hover effects on cards
- Arrow animation on hover

---

## 🎨 Testing Header Integration

### **Desktop View (≥768px)**
**Test Cases:**
1. ✅ Logo animates (СелНет ↔ Ботевград every 5s)
2. ✅ "Всички сигнали" link visible
3. ✅ Notification bell visible (with/without badge)
4. ✅ "My Panel" text shows (role-based)
5. ✅ Profile photo visible
6. ✅ Name + Role visible under photo
7. ✅ Dropdown arrow visible
8. ✅ Click photo → Dropdown opens

**Dropdown Content (USER):**
```
Моите сигнали
Профил
Настройки
---
Изход
```

**Dropdown Content (ADMINISTRATOR):**
```
Управление на сигнали
Потребители (read-only)
---
Профил
Настройки
---
Изход
```

**Dropdown Content (ADMIN):**
```
Admin Panel
Потребители
Роли
---
Моят профил
Настройки
---
Изход
```

**Expected:**
- Role-specific links
- Hover states work
- Click link → Navigate + close dropdown
- Click outside → Close dropdown

---

### **Mobile View (<768px)**
**Test Cases:**
1. ✅ Logo visible
2. ✅ Bell icon visible
3. ✅ Profile photo visible (small)
4. ✅ Hamburger menu (☰) visible
5. ✅ "All Signals" nav hidden
6. ✅ "My Panel" text hidden
7. ✅ Name + Role hidden
8. ✅ Click ☰ → Mobile menu slides in

**Mobile Menu Content:**
```
Начало
Всички сигнали
---
[Role-specific links]
---
Профил
Настройки
Изход
```

**Expected:**
- Menu slides from top
- Full-width links
- Click link → Navigate + close menu
- Click X → Close menu
- Responsive padding

---

## 🔧 Common Issues

### **Issue 1: "No token found"**
**Solution:**
```javascript
// Check localStorage
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));

// Re-login if missing
window.location.href = '/login';
```

---

### **Issue 2: Profile not loading**
**Debug Steps:**
1. Open DevTools → Network tab
2. Check `/api/profile` request
3. Verify 200 response
4. Check response body for data
5. Verify Authorization header present

**Common Causes:**
- Token expired
- User not in Firestore `users` collection
- Firebase Admin SDK not initialized

---

### **Issue 3: Settings not saving**
**Debug Steps:**
1. Check Network tab for PUT request
2. Verify request payload
3. Check response status (should be 200)
4. Verify Firestore data updated

**Common Causes:**
- Validation error (check console)
- Permission denied (check Firebase rules)
- Network error

---

### **Issue 4: Photo upload fails**
**Debug Steps:**
```javascript
// Check file size
if (file.size > 5 * 1024 * 1024) {
  console.error('File too large');
}

// Check file type
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (!allowedTypes.includes(file.type)) {
  console.error('Invalid file type');
}
```

**Current Limitation:**
- Photos stored as base64 in Firestore
- Large images may cause performance issues
- TODO: Implement cloud storage

---

### **Issue 5: Delete account button missing**
**Reason:** Only USER role can delete account

**Verify Role:**
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('Role:', user.role);
```

**Expected:**
- `USER` → Button visible
- `ADMINISTRATOR` → Info message
- `ADMIN` → Info message

---

## 🧪 API Testing

### **Test with cURL**

#### **Get Profile**
```bash
curl -X GET http://localhost:3030/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **Update Profile**
```bash
curl -X PUT http://localhost:3030/api/profile/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "New Name",
    "phoneNumber": "+359888123456",
    "city": "Ботевград",
    "street": "ул. Христо Ботев 15"
  }'
```

#### **Update Location + Subscription**
```bash
curl -X PUT http://localhost:3030/api/profile/update-location \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Ботевград",
    "street": "ул. Христо Ботев 15",
    "receiveCityAlerts": true,
    "receiveStreetAlerts": true
  }'
```

#### **Change Password**
```bash
curl -X PUT http://localhost:3030/api/profile/update-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "newsecurepassword123"
  }'
```

#### **Delete Account (USER only)**
```bash
curl -X DELETE http://localhost:3030/api/profile/delete-account \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **Get Settings**
```bash
curl -X GET http://localhost:3030/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **Update Settings**
```bash
curl -X PUT http://localhost:3030/api/settings/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationsEnabled": true,
    "language": "bg"
  }'
```

#### **Get Subscriptions**
```bash
curl -X GET http://localhost:3030/api/settings/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **Update Subscriptions**
```bash
curl -X PUT http://localhost:3030/api/settings/subscriptions/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Ботевград",
    "street": "ул. Христо Ботев 15",
    "receiveCityAlerts": true,
    "receiveStreetAlerts": true
  }'
```

---

## ✅ Success Checklist

### **Profile System**
- [ ] Can view profile at `/profile`
- [ ] Can edit name, photo, phone, location
- [ ] Photo upload works and shows preview
- [ ] Save button updates profile
- [ ] Role badge shows correct color
- [ ] Statistics display correctly

### **Settings System**
- [ ] Can access settings at `/settings`
- [ ] All 5 tabs load correctly
- [ ] General: Language selection works
- [ ] General: Delete account works (USER only)
- [ ] Location: City dropdown populated
- [ ] Location: Toggles work correctly
- [ ] Notifications: Master toggle works
- [ ] Security: Password change works
- [ ] Admin: Tab shows for ADMIN/ADMINISTRATOR only

### **Header Integration**
- [ ] Logo animates on desktop
- [ ] Profile photo displays
- [ ] Dropdown menu works
- [ ] Role-based links visible
- [ ] Mobile menu works
- [ ] Logout works

### **API Endpoints**
- [ ] All profile APIs return 200
- [ ] All settings APIs return 200
- [ ] Token validation works
- [ ] Role-based access enforced
- [ ] Data persists in Firestore

---

## 🎉 You're Done!

If all checklist items pass, the Profile & Settings system is fully functional!

**Next Steps:**
1. Test with different user roles
2. Test on mobile device
3. Implement push notifications (see NotificationService)
4. Add cloud storage for photos
5. Enable 2FA

**Need Help?**
- Check console logs for errors
- Verify Firestore data structure
- Review API responses in Network tab
- Check `PROFILE_SETTINGS_README.md` for documentation

---

**Version:** 1.0.0  
**Last Updated:** November 30, 2025
