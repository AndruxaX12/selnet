# SelNet — Post-deploy чеклист

## Monitoring
- [ ] `/[locale]/admin/health`: p75 LCP < 2.5s, грешки ≤ базово ниво.
- [ ] Cloud Functions logs: без грешки/ретрии.
- [ ] Push тест: foreground/background OK.

## SEO
- [ ] `/sitemap.xml` зарежда; Search Console ingest OK.
- [ ] OG card за детайли изглежда правилно.

## Security
- [ ] Прегледани `firestore.rules` и `storage.rules` в конзолата (Simulation).
- [ ] CSP в конзолата — без блокирани ресурси.

## Data
- [ ] Индексите активни (няма "needs index" в логове).
- [ ] Import/Export (ако ползваш) — smoke.

## PWA
- [ ] Install prompt, offline shell, SW update flow.
