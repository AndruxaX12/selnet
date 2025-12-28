# RBAC Интеграция — Генериране 1/3 ✅

## Какво е създадено

### 1. Policy Map & RBAC Helpers
- ✅ `lib/auth/policies.ts` — пълна матрица роли × действия
- ✅ `lib/auth/rbac.ts` — server-side guards (requireAuth, requireRole, requirePermission)
- ✅ Policy map с 40+ действия за всички роли

### 2. UI Gating Компоненти
- ✅ `components/auth/Require.tsx` — client component за условно рендериране
- ✅ `components/guards/ProtectedRoute.tsx` — route protection wrapper
- ✅ `hooks/useAbilities.ts` — hook за проверка на права в client компоненти
- ✅ API endpoint `/api/me/abilities` за кеширане на abilities (5 мин)

### 3. Auth & Onboarding Страници
- ✅ `/auth/verify` — OTP верификация (6 цифри, resend таймер)
- ✅ `/auth/consent` — управление на съгласия (GDPR)
- ✅ `/onboarding` — 3-стъпков flow (райони, интереси, канали)

### 4. Публични Списъци
- ✅ `/signals` — grid с филтри, сортиране, role-based CTA
- ✅ `/ideas` — подкрепа (support) само за citizen+
- ✅ `/events` — RSVP само за citizen+, tabs предстоящи/минали

### 5. Ролеви Панели
- ✅ `/admin/roles` — управление на потребителски роли
- ✅ `/admin/invites` — изпращане и управление на покани
- ✅ `/ombudsman` — жалби и отговори
- ✅ `/operator/signals` — dashboard с SLA, статусни преходи

### 6. Защитени Layouts
- ✅ `admin/layout.tsx` — sidebar навигация за admin
- ✅ `operator/layout.tsx` — sidebar за operator
- ✅ `ombudsman/layout.tsx` — sidebar за ombudsman
- Всички с SSR guard проверка

### 7. API Routes
**Auth:**
- ✅ `POST /api/auth/verify` — OTP verification
- ✅ `POST /api/auth/verify/resend` — resend OTP

**Abilities:**
- ✅ `GET /api/me/abilities` — текущи роли и abilities

**Admin:**
- ✅ `GET /api/admin/users` — списък потребители
- ✅ `POST /api/admin/users/[userId]/roles` — assign/revoke роли
- ✅ `GET/POST /api/admin/invites` — покани
- ✅ `DELETE /api/admin/invites/[inviteId]` — отмени покана

**Operator:**
- ✅ `GET /api/operator/signals` — филтрирани сигнали
- ✅ `GET /api/operator/stats` — dashboard статистики
- ✅ `POST /api/signals/[signalId]/verify` — потвърди сигнал
- ✅ `POST /api/signals/[signalId]/transition` — промени статус

**Ombudsman:**
- ✅ `GET /api/ombudsman/complaints` — жалби
- ✅ `POST /api/ombudsman/complaints/[complaintId]/respond` — отговори

**Actions:**
- ✅ `POST /api/ideas/[ideaId]/support` — подкрепа на идея
- ✅ `POST /api/events/[eventId]/rsvp` — RSVP за събитие

**User:**
- ✅ `GET/POST /api/users/[userId]/consents` — съгласия
- ✅ `POST /api/users/[userId]/onboarding` — onboarding data

### 8. Error Страници
- ✅ `/error/401` — Неоторизиран достъп (с CTA за login)
- ✅ `/error/403` — Забранен достъп (с обяснение)

## Policy Map Матрица

| Действие | guest | citizen | moderator | operator | ombudsman | admin |
|----------|-------|---------|-----------|----------|-----------|-------|
| Преглед списъци | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Създай сигнал | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Създай идея | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Подкрепи идея | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| RSVP събитие | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Модерация | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Промени статус сигнал | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Омбудсман панел | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Управление роли | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## Security Features

### Двойна защита (server + client)
1. **Server-side**: всички API routes с `apiRequireRole()` или `apiRequirePermission()`
2. **Client-side**: UI gating с `<Require>` компонент и `useAbilities()` hook

### Rate Limiting
- OTP: 6 опита, след това 15 мин lock
- Валидност OTP: 10 мин
- Resend: 60 sec cooldown

### Audit Trail
- Всички role changes логват в `audit_logs` collection
- Signal transitions логват в `signal_history`
- Complaint responses логват в `complaint_responses`

## Текстове (Български)

Всички UI текстове са на български:
- "Провери пощата си"
- "Нов сигнал" / "Подкрепи" / "RSVP"
- "Нямаш права за този раздел (403)"
- "Влез, за да подкрепиш идеята"
- Формат дата/час: DD.MM.YYYY, HH:mm (Europe/Sofia)

## Следващи стъпки (Генериране 2/3)

1. **Създаване на форми:**
   - `/signals/new` — формуляр за нов сигнал
   - `/ideas/new` — формуляр за нова идея
   - `/events/new` — формуляр за ново събитие

2. **Детайлни страници:**
   - `/signals/[id]` — пълна информация за сигнал
   - `/ideas/[id]` — пълна информация за идея
   - `/events/[id]` — пълна информация за събитие

3. **Профил и настройки:**
   - `/me` — потребителски профил (upgrade от съществуващ)
   - `/me/settings` — настройки

4. **Допълнителни функции:**
   - Email/SMS известия
   - Push notifications
   - Real-time updates

## Acceptance Criteria ✅

- [x] Гост вижда списъци, но CTA са скрити/водят към login
- [x] Citizen вижда CTA "Нов сигнал/идея" и може да подкрепя
- [x] `/operator/*` достъпен само за operator+admin
- [x] `/ombudsman` достъпен само за ombudsman+admin
- [x] `/admin/*` достъпен само за admin
- [x] Server-side блокира неоторизирани API calls (403)
- [x] `/me/abilities` кешира abilities (5 мин)
- [x] Всички текстове на български

## Файлова структура

```
apps/web/src/
├── lib/auth/
│   ├── policies.ts          # Policy map & role helpers
│   └── rbac.ts              # Server-side guards
├── components/
│   ├── auth/
│   │   └── Require.tsx      # UI gating component
│   └── guards/
│       └── ProtectedRoute.tsx
├── hooks/
│   └── useAbilities.ts      # Client abilities hook
├── app/
│   ├── auth/
│   │   ├── verify/          # OTP verification
│   │   └── consent/         # GDPR consents
│   ├── onboarding/          # 3-step flow
│   ├── signals/             # Public list
│   ├── ideas/               # Public list
│   ├── events/              # Public list
│   ├── admin/
│   │   ├── layout.tsx       # Protected admin layout
│   │   ├── roles/           # User role management
│   │   └── invites/         # Invite management
│   ├── operator/
│   │   ├── layout.tsx       # Protected operator layout
│   │   └── signals/         # Operator dashboard
│   ├── ombudsman/
│   │   ├── layout.tsx       # Protected ombudsman layout
│   │   └── page.tsx         # Complaints panel
│   ├── error/
│   │   ├── 401/             # Unauthorized page
│   │   └── 403/             # Forbidden page
│   └── api/
│       ├── auth/verify/
│       ├── me/abilities/
│       ├── admin/
│       ├── operator/
│       └── ombudsman/
```

---

**Общ брой създадени файлове:** 50+  
**Общо редове код:** ~5,000+  
**Всички текстове:** Български (bg-BG)  
**Часова зона:** Europe/Sofia
