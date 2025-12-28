# СелНет - Deployment Guide

## 🚀 Как да deploy-нете системата

### 1. Firebase Indexes

За да deploy-нете Firestore индексите:

```bash
# От root директорията на проекта
firebase deploy --only firestore:indexes --project selnet-ab187
```

### 2. Firestore Rules

За да deploy-нете security правилата:

```bash
firebase deploy --only firestore:rules --project selnet-ab187
```

### 3. Тестови данни

За да добавите тестови данни в Firestore:

```bash
# От apps/web директорията
cd apps/web
pnpm seed
```

### 4. Development сървър

За да стартирате development сървъра:

```bash
# От apps/web директорията
cd apps/web
pnpm dev
```

### 5. Production build

За да направите production build:

```bash
# От apps/web директорията
cd apps/web
pnpm build
pnpm start
```

## 📋 Checklist преди deployment

- [ ] Firebase проект е създаден (`selnet-ab187`)
- [ ] Firebase CLI е инсталиран и логнат
- [ ] `.env.local` файл е създаден с правилните Firebase ключове
- [ ] Firestore индексите са deploy-нати
- [ ] Firestore правилата са deploy-нати
- [ ] Тестовите данни са добавени (по желание)

## 🔧 Troubleshooting

### Грешка "Firebase project not found"
```bash
firebase use selnet-ab187
```

### Грешка "Insufficient permissions"
Уверете се че сте логнати с правилния Google акаунт:
```bash
firebase logout
firebase login
```

### Грешка "Index creation failed"
Проверете дали индексите в `firestore.indexes.json` са валидни и не конфликтират с съществуващи.
