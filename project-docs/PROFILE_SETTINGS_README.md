# 📋 Profile & Settings System Documentation

## 🎯 Overview

Система за управление на потребителски профили, настройки и роли с интеграция на push известия базирани на локация.

---

## 📁 File Structure

```
apps/web/src/
├── app/
│   ├── profile/
│   │   ├── page.tsx                    # Profile route
│   │   ├── ProfilePage.tsx             # Main profile view
│   │   └── ProfileEditForm.tsx         # Edit profile form
│   │
│   ├── settings/
│   │   ├── page.tsx                    # Settings route
│   │   ├── SettingsPage.tsx            # Main settings with tabs
│   │   └── sections/
│   │       ├── GeneralSettings.tsx     # Language, delete account
│   │       ├── LocationSettings.tsx    # City, street, alerts
│   │       ├── NotificationSettings.tsx # Push notifications
│   │       ├── SecuritySettings.tsx    # Password change
│   │       └── AdminSettings.tsx       # Admin quick links
│   │
│   └── api/
│       ├── profile/
│       │   ├── route.ts                # GET profile
│       │   ├── update/route.ts         # PUT update profile
│       │   ├── update-location/route.ts # PUT update location
│       │   ├── update-password/route.ts # PUT change password
│       │   └── delete-account/route.ts  # DELETE account
│       │
│       └── settings/
│           ├── route.ts                # GET settings
│           ├── update/route.ts         # PUT update settings
│           └── subscriptions/
│               ├── route.ts            # GET subscriptions
│               └── update/route.ts     # PUT update subscriptions
│
├── lib/
│   ├── models/
│   │   └── Subscription.ts             # Subscription model & methods
│   └── constants/
│       └── locations.ts                # Cities & villages list
│
├── types/
│   └── profile.ts                      # TypeScript interfaces
│
├── components/
│   ├── layout/
│   │   └── Header.tsx                  # Updated with profile menu
│   └── ui/
│       └── RoleBadge.tsx               # Role display component
│
└── hooks/
    └── useProfile.ts                   # Profile management hook
```

---

## 🔗 Routes & Pages

### **Public Pages**
- `/profile` - User profile (requires auth)
- `/settings` - User settings (requires auth)

### **API Endpoints**

#### **Profile APIs**
```
GET    /api/profile                    - Get current user profile
PUT    /api/profile/update             - Update profile (name, photo, phone, location)
PUT    /api/profile/update-location    - Update location & subscriptions
PUT    /api/profile/update-password    - Change password
DELETE /api/profile/delete-account     - Delete account (USER only)
```

#### **Settings APIs**
```
GET /api/settings                          - Get user settings
PUT /api/settings/update                   - Update general settings
GET /api/settings/subscriptions            - Get notification subscriptions
PUT /api/settings/subscriptions/update     - Update notification subscriptions
```

---

## 👤 Profile Page (`/profile`)

### **Features**
- ✅ Display user information
- ✅ Profile photo with upload
- ✅ Statistics (signals count, member since)
- ✅ Role badge
- ✅ Contact information
- ✅ Location display
- ✅ Quick links to Settings and My Signals

### **Edit Mode**
- Upload photo (max 5MB, jpg/png/gif)
- Edit display name (required)
- Edit phone number
- Select city/village
- Enter street address

### **Role-Based Access**
| Feature | USER | MODERATOR | ADMIN |
|---------|------|-----------|-------|
| View Profile | ✅ | ✅ | ✅ |
| Edit Profile | ✅ | ✅ | ✅ |
| Upload Photo | ✅ | ✅ | ✅ |
| Delete Account | ❌ | ❌ | ❌ |

---

## ⚙️ Settings Page (`/settings`)

### **Tab Navigation**

#### **1. General Settings** (`general`)
- Language selection (BG/EN)
- Delete account (USER only)
- Confirmation dialog

#### **2. Location Settings** (`location`)
- City/Village dropdown
- Street address input
- **Alert Toggles:**
  - Receive city alerts (general notifications)
  - Receive street alerts (specific to your address)

#### **3. Notification Settings** (`notifications`)
- Master toggle (enable/disable all)
- Signal updates notifications
- Location-based alerts
- Email digest (coming soon)

#### **4. Security Settings** (`security`)
- Password change form
- Password strength validation
- Show/hide password toggles
- Security tips
- 2FA placeholder (coming soon)

#### **5. Admin Settings** (`admin`) - ADMIN/ADMINISTRATOR only
**Quick Links:**
- Users Management → `/admin/users`
- Signals Management → `/admin/signals` or `/administrator/signals`
- System Settings → `/admin/settings` (ADMIN only)
- Categories → `/admin/categories` (ADMIN only)

**Role Permissions Display**

---

## 📍 Location & Notifications System

### **Database Structure**

#### **users collection**
```typescript
{
  displayName: string
  photoURL: string
  phoneNumber: string
  city: string              // NEW
  street: string            // NEW
  notificationsEnabled: boolean  // NEW
  language: string          // NEW
  updatedAt: timestamp
}
```

#### **subscriptions collection** (NEW)
```typescript
{
  userId: string
  city: string
  street: string
  receiveCityAlerts: boolean
  receiveStreetAlerts: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

### **Subscription Model Methods**
```typescript
SubscriptionModel.getByUserId(userId)
SubscriptionModel.upsert(userId, data)
SubscriptionModel.getByCityAlert(city)
SubscriptionModel.getByStreetAlert(city, street)
SubscriptionModel.delete(userId)
```

### **How It Works**
1. User selects city and optionally street
2. User enables city/street alerts
3. System creates/updates subscription
4. Future: When signal is posted in that location → push notification

### **Cities & Villages**
Defined in `/lib/constants/locations.ts`:
- гр. Ботевград
- с. Врачеш
- с. Трудовец
- с. Боженица
- с. Скравена
- с. Литаково

---

## 🎨 Components

### **RoleBadge**
```tsx
import RoleBadge from "@/components/ui/RoleBadge";

<RoleBadge role="ADMIN" showIcon={true} size="md" />
```

**Props:**
- `role` - User role (ADMIN, ADMINISTRATOR, MODERATOR, USER)
- `showIcon` - Show shield icon (default: true)
- `size` - Size variant: sm, md, lg (default: md)

**Colors:**
- ADMIN/ADMINISTRATOR: Red
- MODERATOR: Blue
- USER: Gray

---

## 🔐 Security & Validation

### **Password Requirements**
- Minimum 6 characters
- Must match confirmation
- Server-side validation

### **Photo Upload**
- Max size: 5MB
- Formats: JPG, PNG, GIF
- Base64 encoding for temporary storage
- TODO: Implement proper image CDN

### **Account Deletion**
- Only USER role can delete their account
- ADMIN/ADMINISTRATOR must contact another ADMIN
- Confirmation required
- Signals are marked as deleted (not removed)
- Subscription is deleted
- User removed from Auth and Firestore

---

## 📱 Header Integration

### **Desktop View**
- Profile photo + name + role
- Notification bell with badge
- Dropdown menu (role-based links)
- Logout button

### **Mobile View**
- Hamburger menu button
- Slide-out navigation
- All links + profile + logout
- Auto-close on navigation

### **Role-Based Links**

**USER:**
- Home
- All Signals
- My Signals
- Profile
- Settings

**ADMINISTRATOR:**
- Home
- All Signals
- Signal Management
- Users (read-only)
- Profile
- Settings

**ADMIN:**
- Home
- All Signals
- Admin Panel
- Users
- Roles
- Profile
- Settings

---

## 🔄 User Flow Examples

### **Update Location**
1. Navigate to `/settings`
2. Click "Локация" tab
3. Select city from dropdown
4. Enter street address (optional)
5. Toggle alert preferences
6. Click "Запази настройките"
7. Success → Subscription updated

### **Change Password**
1. Navigate to `/settings`
2. Click "Сигурност" tab
3. Enter new password (min 6 chars)
4. Confirm password
5. Click "Смени паролата"
6. Success → Password updated

### **Delete Account (USER only)**
1. Navigate to `/settings`
2. Stay on "Общи" tab
3. Scroll to "Опасна зона"
4. Click "Изтрий акаунта ми"
5. Click "Потвърди изтриването"
6. Account deleted → Redirect to home

---

## 🧪 Testing Checklist

### **Profile Page**
- [ ] View profile data
- [ ] Edit profile
- [ ] Upload photo
- [ ] Update location
- [ ] Save changes
- [ ] localStorage updates

### **Settings - General**
- [ ] Change language
- [ ] Delete account (USER)
- [ ] Blocked for ADMIN/MODERATOR

### **Settings - Location**
- [ ] Select city
- [ ] Enter street
- [ ] Toggle city alerts
- [ ] Toggle street alerts (disabled without street)
- [ ] Save subscription

### **Settings - Notifications**
- [ ] Master toggle
- [ ] Visual state changes
- [ ] Save preferences

### **Settings - Security**
- [ ] Change password
- [ ] Password validation
- [ ] Show/hide password
- [ ] Error messages

### **Settings - Admin**
- [ ] Quick links (ADMIN)
- [ ] Limited access (ADMINISTRATOR)
- [ ] No access (USER)

### **Header**
- [ ] Profile photo display
- [ ] Role badge
- [ ] Notification bell
- [ ] Dropdown menu (role-based)
- [ ] Mobile menu
- [ ] Logout

---

## 🚀 Future Enhancements

### **Planned Features**
1. **Push Notifications:**
   - Browser push API integration
   - Real-time alerts for location
   - Email digests

2. **2FA (Two-Factor Authentication):**
   - SMS or authenticator app
   - Backup codes

3. **Image Upload:**
   - Cloud storage (Firebase Storage / Cloudinary)
   - Image optimization
   - Cropping tool

4. **Activity Log:**
   - Login history
   - Profile changes
   - Settings updates

5. **Preferences:**
   - Theme (light/dark)
   - Email frequency
   - Notification sounds

---

## 🐛 Known Issues

1. **Photo Upload:**
   - Currently uses base64 (temporary)
   - Large images may cause performance issues
   - Need proper CDN integration

2. **TypeScript:**
   - Some `any` types in Header component
   - Need stricter typing for user object

3. **Validation:**
   - Client-side only for some fields
   - Need server-side validation enhancement

---

## 📞 Support

For issues or questions:
- Check console logs for API errors
- Verify localStorage has `user` and `token`
- Check Firebase Auth custom claims
- Review Firestore `users` and `subscriptions` collections

---

**Version:** 1.0.0  
**Last Updated:** November 30, 2025  
**Author:** AI Coder System
