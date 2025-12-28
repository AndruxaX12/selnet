# СелНет - Генериране 1: Фондация и API Слой

> **Статус**: ✅ Завършено  
> **Дата**: 22.10.2025  
> **Версия**: 1.0

## Преглед

Генериране 1 съдържа основната инфраструктура за трите публични страници:
- **Типове и DTO модели** за сигнали, идеи и събития
- **API клиент слой** с error handling, retry логика и кеширане
- **Утилитарни функции** за дати, форматиране и аналитики
- **Базови UI компоненти** за състояния, филтри и визуализация

---

## 📦 Създадени Файлове

### 1. Типове и DTO Модели

#### `src/types/signals.ts`
```typescript
// Типове за сигнали
- SignalStatus: 'novo' | 'potvurden' | 'v_proces' | 'popraven' | 'arhiv' | 'otkhvurlen'
- SignalPriority: 'low' | 'normal' | 'high' | 'urgent'
- SignalCategory: 7 категории
- SignalCardDTO: Пълен DTO за карта
- SignalFilters: Филтри и query параметри
- UI Labels и цветове за всички статуси
```

**Основни полета на SignalCardDTO:**
- `id, title, description`
- `photos[], location{address,lat,lng}`
- `status, priority, category`
- `comments_count, votes_support, watchers`
- `sla{tta_hours, ttr_days, overdue}`
- `created_at, updated_at`

#### `src/types/ideas.ts`
```typescript
// Типове за идеи
- IdeaStatus: 'novo' | 'obsuzhdane' | 'v_razrabotka' | 'planirano' | 'otkhvurleno' | 'arhiv'
- IdeaCategory: 8 категории
- IdeaCardDTO: Пълен DTO за карта
- IdeaFilters: Филтри и query параметри
- UI Labels и цветове
```

**Основни полета на IdeaCardDTO:**
- `id, title, summary`
- `author{name, role}`
- `category, tags[], attachments[]`
- `status, support_count, comments_count`
- `deadline, created_at`

#### `src/types/events.ts`
```typescript
// Типове за събития
- EventStatus: 'published' | 'archived'
- EventCategory: 8 категории
- EventPeriod: 'today' | 'weekend' | 'month' | 'past' | 'upcoming'
- EventCardDTO: Пълен DTO за карта
- EventFilters: Филтри и query параметри
- UI Labels
```

**Основни полета на EventCardDTO:**
- `id, title`
- `start_at, end_at` (ISO 8601)
- `location{address,lat,lng}, is_online`
- `organizer, category, poster`
- `rsvp_count, status`
- `created_at`

---

### 2. API Клиент Слой

#### `src/lib/api/client.ts`
**Основен API клиент с:**
- ✅ Error handling (APIError класа)
- ✅ Retry логика (експоненциално забавяне)
- ✅ In-memory кеширане (TTL 60s)
- ✅ Query string builder
- ✅ Online/offline проверка

**API методи:**
```typescript
api.get<T>(endpoint, options)
api.post<T>(endpoint, data, options)
api.put<T>(endpoint, data, options)
api.patch<T>(endpoint, data, options)
api.delete<T>(endpoint, options)
```

**Функции:**
- `apiRequest<T>()` - основна fetch функция
- `buildQueryString()` - query параметри
- `clearCache()` - изчистване на кеша
- `isOnline()` - проверка за онлайн статус

#### `src/lib/api/signals.ts`
**API функции за сигнали:**
```typescript
fetchSignals(filters): Promise<SignalListResponse>
fetchSignalById(id): Promise<SignalCardDTO>
supportSignal(id): Promise<{success, votes}>
watchSignal(id): Promise<{success, watching}>
trackSignalShare(id, method) // Analytics
trackSignalClick(id, position) // Analytics
```

#### `src/lib/api/ideas.ts`
**API функции за идеи:**
```typescript
fetchIdeas(filters): Promise<IdeaListResponse>
fetchIdeaById(id): Promise<IdeaCardDTO>
supportIdea(id): Promise<{success, support_count}>
trackIdeaClick(id, position) // Analytics
trackIdeaSupport(id) // Analytics
```

#### `src/lib/api/events-api.ts`
**API функции за събития:**
```typescript
fetchEvents(filters): Promise<EventListResponse>
fetchEventById(id): Promise<EventCardDTO>
rsvpEvent(id, status): Promise<{success, rsvp_count}>
generateICS(event): string // .ics календар
downloadICS(event) // Download файл
trackEventRSVP(id, status) // Analytics
trackEventClick(id, position) // Analytics
```

---

### 3. Утилитарни Функции

#### `src/lib/utils/date.ts`
**Дати и време (Europe/Sofia, bg-BG):**
```typescript
formatDate(date): string // DD.MM.YYYY
formatTime(date): string // HH:mm
formatDateTime(date): string // DD.MM.YYYY, HH:mm
formatRelativeTime(date): string // "Преди 2 часа"
formatEventPeriod(start, end): string // Период за събития
isToday(date): boolean
isThisWeekend(date): boolean
isThisMonth(date): boolean
isPast(date): boolean
calculateSLAStatus(createdAt, status, tta): {label, variant, overdue}
```

**Примери:**
```javascript
formatDate('2025-10-14T10:30:00Z') // "14.10.2025"
formatTime('2025-10-14T10:30:00Z') // "13:30"
formatRelativeTime('2025-10-14T10:30:00Z') // "Преди 2 часа"
formatEventPeriod(start, end) // "26.10.2025, 09:00 - 12:00"
```

#### `src/lib/utils/format.ts`
**Форматиране на текст и числа:**
```typescript
truncateText(text, lines): string
truncateTitle(text, maxLength): string
formatNumber(num): string // 1234 → "1 234"
formatCompactNumber(num): string // 1500 → "1.5К"
pluralize(count, singular, plural, pluralMany): string
formatDistance(meters): string // 1500 → "1.5 км"
getShareUrl(type, id): string
copyToClipboard(text): Promise<boolean>
getInitials(name): string // "Иван Петров" → "ИП"
slugify(text): string // Кирилица → латиница
```

**Примери:**
```javascript
pluralize(1, 'коментар', 'коментара', 'коментари') // "1 коментар"
pluralize(5, 'коментар', 'коментара', 'коментари') // "5 коментари"
formatCompactNumber(1500) // "1.5К"
```

---

### 4. UI Компоненти

#### `src/components/public/Chip.tsx`
**Chip компонент за филтри:**
```tsx
<Chip 
  label="Ново" 
  active={true}
  count={12}
  onClick={() => {}}
  onRemove={() => {}}
  variant="default"
  size="md"
/>

<ChipGroup label="Статус">
  <Chip label="Ново" count={12} />
  <Chip label="В процес" count={5} />
</ChipGroup>
```

**Props:**
- `label: string` - текст
- `active?: boolean` - активен статус
- `count?: number` - брой елементи
- `onClick?: () => void` - клик
- `onRemove?: () => void` - премахване (показва X)
- `variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'`
- `size?: 'sm' | 'md'`

#### `src/components/public/Skeleton.tsx`
**Skeleton за loading състояния:**
```tsx
// Базов skeleton
<Skeleton className="h-6 w-32" />

// Skeleton за специфични карти
<SignalCardSkeleton />
<IdeaCardSkeleton />
<EventCardSkeleton />

// Grid от skeletons
<SkeletonGrid type="signal" count={6} />

// Skeleton за филтри
<FilterChipsSkeleton count={5} />
```

**Компоненти:**
- `Skeleton` - базов
- `SignalCardSkeleton` - за сигнали
- `IdeaCardSkeleton` - за идеи
- `EventCardSkeleton` - за събития
- `SkeletonGrid` - grid layout
- `FilterChipsSkeleton` - филтърни чипове

#### `src/components/public/EmptyState.tsx`
**Empty, Error и Offline състояния:**
```tsx
// Empty state
<EmptyState 
  type="signal"
  onClearFilters={() => {}}
/>

// Error state
<ErrorState 
  title="Грешка"
  description="Не успяхме да заредим данните"
  onRetry={() => {}}
/>

// Offline banner
<OfflineState 
  showCached={true}
  onRetry={() => {}}
/>
```

**Props:**
- `type: 'signal' | 'idea' | 'event' | 'search' | 'filter'`
- `title?, description?, actionLabel?, actionHref?`
- `onClearFilters?: () => void`
- `onRetry?: () => void`

#### `src/components/public/SearchBar.tsx`
**Търсене с debounce:**
```tsx
<SearchBar 
  value={searchQuery}
  onChange={(value) => setSearchQuery(value)}
  placeholder="Търсене по заглавие, адрес..."
  debounceMs={350}
/>
```

**Функции:**
- ✅ Debounce 350ms (конфигурируем)
- ✅ Clear бутон (X)
- ✅ Keyboard accessible
- ✅ ARIA labels

#### `src/components/public/SortDropdown.tsx`
**Dropdown за сортиране:**
```tsx
const sortOptions = [
  { value: '-created_at', label: 'Най-нови' },
  { value: '-votes_support', label: 'Най-подкрепяни' },
  { value: '-comments_count', label: 'Най-активни' },
];

<SortDropdown 
  options={sortOptions}
  value={sortBy}
  onChange={(value) => setSortBy(value)}
  label="Сортиране"
/>
```

**Функции:**
- ✅ Click outside to close
- ✅ Escape to close
- ✅ Keyboard navigation
- ✅ Check mark на избран
- ✅ ARIA roles

#### `src/components/public/Pagination.tsx`
**Infinite scroll + Load More:**
```tsx
<Pagination 
  currentCount={20}
  totalCount={134}
  hasMore={true}
  isLoading={false}
  onLoadMore={() => loadMore()}
  useInfiniteScroll={true}
/>
```

**Функции:**
- ✅ Infinite scroll (Intersection Observer)
- ✅ "Покажи още" бутон като fallback
- ✅ Counter "Показани X от Y"
- ✅ Loading индикатор
- ✅ Съобщение "Няма повече"

#### `src/components/public/StatusBadges.tsx`
**Бейджове за статуси:**
```tsx
// Статус за сигнал/идея
<StatusBadge status="v_proces" type="signal" />

// Приоритет
<PriorityBadge priority="high" />

// SLA индикатор
<SLABadge 
  label="Потвърди до 12ч"
  variant="warning"
  tooltip="Остават 12 часа до SLA дедлайн"
/>

// Категория
<CategoryBadge label="Инфраструктура" />

// Таг
<TagBadge label="велосипеди" />
```

**Компоненти:**
- `StatusBadge` - за статуси (сигнали/идеи)
- `PriorityBadge` - приоритет (само high/urgent)
- `SLABadge` - SLA индикатор
- `CategoryBadge` - категория
- `TagBadge` - таг (#)

---

## 🎨 Дизайн Система

### Цветове

**Primary:**
- Blue: `#2563EB` - основни интеракции
- Secondary: `#0EA5E9` - акценти

**Статуси (Сигнали):**
- Ново: `bg-gray-100 text-gray-800` (neutral)
- Потвърден: `bg-amber-100 text-amber-800` (amber)
- В процес: `bg-blue-100 text-blue-800` (blue)
- Поправен: `bg-green-100 text-green-800` (green)
- Отклонен: `bg-red-100 text-red-800` (red)
- Архив: `bg-slate-100 text-slate-800` (slate)

**Статуси (Идеи):**
- Ново: neutral
- Обсъждане: blue
- В разработка: purple
- Планирано: green
- Отхвърлено: red
- Архив: slate

### Типография

**Font Family:** Inter (Latin + Cyrillic support)

**Sizes:**
- H1: `text-3xl` (30px) - заглавия на страници
- H2: `text-2xl` (24px) - секции
- H3: `text-xl` (20px) - карти заглавия
- Body: `text-base` (16px) - основен текст
- Small: `text-sm` (14px) - метаданни
- Caption: `text-xs` (12px) - бейджове, допълнително

**Line Heights:**
- Заглавия: `leading-tight` (1.25)
- Текст: `leading-normal` (1.5)

### Spacing

**Grid Gap:**
- Mobile: `gap-4` (16px)
- Tablet+: `gap-6` (24px)

**Card Padding:**
- `p-4` (16px) - mobile
- `p-6` (24px) - desktop

### Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

**Grid Columns:**
- Mobile: 1 колона
- Tablet (md): 2 колони
- Desktop (lg): 3 колони
- Large (xl): 4 колони

---

## 📋 Acceptance Criteria

### ✅ API Слой
- [x] Error handling с retry логика (max 3 опита)
- [x] In-memory кеширане с TTL 60s
- [x] Query string builder за филтри
- [x] TypeScript типове за всички responses
- [x] Analytics tracking функции
- [x] Online/offline detection

### ✅ Утилитарни Функции
- [x] Дати в Europe/Sofia часова зона
- [x] Формат DD.MM.YYYY, HH:mm
- [x] Релативно време на български
- [x] SLA изчисления
- [x] Pluralization на български
- [x] Truncation с word-wrap
- [x] Clipboard функции
- [x] Slugify за кирилица

### ✅ UI Компоненти
- [x] Всички компоненти са keyboard accessible
- [x] ARIA labels и roles
- [x] Loading skeletons за всички типове
- [x] Empty/Error/Offline състояния
- [x] Infinite scroll + fallback бутон
- [x] Debounced search (350ms)
- [x] Consistent цветова схема
- [x] Responsive на всички breakpoints

### ✅ Accessibility
- [x] Контраст ≥ 4.5:1
- [x] Focus indicators
- [x] ARIA роли
- [x] Keyboard navigation
- [x] Screen reader labels

---

## 🧪 Тестване

### Unit Tests (Препоръчани)

```typescript
// API Client
describe('apiRequest', () => {
  test('caches GET requests', async () => {});
  test('retries on network error', async () => {});
  test('throws APIError on 4xx', async () => {});
});

// Date Utils
describe('formatDate', () => {
  test('formats to DD.MM.YYYY', () => {});
  test('uses Europe/Sofia timezone', () => {});
});

// Format Utils
describe('pluralize', () => {
  test('singular for 1', () => {});
  test('plural for 2-4', () => {});
  test('plural many for 5+', () => {});
});
```

### Component Tests (Препоръчани)

```typescript
// Chip
test('renders active state', () => {});
test('calls onClick when clicked', () => {});
test('shows remove button when onRemove provided', () => {});

// SearchBar
test('debounces onChange', async () => {});
test('clears on X click', () => {});

// Pagination
test('calls onLoadMore when scrolled to bottom', () => {});
test('shows loading state', () => {});
```

---

## 📚 Използване

### Пример: Зареждане на сигнали

```typescript
import { fetchSignals } from '@/lib/api/signals';
import type { SignalFilters } from '@/types/signals';

// Зареждане с филтри
const filters: SignalFilters = {
  status: ['novo', 'v_proces'],
  category: ['lighting'],
  sort: '-created_at',
  limit: 20,
};

try {
  const response = await fetchSignals(filters);
  console.log('Loaded signals:', response.items);
  console.log('Total:', response.total);
} catch (error) {
  console.error('Failed to load:', error);
}
```

### Пример: Форматиране на дата

```typescript
import { formatDateTime, formatRelativeTime } from '@/lib/utils/date';

const signal = { created_at: '2025-10-14T10:30:00Z' };

console.log(formatDateTime(signal.created_at)); // "14.10.2025, 13:30"
console.log(formatRelativeTime(signal.created_at)); // "Преди 2 часа"
```

### Пример: UI Компоненти

```tsx
import { Chip, ChipGroup } from '@/components/public/Chip';
import { SearchBar } from '@/components/public/SearchBar';
import { StatusBadge } from '@/components/public/StatusBadges';

function MyComponent() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: [] });

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} />
      
      <ChipGroup label="Статус">
        <Chip label="Ново" count={12} onClick={() => {}} />
        <Chip label="В процес" count={5} active />
      </ChipGroup>

      <StatusBadge status="v_proces" type="signal" />
    </div>
  );
}
```

---

## 📊 Performance Targets

- ✅ **API Caching**: 60s TTL, намалява повторни заявки
- ✅ **Debounced Search**: 350ms, намалява API calls
- ✅ **Infinite Scroll**: Lazy loading, по-добър UX
- ✅ **Skeleton UI**: Показва се веднага, LCP оптимизация

**Очаквани резултати:**
- Time to Interactive (TTI): ≤ 3s
- Largest Contentful Paint (LCP): ≤ 2.5s
- First Input Delay (FID): ≤ 100ms
- Cumulative Layout Shift (CLS): ≤ 0.1

---

## 🔜 Следващи Стъпки (Генериране 2)

В следващото генериране ще създадем:
- ✅ SignalCard, IdeaCard, EventCard компоненти
- ✅ FilterBar с всички филтри
- ✅ ListHeader компонент
- ✅ Map View toggle (за сигнали)
- ✅ Complete responsive layouts

---

## 📝 Бележки

- Всички текстове са на български
- Enum стойности са на английски (novo, v_proces...)
- UI labels са на български (Ново, В процес...)
- Дати винаги в Europe/Sofia
- Analytics tracking готов за Google Analytics 4

---

**Автор**: СелНет Development Team  
**Последна промяна**: 22.10.2025
