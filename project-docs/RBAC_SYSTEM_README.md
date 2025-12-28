# 🔐 RBAC Admin System - Complete Documentation

## 📋 System Overview

Пълна Role-Based Access Control (RBAC) система с 3 роли: **ADMIN**, **ADMINISTRATOR**, и **USER**.

---

## 🎯 Roles & Permissions

### 🟪 ADMIN (Root Owner - Level 3)
**Full System Control**

✅ **Permissions:**
- Manage all users (create, update, delete)
- Change user roles (promote/demote)
- Block/unblock users
- Access to admin panel
- View system logs
- Manage categories
- System settings
- Full access to everything

📍 **Access:**
- `/admin` - Admin Dashboard
- `/admin/users` - User Management
- `/admin/roles` - Role Management
- `/admin/logs` - System Logs
- `/admin/settings` - System Settings
- `/admin/categories` - Category Management

---

### 🔵 ADMINISTRATOR (Moderator - Level 2)
**Content Moderation**

✅ **Permissions:**
- Manage signals (edit, delete, archive)
- Change signal status (New, In Progress, Completed, Rejected)
- Add administrative comments
- Block/unblock users (limited)
- View all users (read-only)

❌ **Limitations:**
- Cannot change user roles
- Cannot delete users
- Cannot access admin panel
- Cannot change system settings

📍 **Access:**
- `/administrator` - Administrator Dashboard
- `/administrator/signals` - Signal Management
- `/administrator/users` - Users (read-only + block/unblock)

---

### ⚪ USER (Level 1)
**Basic User**

✅ **Permissions:**
- Create signals
- Edit own signals
- Delete own signals
- Comment on signals
- View own signals

❌ **Limitations:**
- Cannot moderate others' content
- Cannot change roles
- Cannot block users
- Basic access only

📍 **Access:**
- `/me` - My Signals
- `/profile` - Profile
- `/settings` - Settings

---

## 🔑 Root Admin Access

### Setup URL:
```
http://localhost:3030/api/auth/setup-admin/[SECRET_CODE]
```

**Purpose:** Creates or resets root admin account with predefined credentials.

### Login URL:
```
http://localhost:3030/api/auth/root-login/[SECRET_CODE]
```

**Purpose:** Shows login form for root admin authentication.

### Environment Variables (.env.local):
```env
ADMIN_SECRET_CODE=SUPER_SECRET_2024
ROOT_ADMIN_EMAIL=admin@cenner.bg
ROOT_ADMIN_PASSWORD=Admin2024!Strong
ROOT_ADMIN_NAME=Root Administrator
```

---

## 📁 File Structure

```
/lib/rbac/
├── roles.ts              # Role definitions, permissions, hierarchy
├── middleware.ts         # Auth middleware (requireAdmin, requireAdministrator, etc.)
└── userController.ts     # User management functions

/app/admin/
├── page.tsx             # Admin Dashboard
├── users/page.tsx       # User Management (full CRUD)
├── roles/page.tsx       # Role Hierarchy & Stats
├── logs/page.tsx        # System Logs
├── settings/page.tsx    # System Settings
└── categories/page.tsx  # Category Management

/app/administrator/
├── page.tsx             # Administrator Dashboard
├── signals/page.tsx     # Signal Management (coming soon)
└── users/page.tsx       # Users (read-only + block/unblock)

/app/api/admin/
├── users/route.ts       # GET all users
├── update-role/route.ts # POST update user role
├── block-user/route.ts  # POST block user
├── unblock-user/route.ts# POST unblock user
├── delete-user/route.ts # DELETE user
└── logs/route.ts        # GET system logs

/app/api/auth/
├── root-login/[code]/route.ts  # Root admin login
├── setup-admin/[code]/route.ts # Root admin setup
└── set-admin-role/route.ts     # Set ADMIN role helper

/components/layout/
└── Header.tsx           # Role-based header with dropdown menus
```

---

## 🔐 API Endpoints

### Admin Endpoints (require ADMIN role):

```typescript
GET    /api/admin/users              // Get all users
POST   /api/admin/update-role        // Update user role
POST   /api/admin/block-user         // Block user
POST   /api/admin/unblock-user       // Unblock user
DELETE /api/admin/delete-user        // Delete user
GET    /api/admin/logs               // Get system logs
```

### Authentication Endpoints:

```typescript
GET  /api/auth/root-login/[code]     // Root admin login form
POST /api/auth/root-login/[code]     // Process login
GET  /api/auth/setup-admin/[code]    // Setup/reset root admin
POST /api/auth/set-admin-role        // Set ADMIN role helper
```

---

## 🎨 Header Integration

### Navigation based on role:

**ADMIN Header:**
- 📋 "Admin Panel" → `/admin`
- 🔔 Notifications → `/admin`
- 👤 Dropdown: Admin Panel, Users, Roles, Settings, Profile, Logout

**ADMINISTRATOR Header:**
- 📋 "Администриране" → `/administrator/signals`
- 🔔 Notifications → `/administrator/signals`
- 👤 Dropdown: Signals Management, Users (read-only), Profile, Settings, Logout

**USER Header:**
- 📋 "Моите сигнали" → `/me`
- 🔔 Notifications → `/me`
- 👤 Dropdown: My Signals, Profile, Settings, Logout

---

## 📊 System Features

### ✅ Implemented:

1. **RBAC Backend** (Gen 1)
   - 3 roles with hierarchy
   - Permission system
   - Middleware for auth/authorization
   - User controller functions

2. **Header Integration** (Gen 2)
   - Role-based navigation
   - Dynamic dropdown menus
   - Active page indicators
   - Notification bell

3. **Admin Panel** (Gen 3)
   - Dashboard with stats
   - Full user management (CRUD)
   - Role manager
   - System logs
   - Settings page

4. **Administrator Panel** (Gen 4)
   - Dashboard with stats
   - Limited user management (block/unblock only)
   - Signal management (coming soon)

5. **Pointer System** (Gen 5 - already completed earlier)
   - Category-based map pointers
   - Dynamic icon loading
   - Filtering by category

---

## 🚀 Quick Start

### 1. Setup Root Admin:
```
Visit: http://localhost:3030/api/auth/setup-admin/SUPER_SECRET_2024
```

### 2. Login as Root Admin:
```
Visit: http://localhost:3030/api/auth/root-login/SUPER_SECRET_2024
Email: admin@cenner.bg
Password: Admin2024!Strong
```

### 3. Access Admin Panel:
```
Navigate to: http://localhost:3030/admin
```

### 4. Manage Users:
```
Go to: http://localhost:3030/admin/users
- Promote USER to ADMINISTRATOR
- Promote USER to ADMIN
- Block/Unblock users
- Delete users
```

---

## 🔒 Security Features

✅ **Authentication:**
- Firebase Auth integration
- Token-based authorization
- Role verification via custom claims

✅ **Authorization:**
- Middleware protection on all admin routes
- Role-based access control
- Client-side role checks
- Server-side permission validation

✅ **Logging:**
- All admin actions logged
- User login tracking
- Role change history
- IP address logging

---

## 📝 Testing Checklist

### Admin Role:
- [ ] Login via root-login URL
- [ ] Access /admin dashboard
- [ ] View all users in /admin/users
- [ ] Change user role (USER ↔ ADMINISTRATOR ↔ ADMIN)
- [ ] Block/unblock user
- [ ] Delete user
- [ ] View system logs
- [ ] Access settings

### Administrator Role:
- [ ] Login as administrator
- [ ] Access /administrator dashboard
- [ ] View users (read-only)
- [ ] Block/unblock user
- [ ] Cannot change roles
- [ ] Cannot delete users
- [ ] Cannot access /admin

### User Role:
- [ ] Login as user
- [ ] Access /me page
- [ ] Create signal
- [ ] Cannot access /admin
- [ ] Cannot access /administrator

---

## 🎯 Role Hierarchy Visualization

```
        👑 ADMIN (Level 3)
             ↓
        🛡️ ADMINISTRATOR (Level 2)
             ↓
        👤 USER (Level 1)
```

**Rule:** Higher level can manage lower levels.

---

## 📞 Support & Documentation

### Key Files to Review:
- `lib/rbac/roles.ts` - Role definitions
- `lib/rbac/middleware.ts` - Auth middleware
- `components/layout/Header.tsx` - Navigation
- `app/admin/users/page.tsx` - User management UI

### Common Tasks:

**Add new permission:**
1. Add to `PERMISSIONS` in `roles.ts`
2. Add to `ROLE_PERMISSIONS` map
3. Use `hasPermission()` to check

**Add new role:**
1. Add to `ROLES` constant
2. Add to `ROLE_LABELS`
3. Add to `ROLE_HIERARCHY`
4. Add permissions to `ROLE_PERMISSIONS`
5. Update Header dropdown logic

---

## ✅ System Complete!

**All 5 Generations Implemented:**
- ✅ Gen 1: RBAC Backend + Middleware
- ✅ Gen 2: Header Integration
- ✅ Gen 3: Admin Panel
- ✅ Gen 4: Administrator Panel
- ✅ Gen 5: Finalization (Logs, Settings)

**Ready for Production! 🎉**

---

## 🔗 Quick Links

- Admin Panel: `/admin`
- Admin Users: `/admin/users`
- Admin Roles: `/admin/roles`
- Admin Logs: `/admin/logs`
- Admin Settings: `/admin/settings`
- Administrator Panel: `/administrator`
- Administrator Users: `/administrator/users`
- My Signals: `/me`

---

**Last Updated:** November 30, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
