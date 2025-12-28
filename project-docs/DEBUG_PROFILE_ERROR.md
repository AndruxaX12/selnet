# 🐛 Debug Profile Update 500 Error

## ❌ Грешката

```
Failed to update profile
api/profile/update: 500 (Internal Server Error)
```

---

## 🔍 Стъпки за диагностика

### **Стъпка 1: Проверете Firebase конфигурацията**

Отворете терминал и изпълнете:
```bash
# Windows PowerShell
$env:FIREBASE_PROJECT_ID
$env:FIREBASE_CLIENT_EMAIL
$env:FIREBASE_PRIVATE_KEY
```

**Очаквани стойности:**
- `FIREBASE_PROJECT_ID` = `selnet-ab187` (или вашият project ID)
- `FIREBASE_CLIENT_EMAIL` = `firebase-adminsdk-xxxxx@selnet-ab187.iam.gserviceaccount.com`
- `FIREBASE_PRIVATE_KEY` = `-----BEGIN PRIVATE KEY-----\n...`

**Ако някоя липсва:**
1. Отворете `.env.local` във корена на проекта
2. Добавете липсващите променливи

---

### **Стъпка 2: Тествайте Firebase Admin SDK**

Отворете браузър:
```
http://localhost:3030/api/test-firebase
```

**Очаквани резултати:**
```json
{
  "env": {
    "hasProjectId": true,
    "hasClientEmail": true,
    "hasPrivateKey": true
  },
  "tests": {
    "auth": { "initialized": true },
    "firestore": { "initialized": true },
    "listUsers": { "success": true },
    "firestoreRead": { "success": true }
  }
}
```

**Ако някой тест е `false` или има грешка:**
- Проверете Firebase credentials в `.env.local`
- Презаредете сървъра: `Ctrl+C` → `npm run dev`

---

### **Стъпка 3: Проверете Console логовете**

След като опитате да запазите профила, проверете:

**Server Console (Terminal):**
```
🔄 Update profile for user: xxx
📥 Request body: { displayName: "...", ... }
🔐 Updating Firebase Auth with: ...
✅ Firebase Auth updated successfully
📝 Updating Firestore with: ...
✅ Firestore updated successfully
```

**Browser Console (F12):**
```
📤 Sending profile update: { displayName: "...", ... }
📥 Response status: 200
```

**Ако виждате грешка:**
- Копирайте пълното съобщение
- Потърсете я в документацията по-долу

---

## 🔧 Често срещани проблеми

### **Проблем 1: Missing Firebase Credentials**

**Грешка:**
```
Auth update failed: Error: The default Firebase app does not exist
```

**Решение:**
1. Създайте `.env.local` във корена на проекта:
```env
FIREBASE_PROJECT_ID=selnet-ab187
FIREBASE_CLIENT_EMAIL=your-service-account@selnet-ab187.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

2. Рестартирайте сървъра:
```bash
# Спрете сървъра: Ctrl+C
# Стартирайте отново:
npm run dev
```

---

### **Проблем 2: Invalid Token**

**Грешка:**
```
Auth update failed: Firebase ID token has expired
```

**Решение:**
1. Logout от приложението
2. Login отново
3. Опитайте пак

---

### **Проблем 3: Permission Denied**

**Грешка:**
```
Firestore update failed: Missing or insufficient permissions
```

**Решение:**
1. Отворете Firebase Console
2. Firestore Database → Rules
3. Добавете правило:
```javascript
match /users/{userId} {
  allow read, write: if request.auth != null;
}
```

---

### **Проблем 4: Invalid Phone Number**

**Грешка:**
```
Auth update failed: The phone number must be a non-empty E.164 standard compliant identifier
```

**Решение:**
Телефонният номер трябва да е в E.164 формат:
- ✅ Правилно: `+359888123456`
- ❌ Грешно: `0888 123 456`
- ❌ Грешно: `+359 888 123 456`

Поправка в кода - позволете празен телефон:
```typescript
// В ProfileEditForm.tsx
phoneNumber: profile.phoneNumber || "",  // Празен string вместо null
```

---

### **Проблем 5: Base64 Image Too Large**

**Грешка:**
```
Firestore update failed: Value exceeds maximum size
```

**Решение:**
Base64 снимките са твърде големи за Firestore.

**Временна поправка:**
1. Ограничете размера на снимката до 1MB
2. Компресирайте снимката преди upload

**Постоянна поправка:**
Използвайте Firebase Storage:
```typescript
// В ProfileEditForm.tsx (бъдеща версия)
const uploadPhoto = async (file: File) => {
  const storageRef = ref(storage, `profile-photos/${userId}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};
```

---

## 📋 Checklist за debugging

Проверете всяка точка преди да отворите issue:

- [ ] `.env.local` файлът съществува
- [ ] `FIREBASE_PROJECT_ID` е зададен
- [ ] `FIREBASE_CLIENT_EMAIL` е зададен
- [ ] `FIREBASE_PRIVATE_KEY` е зададен (с `\n` за нови редове)
- [ ] Сървърът е рестартиран след промяна на `.env.local`
- [ ] `/api/test-firebase` връща всички тестове като успешни
- [ ] Токенът е валиден (logout → login)
- [ ] Телефонният номер е празен или в E.164 формат
- [ ] Снимката е под 1MB (ако се качва)

---

## 🆘 Ако нищо не помага

### **Събиране на debug информация:**

1. **Server logs:**
```bash
# Копирайте всички логове от терминала
# Потърсете редове започващи с 🔄 📥 🔐 📝 ❌
```

2. **Browser console:**
```javascript
// Отворете Console (F12) и изпълнете:
console.log('user:', localStorage.getItem('user'));
console.log('token:', localStorage.getItem('idToken')?.substring(0, 50) + '...');

// След опит за запазване, копирайте всички грешки
```

3. **Test Firebase endpoint:**
```
http://localhost:3030/api/test-firebase
```

Копирайте целия JSON отговор.

---

## ✅ След поправка

Когато всичко работи, трябва да видите:

**Server Console:**
```
🔄 Update profile for user: xxx
✅ Firebase Auth updated successfully
✅ Firestore updated successfully
```

**Browser:**
```
✅ Профилът беше актуализиран успешно!
```

**В Firestore:**
- Документът в `users/{userId}` трябва да има новите данни
- `updatedAt` трябва да е обновен

---

## 📚 Полезни ресурси

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Auth updateUser](https://firebase.google.com/docs/auth/admin/manage-users#update_a_user)

---

**Дата:** November 30, 2025  
**Version:** 1.0.0
