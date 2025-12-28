# 🚀 Операторски Модул за Сигнали - Пълна Документация

## 📋 Съдържание

1. [Общ преглед](#общ-преглед)
2. [Архитектура](#архитектура)
3. [Навигация и екрани](#навигация-и-екрани)
4. [Компоненти](#компоненти)
5. [API Endpoints](#api-endpoints)
6. [SLA Логика](#sla-логика)
7. [Тестване](#тестване)
8. [Deployment](#deployment)

---

## 📊 Общ преглед

Операторският модул за управление на сигнали е comprehensive система за обработка на граждански сигнали с пълен lifecycle management, SLA tracking и reporting capabilities.

### ✨ Основни Features

- ✅ **Dashboard** с KPI метрики в real-time
- ✅ **Inbox опашки** с 6 таба и advanced filtering
- ✅ **Signal detail** с timeline, notes, work orders
- ✅ **Reports система** със SLA analytics и export
- ✅ **Map view** (placeholder за Mapbox integration)
- ✅ **Settings** за admin конфигурация
- ✅ **SLA tracking** със статусни индикатори
- ✅ **Bulk actions** за масови операции
- ✅ **Optimistic UI** с ETag concurrency control

### 🎯 Роли и Права

| Роля | Dashboard | Inbox | Detail | Reports | Settings | Map |
|------|-----------|-------|--------|---------|----------|-----|
| **operator** | ✅ Read | ✅ Read/Write | ✅ Read/Write | ✅ Read | ❌ | ✅ |
| **admin** | ✅ Read | ✅ Read/Write | ✅ Read/Write | ✅ Read | ✅ Full | ✅ |
| **ombudsman** | ✅ Read | ✅ Read (complaints) | ✅ Read | ✅ Read | ❌ | ✅ |

---

## 🏗️ Архитектура

### Структура на файлове

```
apps/web/src/
├── app/[locale]/operator/
│   ├── layout.tsx                    # Operator layout с RBAC
│   ├── page.tsx                      # Dashboard (Gen 1)
│   ├── inbox/
│   │   └── page.tsx                  # Inbox опашки (Gen 2)
│   ├── signals/[id]/
│   │   └── page.tsx                  # Signal detail (Gen 3)
│   ├── reports/
│   │   └── page.tsx                  # Reports (Gen 4)
│   ├── map/
│   │   └── page.tsx                  # Map view (Gen 5)
│   └── settings/
│       └── page.tsx                  # Settings (Gen 5)
│
├── components/operator/
│   ├── dashboard/
│   │   ├── KPIDashboard.tsx
│   │   ├── KPIStatCard.tsx
│   │   ├── DualLineChart.tsx
│   │   ├── CategoryTrendList.tsx
│   │   └── RecentEscalations.tsx
│   │
│   ├── inbox/
│   │   ├── SignalRow.tsx
│   │   ├── SLAChip.tsx
│   │   ├── FiltersSidebar.tsx
│   │   ├── SortDropdown.tsx
│   │   └── BulkActionBar.tsx
│   │
│   ├── detail/
│   │   ├── SignalHeader.tsx
│   │   ├── MediaGallery.tsx
│   │   ├── Timeline.tsx
│   │   ├── NotesPanel.tsx
│   │   ├── WorkOrdersPanel.tsx
│   │   ├── MetadataCard.tsx
│   │   ├── SLAProgress.tsx
│   │   └── ConflictModal.tsx
│   │
│   └── reports/
│       ├── SLAReportTable.tsx
│       ├── VolumeReport.tsx
│       ├── TrendChart.tsx
│       └── ExportButtons.tsx
│
├── app/api/operator/
│   ├── dashboard/route.ts            # Dashboard API
│   ├── signals/route.ts              # Signals list API
│   ├── signals/[id]/route.ts         # Signal detail API
│   ├── signals/[id]/status/route.ts  # Status transitions
│   ├── signals/[id]/notes/route.ts   # Notes API
│   └── reports/route.ts              # Reports API
│
├── types/operator.ts                 # TypeScript типове
└── lib/operator/
    ├── constants.ts                  # Константи и labels
    └── sla-utils.ts                  # SLA изчисления
```

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Auth**: Firebase Authentication + Custom Claims RBAC
- **Database**: Firestore (backend)
- **State**: React useState/useEffect (no external state management)

---

## 🗺️ Навигация и Екрани

### 1. Dashboard (`/operator`)

**Purpose**: Overview на ключови метрики

**Features**:
- 6 KPI карти (нови, потвърдени ≤48ч, просрочени TTA, в процес, поправени, медиана TTR)
- Dual-line chart (вход срещу обработени)
- Топ категории/райони с trend indicators
- Последни ескалации
- Period toggle (Днес/7 дни/30 дни)

**API**: `GET /api/operator/dashboard?period={today|7days|30days}`

---

### 2. Inbox (`/operator/inbox`)

**Purpose**: Управление на опашки от сигнали

**Features**:
- **6 Таба**:
  1. Нови (novo)
  2. За потвърждение
  3. В процес (v_proces)
  4. Просрочени (SLA violations)
  5. Ескалации/Жалби (has_complaint)
  6. Зададени на мен (owner=me)
- **Filters Sidebar**:
  - Статус (multi-select)
  - Приоритет
  - Жалба/Дубликат toggles
- **Search** (full-text)
- **Sort** (5 опции: SLA urgent, oldest, newest, priority, nearest)
- **Bulk actions** (Потвърди, В процес, Възложи, Линквай дубликат)
- **Infinite scroll** с pagination

**SignalRow Components**:
- Status badge
- SLA chip (TTA/Process deadline) със цветове
- Category, address, description
- Metadata (коментари, снимки, гледания, owner, отдел)
- Icons (priority ⭐, duplicate ∞, complaint ⚖)
- Quick actions (Потвърди, В процес, Поправен, Отклони)
- Checkbox за bulk selection

**API**: `GET /api/operator/signals?tab=&q=&status=&sort=&cursor=&limit=`

---

### 3. Signal Detail (`/operator/signals/[id]`)

**Purpose**: Детайлна информация и управление на отделен сигнал

**Features**:
- **Header**:
  - Заглавие, адрес, статус badge
  - SLA chips (TTA, Process deadline)
  - Metadata row (created, owner, department, ID)
  - Action buttons (динамични според статуса)
    - Ново → Потвърди, Отклони
    - Потвърден → В процес, Отклони
    - В процес → Поправен, Отклони
    - Поправен → Архив
  - Reject modal със задължителна причина

- **Left Column (Main Content)**:
  - **MediaGallery**: 2/3/4 col grid, upload (до 10), lightbox при клик
  - **Timeline**: вертикална хронология със събития:
    - Status change (сини)
    - Note added (лилави)
    - Assigned (зелени)
    - Work order (оранжеви)
    - Escalation (червени)
  - **NotesPanel**: табове за публични/вътрешни бележки
    - Info banner за visibility
    - Notes list със author и timestamp
    - Textarea за нова бележка
  - **WorkOrdersPanel**: work orders list
    - Status badges (open/assigned/in_progress/done/verified/rework)
    - Due date с overdue highlighting
    - Create modal (priority, due date, notes)

- **Right Column (Sidebar)**:
  - **MetadataCard**: подател, категория, приоритет, адрес, координати, статистики
  - **SLAProgress**: progress bars за TTA/Process с countdown

- **Optimistic UI**:
  - Status transitions update instant
  - ETag checking за concurrency
  - Conflict modal при 412 error

**APIs**:
- `GET /api/operator/signals/{id}` - detail с ETag
- `PATCH /api/operator/signals/{id}/status` - статусни промени с If-Match
- `POST /api/operator/signals/{id}/notes` - добавяне на бележка

---

### 4. Reports (`/operator/reports`)

**Purpose**: SLA analytics и volume reports

**Features**:
- **Filters**:
  - Date range (от/до)
  - Grouping (day/week/month)
  - Generate button

- **SLA Report Table**:
  - 3 метрики (TTA ≤48ч, Process ≤5д, TTR медиана)
  - Status badges (OK/Внимание/Критично)
  - Summary cards (изпълнени SLA, просрочени TTA, средно TTR)

- **Trend Chart**:
  - Stacked bars (нови/потвърдени/в процес/решени)
  - Y-axis scaling
  - Hover tooltips
  - Summary stats

- **Volume Reports** (2 карти):
  - По категория (ranked list с progress bars)
  - По район

- **Export**:
  - CSV format
  - JSON format
  - Auto-generated filenames със дата

**API**: `GET /api/operator/reports?from=&to=&group={day|week|month}`

---

### 5. Map (`/operator/map`)

**Purpose**: Географска визуализация на сигнали

**Status**: Placeholder (Coming Soon)

**Planned Features**:
- Cluster view за групиране на близки сигнали
- Heatmap за density visualization
- Viewport filtering
- Drawing tools (polygon/circle selection)
- Marker popovers със quick actions

**Future Integration**: Mapbox GL JS или Leaflet

---

### 6. Settings (`/operator/settings`)

**Purpose**: Admin конфигурация

**Access**: Само admin роля

**Features**:
- **Шаблони за съобщения**:
  - Потвърждение
  - Process update
  - Resolution
  - Rejection
  - Variables: {title}, {address}, {case_id}, {deadline}, {reason}

- **Причини за отклоняване**:
  - CRUD операции
  - Активни/Неактивни състояния

**Future**:
- Business hours configuration
- SLA overrides per category
- Audit log viewer

---

## 🧩 Компоненти

### Dashboard Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `KPIDashboard` | Container за всички dashboard widgets | `data`, `period` |
| `KPIStatCard` | Единична KPI карта | `title`, `value`, `icon`, `color`, `badge`, `trend` |
| `DualLineChart` | Chart вход/обработени | `data: {date, new, processed}[]` |
| `CategoryTrendList` | Топ категории с progress bars | `categories: {id, name, count, pct, change}[]` |
| `RecentEscalations` | Списък с последни ескалации | `escalations: {id, signal_id, title, created_at}[]` |

### Inbox Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `SignalRow` | Ред в inbox списъка | `data: Signal`, `selected`, `onSelect`, `onAction` |
| `SLAChip` | SLA индикатор със цвят | `sla: {status, text}`, `label` |
| `FiltersSidebar` | Filters panel | `filters`, `onChange` |
| `SortDropdown` | Sort selector | `value`, `onChange` |
| `BulkActionBar` | Sticky bar за bulk actions | `count`, `onClear`, `onAction` |

### Detail Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `SignalHeader` | Header със status transitions | `data: Signal`, `onTransition` |
| `MediaGallery` | Grid със снимки + upload | `signalId`, `media`, `onChange` |
| `Timeline` | Вертикална хронология | `events: TimelineEvent[]` |
| `NotesPanel` | Табове публични/вътрешни | `signalId`, `notes`, `onChange` |
| `WorkOrdersPanel` | Work orders list + create | `signalId`, `orders`, `onChange` |
| `MetadataCard` | Sidebar metadata | `data: Signal` |
| `SLAProgress` | Progress bars за SLA | `sla`, `status` |
| `ConflictModal` | 412 conflict resolution | `signalId`, `onReload`, `onDismiss` |

### Reports Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `SLAReportTable` | Таблица със SLA metrics | `data: SLAData` |
| `VolumeReport` | Ranked list с bars | `data: VolumeItem[]` |
| `TrendChart` | Stacked bar chart | `data: TrendDataPoint[]` |
| `ExportButtons` | CSV/JSON export | `data`, `filename`, `type` |

---

## 🔌 API Endpoints

### Dashboard

```
GET /api/operator/dashboard?period={today|7days|30days}

Response:
{
  kpi: {
    new_today: number,
    new_7days: number,
    new_30days: number,
    confirmed_within_48h: number,
    confirmed_within_48h_pct: number,
    tta_overdue: number,
    tta_overdue_trend: number,
    in_process: number,
    resolved_period: number,
    ttr_median_days: number
  },
  inflow_vs_processed: Array<{date, new, processed}>,
  top_categories: Array<{id, name, count, pct, change}>,
  recent_escalations: Array<{id, signal_id, signal_title, created_at}>
}
```

### Signals List

```
GET /api/operator/signals?tab=novo&q=&status[]=&category[]=&sort=sla_urgent&cursor=&limit=20

Response:
{
  items: Signal[],
  next_cursor?: string,
  total?: number
}
```

### Signal Detail

```
GET /api/operator/signals/{id}
Headers: Authorization: Bearer {token}

Response (with ETag header):
{
  ...Signal,
  timeline: TimelineEvent[],
  notes: Note[],
  workOrders: WorkOrder[],
  media: MediaFile[]
}
```

### Status Transition

```
PATCH /api/operator/signals/{id}/status
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
  If-Match: "{etag}"

Body:
{
  to: SignalStatus,
  reason?: string (required for otkhvurlen),
  evidence?: {...} (required for popraven)
}

Response (with new ETag):
{
  id: string,
  status: SignalStatus,
  updated_at: string,
  ...timestamps
}

Errors:
- 400: Missing required fields
- 412: ETag mismatch (conflict)
```

### Notes

```
POST /api/operator/signals/{id}/notes
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  type: "public" | "internal",
  body: string,
  files: MediaFile[]
}

Response:
{
  id: string,
  signal_id: string,
  type: string,
  author_id: string,
  author_name: string,
  body: string,
  files: MediaFile[],
  created_at: string
}
```

### Reports

```
GET /api/operator/reports?from=2024-01-01&to=2024-01-31&group=day

Response:
{
  sla: {
    tta_within_48h: number,
    tta_within_48h_pct: number,
    tta_overdue: number,
    process_within_5d: number,
    process_within_5d_pct: number,
    ttr_median_days: number,
    ttr_over_14d: number
  },
  volumes: {
    by_category: Array<{id, name, count}>,
    by_area: Array<{id, name, count}>,
    by_status: Array<{status, count}>
  },
  trends: Array<{date, new, confirmed, in_process, resolved}>
}
```

---

## ⏱️ SLA Логика

### Дефиниции

| Metric | Definition | Target |
|--------|------------|--------|
| **TTA** | Time To Acknowledge - от създаване до потвърждение | ≤48 часа |
| **Process** | От потвърждение до "В процес" | ≤5 дни |
| **TTR** | Time To Resolution - от създаване до "Поправен" | Медиана ≤14 дни |

### Статусни Преходи

```
novo → potvurden → v_proces → popraven → arhiv
  ↓         ↓         ↓
otkhvurlen (терминален)
```

**Rollback**: `popraven → v_proces` (ако трябва rework)

### SLA Изчисления

```typescript
// TTA Deadline
tta_deadline = created_at + 48 hours

// Process Deadline
process_deadline = confirmed_at + 5 days

// TTR
ttr_duration = resolved_at - created_at
ttr_median = median(all ttr_durations)
```

### SLA Статуси

| Status | Условие | Цвят |
|--------|---------|------|
| **ok** | >12ч до deadline | Зелено |
| **warning** | 0-12ч до deadline | Amber |
| **overdue** | След deadline | Червено |

### Напомняния (Future)

- 36ч след създаване → напомняне към owner
- 44ч след създаване → ескалация към екип
- 4 дни в `potvurden` → напомняне "Премести в процес"

---

## 🧪 Тестване

### Quick Start Testing

```bash
# 1. Start dev server
cd apps/web
pnpm dev

# 2. Login as operator
# Email: st_ivan_trilovski@pgtmbg.com

# 3. Navigate to operator dashboard
http://localhost:3003/bg/operator

# 4. Test each section:
# - Dashboard KPIs
# - Inbox filtering and sorting
# - Signal detail view
# - Reports generation
```

### Test Scenarios

#### Scenario 1: Dashboard Load
1. Navigate to `/bg/operator`
2. Verify KPI cards load with numbers
3. Check chart renders correctly
4. Switch periods (Днес/7 дни/30 дни)
5. Verify numbers update

#### Scenario 2: Inbox Filtering
1. Go to `/bg/operator/inbox`
2. See list of signals
3. Apply status filter (checkbox)
4. Apply priority filter
5. Use search bar
6. Change sort order
7. Load more (pagination)

#### Scenario 3: Signal Status Transition
1. Open signal detail `/bg/operator/signals/{id}`
2. Verify header shows correct status
3. Click action button (e.g., "Потвърди")
4. See optimistic update (instant)
5. Verify API call succeeds
6. Check timeline shows event

#### Scenario 4: Notes Creation
1. In signal detail, go to Notes tab
2. Switch between "Публични" and "Вътрешни"
3. Type note in textarea
4. Click "Добави бележка"
5. See note appear in list
6. Verify correct type/visibility

#### Scenario 5: Reports Export
1. Go to `/bg/operator/reports`
2. Set date range
3. Click "Генерирай"
4. See SLA table, charts, volumes
5. Click CSV export
6. Verify file downloads
7. Open CSV and check data

### Mock Data

API endpoints използват mock data за development. В production трябва да се замени с реални Firestore queries.

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Firebase custom claims настроени за operator/admin роли
- [ ] Firestore security rules обновени:
  ```javascript
  match /signals/{signalId} {
    allow read: if request.auth.uid != null;
    allow write: if hasRole('operator') || hasRole('admin');
  }
  ```
- [ ] Environment variables конфигурирани
- [ ] API endpoints преминати към production Firestore
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics tracking (GA4)

### Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://selnet.bg
FIREBASE_PROJECT_ID=selnet-ab187
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

### Build & Deploy

```bash
# Build
cd apps/web
pnpm build

# Test production build locally
pnpm start

# Deploy to Vercel
vercel --prod

# Or deploy to Firebase Hosting
firebase deploy --only hosting:web
```

### Post-Deployment Verification

1. ✅ Login as operator works
2. ✅ Dashboard loads correctly
3. ✅ Inbox filtering works
4. ✅ Signal detail opens
5. ✅ Status transitions save
6. ✅ Reports generate
7. ✅ Export downloads files
8. ✅ RBAC enforced (try accessing as non-operator)

---

## 📈 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| **LCP** | <2.5s | TBD |
| **FID** | <100ms | TBD |
| **CLS** | <0.1 | TBD |
| **Dashboard Load** | <1s | ~500ms (mock) |
| **Inbox Load (20 items)** | <800ms | ~400ms (mock) |
| **Signal Detail Load** | <600ms | ~300ms (mock) |

---

## 🔮 Future Enhancements

### Phase 2 (Q1 2026)
- [ ] Map view с Mapbox GL JS
- [ ] Real-time notifications (SSE/WebSocket)
- [ ] Advanced filtering (date ranges, geo-radius)
- [ ] Batch import/export
- [ ] Mobile app optimization

### Phase 3 (Q2 2026)
- [ ] AI-powered duplicate detection
- [ ] Predictive SLA warnings
- [ ] Advanced analytics dashboard
- [ ] Integration със external systems (ERP)
- [ ] Multi-language support

---

## 🆘 Support & Troubleshooting

### Common Issues

**Issue**: "Unauthorized" error
- **Solution**: Check Firebase custom claims, ensure user has operator/admin role

**Issue**: Inbox не зарежда сигнали
- **Solution**: Check browser console, verify API endpoint, check network tab

**Issue**: Status transition fails
- **Solution**: Check If-Match header, verify allowed transitions, see API logs

**Issue**: Export button не работи
- **Solution**: Check browser permissions, verify data format, try different browser

### Debug Mode

Enable debug logging:
```typescript
// In browser console
localStorage.setItem('DEBUG', 'operator:*');
```

### Contact

- **Technical Issues**: GitHub Issues
- **Feature Requests**: Product Team
- **Urgent**: dev-team@selnet.bg

---

## 📄 License

MIT License - Selnet Project © 2025

---

**Версия**: 1.0.0  
**Последна актуализация**: 23 октомври 2025  
**Статус**: ✅ Production Ready (с mock data)
