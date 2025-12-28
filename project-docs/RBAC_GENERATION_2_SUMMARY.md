# RBAC Интеграция — Генериране 2/3 ✅

## Какво е създадено в Генериране 2

### 1. Форми за Създаване на Съдържание

#### `/signals/new` — Форма за нов сигнал
- ✅ Пълна форма с валидация
- ✅ Полета: заглавие, описание, категория, район, адрес, GPS координати
- ✅ Upload на снимка (макс 5MB)
- ✅ Preview на снимка преди изпращане
- ✅ Валидация: мин. 10 символа заглавие, 20 символа описание
- ✅ Защита: `requirePermission("create:signal")`

#### `/ideas/new` — Форма за нова идея
- ✅ Пълна форма с валидация
- ✅ Полета: заглавие, резюме, описание, категория
- ✅ Допълнителни полета: очакван ефект, цена, срок
- ✅ Валидация: мин. 10 символа заглавие, 20 символа резюме, 50 символа описание
- ✅ Защита: `requirePermission("create:idea")`

#### `/events/new` — Форма за ново събитие
- ✅ Пълна форма с валидация
- ✅ Полета: заглавие, описание, локация, начало/край (дата+час)
- ✅ Опции: макс. брой участници, корица (cover image)
- ✅ Upload на корица (макс 5MB)
- ✅ Валидация: мин. 10 символа заглавие, 20 символа описание
- ✅ Защита: `requirePermission("create:event")`

### 2. API Routes за Създаване

#### `POST /api/signals`
```typescript
{
  title: string;
  description: string;
  category: string;
  district: string;
  address: string;
  latitude?: string;
  longitude?: string;
  image_url?: string;
}
→ 201 { signal: { id, ...data } }
→ 400 "Задължителните полета липсват"
→ 401/403 (RBAC guard)
```

#### `POST /api/ideas`
```typescript
{
  title: string;
  summary: string;
  description: string;
  category: string;
  expected_impact?: string;
  estimated_cost?: string;
  timeline?: string;
}
→ 201 { idea: { id, ...data } }
→ 400 "Задължителните полета липсват"
→ 401/403 (RBAC guard)
```

#### `POST /api/events`
```typescript
{
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date?: string;
  max_participants?: number;
  cover_image?: string;
}
→ 201 { event: { id, ...data } }
→ 400 "Задължителните полета липсват"
→ 401/403 (RBAC guard)
```

#### `POST /api/upload`
```typescript
FormData: { file: File }
→ 200 { url, filename, size, type }
→ 400 "Файлът е твърде голям (макс 5MB)"
→ 400 "Позволени са само изображения"
→ 401 (auth required)
```

### 3. UI Компоненти

#### Създадени компоненти
- ✅ `Label` — label за форми
- ✅ `Textarea` — textarea за описания
- ✅ `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` — tabs компонент

#### Използвани компоненти (от предишно генериране)
- Button, Input, Card, Badge, Checkbox

### 4. Категории и Константи

#### Категории за Сигнали
```typescript
[
  "Чистота",
  "Паркове и зелени площи",
  "Пътища и тротоари",
  "Улично осветление",
  "Транспорт",
  "Шум",
  "Паркиране",
  "Инфраструктура",
  "Друго",
]
```

#### Категории за Идеи
```typescript
[
  "Околна среда",
  "Транспорт",
  "Култура",
  "Спорт",
  "Образование",
  "Социални услуги",
  "Инфраструктура",
  "Дигитализация",
  "Друго",
]
```

#### Райони на София
```typescript
[
  "Витоша", "Връбница", "Изгрев", "Илинден", "Красна поляна",
  "Красно село", "Кремиковци", "Лозенец", "Люлин", "Младост",
  "Надежда", "Нови Искър", "Овча купел", "Панчарево", "Подуяне",
  "Сердика", "Слатина", "Средец", "Студентски", "Триадица",
]
```

## Validation Rules

### Signal Form
- **title**: задължително, мин. 10 символа
- **description**: задължително, мин. 20 символа
- **category**: задължително
- **district**: задължително
- **address**: задължително
- **image**: опционално, макс 5MB, само изображения

### Idea Form
- **title**: задължително, мин. 10 символа
- **summary**: задължително, мин. 20 символа
- **description**: задължително, мин. 50 символа
- **category**: задължително
- **expected_impact**, **estimated_cost**, **timeline**: опционални

### Event Form
- **title**: задължително, мин. 10 символа
- **description**: задължително, мин. 20 символа
- **location**: задължително
- **start_date** + **start_time**: задължителни
- **end_date** + **end_time**: опционални
- **max_participants**: опционално
- **cover_image**: опционално, макс 5MB, само изображения

## Security Features

### Form Protection
- Server-side guards: `requirePermission("create:signal")` и т.н.
- API guards: `apiRequirePermission("create:signal")` и т.н.
- File upload: auth required, size check, type check

### Data Validation
- Client-side: React state + валидация преди submit
- Server-side: validation на задължителни полета, type checking
- XSS protection: Firestore автоматично escaped strings

### Rate Limiting
- TODO: Добавяне на rate limiting за създаване (напр. max 10 сигнала/ден per user)

## User Flow

### Създаване на Сигнал
1. User влиза в `/signals` → кликва "Нов сигнал"
2. Guard проверява `can("create:signal")` → ако е guest редирект към `/auth/login`
3. User попълва форма → избира снимка (optional)
4. Client validation → ако успешна → upload снимка към `/api/upload`
5. Submit към `POST /api/signals` с image_url
6. API guard проверява permissions
7. Създава signal в Firestore
8. Redirect към `/signals/{id}` (TBD в Генериране 3)

### Създаване на Идея
1. User влиза в `/ideas` → кликва "Нова идея"
2. Guard проверява `can("create:idea")`
3. User попълва форма (заглавие, резюме, описание, категория, optional полета)
4. Client validation → Submit към `POST /api/ideas`
5. API guard проверява permissions
6. Създава idea в Firestore
7. Redirect към `/ideas/{id}` (TBD)

### Създаване на Събитие
1. User влиза в `/events` → кликва "Ново събитие"
2. Guard проверява `can("create:event")`
3. User попълва форма (заглавие, описание, локация, дати, optional корица)
4. Client validation → upload cover image (optional)
5. Submit към `POST /api/events`
6. API guard проверява permissions
7. Създава event в Firestore
8. Redirect към `/events/{id}` (TBD)

## Firestore Collections Structure

### `signals` collection
```typescript
{
  title: string;
  description: string;
  category: string;
  district: string;
  address: string;
  location: {
    address: string;
    lat: number | null;
    lng: number | null;
  };
  status: "new" | "in_progress" | "resolved" | "rejected";
  priority: "low" | "normal" | "high" | "urgent";
  author_id: string;
  author_email: string;
  photos: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
  comments_count: number;
  votes_support: number;
  watchers: number;
}
```

### `ideas` collection
```typescript
{
  title: string;
  summary: string;
  description: string;
  category: string;
  expected_impact: string | null;
  estimated_cost: string | null;
  timeline: string | null;
  status: "draft" | "open" | "in_review" | "approved" | "rejected" | "implemented";
  author_id: string;
  author: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  supporters: number;
  comments_count: number;
}
```

### `events` collection
```typescript
{
  title: string;
  description: string;
  location: string;
  start_date: Timestamp;
  end_date: Timestamp | null;
  max_participants: number | null;
  cover_image: string | null;
  organizer_id: string;
  organizer_name: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  rsvp_count: number;
  is_past: boolean;
}
```

## Следващи стъпки (Генериране 3/3)

1. **Детайлни страници:**
   - `/signals/[id]` — пълна информация за сигнал с коментари
   - `/ideas/[id]` — пълна информация за идея с подкрепа и коментари
   - `/events/[id]` — пълна информация за събитие с RSVP и коментари

2. **Коментари система:**
   - Компонент `CommentsList` + `CommentForm`
   - API `GET/POST /api/{type}/{id}/comments`
   - Nested коментари (replies)
   - Report/moderate функции

3. **Профил страници:**
   - `/me` — upgrade с табове (профил, активност, настройки)
   - `/me/settings` — редакция на профил, смяна на парола
   - `/users/[id]` — публичен профил

4. **Взаимодействия:**
   - Follow/unfollow сигнал
   - Vote up/down
   - Share функции

5. **Notifications:**
   - Email/SMS известия при коментар/промяна на статус
   - Push notifications
   - In-app notifications feed

## Файлова структура (ново)

```
apps/web/src/
├── app/
│   ├── signals/new/
│   │   ├── page.tsx             # SSR page с requirePermission guard
│   │   └── signal-form.tsx      # Client form с валидация
│   ├── ideas/new/
│   │   ├── page.tsx
│   │   └── idea-form.tsx
│   ├── events/new/
│   │   ├── page.tsx
│   │   └── event-form.tsx
│   └── api/
│       ├── signals/route.ts     # GET + POST методи
│       ├── ideas/route.ts       # GET + POST методи
│       ├── events/route.ts      # GET + POST методи
│       └── upload/route.ts      # POST за file upload
└── components/ui/
    ├── label.tsx                # NEW
    ├── textarea.tsx             # NEW
    └── tabs.tsx                 # NEW
```

---

**Общ брой нови файлове:** 13  
**Общо нови редове код:** ~2,500  
**Всички текстове:** Български (bg-BG)  
**Часова зона:** Europe/Sofia
