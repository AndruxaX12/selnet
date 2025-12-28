# 🚀 Profile Module - Deployment Checklist

## Pre-Deployment Tasks

### 1. Database Setup
- [ ] Create Firestore indexes for notifications
  ```bash
  # notifications collection
  - user_id (ASC) + created_at (DESC)
  - user_id (ASC) + category (ASC) + created_at (DESC)
  - user_id (ASC) + read_at (ASC) + created_at (DESC)
  
  # exports collection
  - user_id (ASC) + requested_at (DESC)
  ```

- [ ] Set Firestore security rules
  ```javascript
  // notifications
  match /notifications/{notificationId} {
    allow read: if request.auth.uid == resource.data.user_id;
    allow write: if false; // Only server writes
  }
  
  // notification_prefs
  match /notification_prefs/{userId} {
    allow read, write: if request.auth.uid == userId;
  }
  
  // exports
  match /exports/{exportId} {
    allow read: if request.auth.uid == resource.data.user_id;
    allow create: if request.auth.uid == request.resource.data.user_id;
    allow update, delete: if false; // Only server
  }
  ```

- [ ] Create default notification_prefs for existing users
  ```bash
  node apps/web/scripts/migrate-notification-prefs.js
  ```

### 2. Environment Variables
- [ ] Set production environment variables
  ```env
  NEXT_PUBLIC_APP_URL=https://selnet.bg
  FIREBASE_PROJECT_ID=selnet-ab187
  FIREBASE_CLIENT_EMAIL=...
  FIREBASE_PRIVATE_KEY=...
  ```

### 3. Code Review
- [ ] Review all API endpoints for security
- [ ] Check RBAC implementation
- [ ] Verify privacy settings logic
- [ ] Test rate limiting (2 exports/day)
- [ ] Validate input sanitization

### 4. Performance
- [ ] Run Lighthouse audit (target: >90)
- [ ] Check bundle size (<500KB)
- [ ] Verify lazy loading
- [ ] Test on slow 3G connection
- [ ] Monitor API response times

### 5. Accessibility
- [ ] Test with screen reader
- [ ] Verify keyboard navigation
- [ ] Check color contrast ratios
- [ ] Test reduce motion setting
- [ ] Validate ARIA labels

### 6. Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### 7. Responsive Design
- [ ] Test on mobile (375px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1024px+)
- [ ] Test on large screens (1920px+)

## Deployment Steps

### Phase 1: Database Migration
```bash
# 1. Backup production database
gcloud firestore export gs://selnet-backups/$(date +%Y%m%d)

# 2. Create indexes
firebase deploy --only firestore:indexes

# 3. Update security rules
firebase deploy --only firestore:rules

# 4. Migrate existing users
node apps/web/scripts/migrate-notification-prefs.js
```

### Phase 2: Application Deployment
```bash
# 1. Build application
cd apps/web
pnpm build

# 2. Run production build locally
pnpm start

# 3. Test critical flows
# - Login → Profile → Settings
# - Notifications center
# - GDPR export

# 4. Deploy to Vercel
vercel --prod
```

### Phase 3: Post-Deployment Verification
```bash
# 1. Check production URL
curl https://selnet.bg/api/me/profile -H "Authorization: Bearer TOKEN"

# 2. Monitor error logs
vercel logs --follow

# 3. Check Firestore metrics
# - Read/write operations
# - Query performance
# - Index usage

# 4. Test key features
# - Profile edit
# - Privacy settings
# - Notifications
# - Export request
```

## Monitoring & Alerts

### Set up monitoring for:
- [ ] API error rates (>5% triggers alert)
- [ ] Response times (>2s triggers alert)
- [ ] Export queue length (>10 pending)
- [ ] Failed notification deliveries
- [ ] Database query performance

### Analytics to track:
- [ ] Profile page views
- [ ] Settings changes frequency
- [ ] Notification interaction rates
- [ ] Export requests per day
- [ ] Privacy setting changes

## Rollback Plan

If critical issues are detected:

1. **Immediate rollback:**
   ```bash
   vercel rollback
   ```

2. **Database rollback (if needed):**
   ```bash
   gcloud firestore import gs://selnet-backups/BACKUP_DATE
   ```

3. **Notify users:**
   - Post status update
   - Email affected users
   - Provide ETA for fix

## Post-Deployment Tasks

### Week 1
- [ ] Monitor error logs daily
- [ ] Check user feedback
- [ ] Verify analytics data
- [ ] Review performance metrics
- [ ] Fix any critical bugs

### Week 2-4
- [ ] Analyze user behavior
- [ ] Optimize slow queries
- [ ] Implement requested features
- [ ] Update documentation
- [ ] Plan next iteration

## Known Limitations

### Current Implementation
- ❌ Avatar upload (placeholder only)
- ❌ Real-time notifications (polling only)
- ❌ Email templates (no digest emails yet)
- ❌ Account deletion (UI only, no backend)
- ⚠️ Export stored inline (should use Cloud Storage)

### Future Improvements
- [ ] WebSocket for real-time notifications
- [ ] Cloud Storage for avatar uploads
- [ ] SendGrid integration for emails
- [ ] Step-up auth for account deletion
- [ ] Notification digest cron job
- [ ] Advanced analytics dashboard

## Support & Documentation

### User Documentation
- [ ] Profile management guide
- [ ] Privacy settings explained
- [ ] Notification preferences tutorial
- [ ] GDPR data export guide
- [ ] FAQ section

### Developer Documentation
- [ ] API documentation (Swagger)
- [ ] Database schema docs
- [ ] Component library
- [ ] Contributing guide
- [ ] Troubleshooting guide

## Success Metrics

### Technical KPIs
- Uptime: >99.9%
- API response time: <500ms (p95)
- Error rate: <1%
- LCP: <2.5s
- FID: <100ms

### User Engagement
- Profile completion rate: >70%
- Notification interaction: >30%
- Privacy settings usage: >20%
- Export requests: Track baseline

## Sign-off

- [ ] Tech Lead: _____________ Date: _______
- [ ] Product Owner: _________ Date: _______
- [ ] QA Lead: ______________ Date: _______
- [ ] DevOps: _______________ Date: _______

---

**Deployment Date:** ______________
**Deployed By:** ______________
**Version:** 1.0.0
**Status:** ☐ Success ☐ Partial ☐ Failed
