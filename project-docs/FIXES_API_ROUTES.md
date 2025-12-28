# Поправки на API Routes - 22 Октомври 2025

## Проблем
API endpoint-ите за `/api/signals`, `/api/ideas` и `/api/events` връщаха HTML вместо JSON, което причиняваше грешки:
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Причина
В `next.config.js` имаше `rewrites()` правило, което пренасочваше всички API заявки към външен `API_URL`, ако е зададен в environment variables. Тъй като този external API не съществува или не е достъпен, Next.js връщаше 404 HTML страница вместо JSON.

## Решение

### 1. Премахнато API Rewrite правило (next.config.js)
```javascript
// Премахнато:
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: process.env.API_URL ? `${process.env.API_URL}/:path*` : '/api/:path*',
    },
  ];
}
```

Сега Next.js използва локалните API routes в `apps/web/src/app/api/`.

### 2. Поправени Telemetry Endpoints
Telemetry endpoints (`/api/telemetry/error` и `/api/telemetry/vitals`) хвърляха грешки, защото се опитваха да записват в Firebase без credentials.

Добавена проверка:
```typescript
if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.log("[Telemetry] ...", doc);
  return NextResponse.json({ ok: true });
}
```

## Резултат
✅ `/api/signals` - работи
✅ `/api/ideas` - работи  
✅ `/api/events` - работи
✅ `/api/telemetry/*` - работи без Firebase credentials

## Тестване
1. Отвори http://localhost:3000/bg/signals
2. Отвори http://localhost:3000/bg/ideas
3. Отвори http://localhost:3000/bg/events

Всички страници трябва да зареждат mock данни без грешки в конзолата.

### 3. Добавен images.unsplash.com домейн (next.config.js)
Unsplash изображенията в mock данните причиняваха грешка:
```
Error: Invalid src prop (https://images.unsplash.com/...) on `next/image`, 
hostname "images.unsplash.com" is not configured under images in your `next.config.js`
```

Добавено в `images.domains`:
```javascript
domains: ['selnet.bg', 'api.selnet.bg', 'images.unsplash.com']
```

## Забележки
- Mock данни се връщат от локалните API routes
- За production, ще трябва да конфигурирате Firebase credentials в `.env.local`
- Ако искате да използвате external API, трябва да настроите правилен `API_URL` в environment variables
- Unsplash изображенията в mock данните вече работят без грешки
