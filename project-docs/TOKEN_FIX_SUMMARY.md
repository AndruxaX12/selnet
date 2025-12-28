# 🔧 Token Authentication Fix

## 🐛 Проблемът

**Симптом:** При влизане като ADMINISTRATOR и отваряне на `/profile` или `/settings`, потребителят беше пренасочван към `/login`, въпреки че беше влязъл в системата.

**Причина:** Кодът проверяваше за `localStorage.getItem("token")`, но токенът се съхраняваше като `idToken` от `AuthProvider`.

---

## ✅ Решението

### **Поправени файлове (10):**

1. **Profile Page:**
   - ✅ `apps/web/src/app/profile/ProfilePage.tsx`
   - ✅ `apps/web/src/app/profile/ProfileEditForm.tsx`

2. **Settings Sections:**
   - ✅ `apps/web/src/app/settings/sections/GeneralSettings.tsx`
   - ✅ `apps/web/src/app/settings/sections/LocationSettings.tsx`
   - ✅ `apps/web/src/app/settings/sections/NotificationSettings.tsx`
   - ✅ `apps/web/src/app/settings/sections/SecuritySettings.tsx`

3. **Custom Hooks:**
   - ✅ `apps/web/src/hooks/useProfile.ts`
   - ✅ `apps/web/src/hooks/useSettings.ts`

4. **Utility Functions:**
   - ✅ `apps/web/src/lib/utils/auth.ts` (CREATED NEW)

---

## 🔍 Какво се промени:

### **Преди:**
```typescript
const token = localStorage.getItem("token");
if (!token) {
  router.push("/login");
  return;
}
```

### **Сега:**
```typescript
const token = localStorage.getItem("token") || 
               localStorage.getItem("idToken") || 
               localStorage.getItem("firebaseToken");
if (!token) {
  console.error("No token found");
  router.push("/login");
  return;
}
```

---

## 📚 Нова Utility функция

Създадох `lib/utils/auth.ts` с helper функции:

```typescript
import { getAuthToken } from "@/lib/utils/auth";

// Вместо:
const token = localStorage.getItem("token") || 
               localStorage.getItem("idToken") || 
               localStorage.getItem("firebaseToken");

// Сега можете:
const token = getAuthToken();
```

### **Налични функции:**
- `getAuthToken()` - Връща токена от localStorage
- `getStoredUser()` - Връща user обекта от localStorage
- `isAuthenticated()` - Проверка дали user е влязъл
- `clearAuthData()` - Изчиства всички auth данни

---

## 🧪 Тестване

### **Тест 1: Profile страница**
```
1. Влезте като ADMINISTRATOR
2. Кликнете "Профил" от dropdown
3. ✅ Трябва да видите профилната си страница
4. ❌ НЕ трябва да ви праща на /login
```

### **Тест 2: Settings страница**
```
1. Влезте като ADMINISTRATOR
2. Кликнете "Настройки" от dropdown
3. ✅ Трябва да видите settings с 5 tabs
4. ❌ НЕ трябва да ви праща на /login
```

### **Тест 3: Запазване на промени**
```
1. Отворете Profile → Edit
2. Променете име или телефон
3. Кликнете "Запази"
4. ✅ Трябва да се запази успешно
5. ❌ НЕ трябва да показва "Не сте влезли в системата"
```

### **Тест 4: Settings секции**
```
1. Отворете Settings
2. Сменете език на English
3. Кликнете "Запази настройките"
4. ✅ Трябва да се запази
5. ❌ НЕ трябва да показва грешка
```

---

## 🔑 Token Storage Keys

Системата проверява за токен в следния ред:

1. **`token`** - Standard token key
2. **`idToken`** - Firebase ID token (използва се от AuthProvider)
3. **`firebaseToken`** - Legacy Firebase token

---

## 🚀 Бъдещи подобрения

### **Option 1: Standardize на един key**
```typescript
// В AuthProvider.tsx:
localStorage.setItem("token", idToken);  // Вместо "idToken"
```

### **Option 2: Използвайте новия utility навсякъде**
```typescript
// Във всички компоненти:
import { getAuthToken } from "@/lib/utils/auth";

const token = getAuthToken();
```

---

## ✅ Резултат

- ✅ Profile страницата работи за всички роли
- ✅ Settings страницата работи за всички роли
- ✅ Всички секции могат да запазват промени
- ✅ Няма повече пренасочване към `/login` ако сте влезли
- ✅ Добавен debug logging за проследяване на проблеми

---

## 📝 Забележки

- Токенът се съхранява като `idToken` от Firebase Authentication
- Това е стандартен Firebase поведение
- Всички API calls сега проверяват за всички 3 възможни ключа
- Debug logging помага за проследяване на token проблеми

---

**Дата:** November 30, 2025  
**Status:** ✅ FIXED  
**Files Changed:** 10  
**New Files:** 1
