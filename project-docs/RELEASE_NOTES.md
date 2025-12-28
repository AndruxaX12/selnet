# SelNet — Release vX.Y.Z (YYYY-MM-DD)

## Ново
- [ ] Карта: полигон филтър + URL синхрон
- [ ] Търсене: MiniSearch + подсветка
- [ ] …

## Подобрено
- [ ] Формите: компресия на снимки, прогрес и анти-спам
- [ ] …

## Сигурност / Stabilization
- [ ] Firestore rules затворени /users/*
- [ ] CSP/HSTS активни
- [ ] Rate limiting на публичните API

## Миграции / Индекси
- [ ] firestore.indexes.json — деплойнато
- [ ] storage.rules — деплойнато

## Известни проблеми
- [ ] …

## Rollback план
- [ ] Връщане към предишен preview канал: `firebase hosting:clone ...` 
- [ ] Revert на Functions: `firebase functions:list & firebase deploy --only functions:<subset>@previous`
