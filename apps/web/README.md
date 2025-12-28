# СелНет - Настройка

## 🔧 Конфигуриране на Firebase

За да работи приложението правилно, трябва да настроите Firebase конфигурацията:

### 1. Създайте Firebase проект
1. Отидете в [Firebase Console](https://console.firebase.google.com/)
2. Създайте нов проект или изберете съществуващ
3. Включете Authentication и Firestore

### 2. Вземете конфигурационните данни
1. Отидете в Project Settings (иконката на зъбчето)
2. Превъртете надолу до "Your apps"
3. Кликнете върху "Web" или "Add app" ако няма
4. Копирайте конфигурационните стойности

### 3. Настройте environment променливите

Създайте файл `.env.local` в папката `apps/web/` със следното съдържание:

```bash
# Заменете с вашите реални стойности от Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Firestore Security Rules

Добавете следните правила в Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Public read access for signals, events, ideas
    match /signals/{signalId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /ideas/{ideaId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Allow anonymous signal creation
    match /signals/{signalId} {
      allow create: if true;
    }
  }
}
```

### 5. Authentication Providers

В Authentication > Sign-in method включете:
- Email/Password
- Google (опционално)
- Apple (опционално)

## 🚀 Стартиране на приложението

```bash
cd apps/web
npm install
npm run dev
```

## 📱 PWA и Offline функционалност

Приложението работи офлайн и като Progressive Web App. За да тествате:

1. Отворете в браузър
2. Кликнете върху иконката за инсталиране (ако се появи)
3. Или отворете DevTools > Application > Service Workers

## 🐛 Чести проблеми

### Проблем: "Firebase не е конфигуриран"
**Решение**: Проверете дали сте създали `.env.local` файла с правилните стойности

### Проблем: Не се показват данни
**Решение**: Проверете Firestore security rules и дали проектът е правилно конфигуриран

### Проблем: Грешка при вход
**Решение**: Проверете Authentication настройките във Firebase Console

## 📞 Поддръжка

Ако имате проблеми, проверете:
1. Конзолата на браузъра за грешки
2. Firebase Console за грешки
3. Мрежовите заявки в DevTools

---

**Забележка**: Не публикувайте реалните Firebase ключове в публични хранилища!
