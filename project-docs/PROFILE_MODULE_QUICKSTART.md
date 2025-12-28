# ⚡ Profile Module - Quick Start Guide

Бърз старт за локално тестване на модула "Профил & Настройки"

## 🚀 5-Minute Setup

### 1. Start Development Server
```bash
cd apps/web
pnpm dev
```
Server runs on: http://localhost:3003

### 2. Seed Test Data
```bash
# Create test notifications
node apps/web/scripts/seed-notifications.js

# Migrate notification preferences (if needed)
node apps/web/scripts/migrate-notification-prefs.js
```

### 3. Login & Test
- Open: http://localhost:3003
- Login with: `st_ivan_trilovski@pgtmbg.com`
- Navigate to: `/bg/me`

## 📱 Quick Feature Tour

### Profile Overview (`/bg/me`)
- ✅ View profile summary
- ✅ See activity stats (0 initially)
- ✅ Quick actions (New signal/idea/event)
- ✅ Click "📝 Редактирай профил"

### Settings Tab
**Personal Data:**
- Edit name (try: "Иван Нов")
- Edit bio (max 200 chars)
- See character counters

**Privacy:**
- Toggle "Покажи публичен профил"
- Toggle "Покажи ролята ми"
- Auto-saves on change

**Preferences:**
- Change theme (Light/Dark/System)
- Adjust font scale (80%-150%)
- See live preview

**Accessibility:**
- Enable "Намалени анимации"
- See animations stop immediately

### Notifications Tab
**Center:**
- See 5 test notifications
- Filter by category
- Mark as read (badge decrements)
- Delete notification

**Channels:**
- Toggle email/push per category
- System in-app cannot be disabled
- Auto-saves

**Digest:**
- Enable daily digest at 09:00
- Enable weekly (Monday)
- See info box

**Quiet Hours:**
- Enable 22:00 - 07:00
- See warning about critical notifications

### Data Tab
**Export:**
1. Click "Заявка за експорт"
2. Wait ~2 seconds (watch spinner)
3. See "Експортът е готов!"
4. Click "Свали експорта"
5. JSON file downloads

**Delete:** (UI only for now)
- See warning
- Confirm dialog

### Public Profile (`/u/:userId`)
- Get your userId from `/bg/me` URL
- Visit `/bg/u/[yourUserId]`
- See public profile
- Test privacy: Disable "публичен профил" → See error page

## 🎨 UI Elements to Check

### Responsive Design
- Resize browser window
- Check mobile view (375px)
- Tablet view (768px)
- Desktop view (1024px+)

### Animations
- Tab transitions (smooth fade)
- Button hover effects
- Toast notifications
- Loading spinners
- Success checkmarks

### Accessibility
- Tab through elements (keyboard nav)
- Enable reduce motion → animations stop
- Increase font scale → text grows
- Check color contrast

## 🧪 Test Scenarios

### Scenario 1: Edit Profile
1. Go to Settings → Personal Data
2. Change name to "Тест"
3. See character count update
4. Click "Запази"
5. See success message
6. Reload page → name persists

### Scenario 2: Privacy Protection
1. Go to Settings → Privacy
2. Uncheck "Покажи публичен профил"
3. Open new tab → `/bg/u/[yourUserId]`
4. See error: "Този профил е частен" 🔒
5. Go back, enable public profile
6. Refresh public profile → works

### Scenario 3: Notifications Flow
1. Go to Notifications → Center
2. Click "Маркирай всички като прочетени"
3. Badge (🔔 42) disappears
4. Filter "Непрочетени" → empty
5. Filter "Всички" → see all with timestamps

### Scenario 4: Export Data
1. Go to Data tab
2. Request export
3. Status: "pending" (spinner)
4. Wait 2 sec → Status: "ready" (✓)
5. See file size and expiry date
6. Download → check JSON content
7. Request 3rd export → Error: "Максимум 2 на ден"

### Scenario 5: Theme Change
1. Settings → Preferences
2. Select "Тъмна" theme
3. UI immediately goes dark
4. Select "Светла" → back to light
5. Reload → preference persists

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" error
**Solution:** 
- Ensure you're logged in
- Check browser console for token
- Try logout → login again

### Issue: Notifications not showing
**Solution:**
- Run seed script again
- Check browser console for errors
- Verify userId matches in database

### Issue: Export stuck at "pending"
**Solution:**
- Check console for errors
- Verify API endpoint working
- Try smaller dataset

### Issue: Changes not saving
**Solution:**
- Open Network tab in DevTools
- Check if PUT request succeeds
- Verify server logs

## 📊 What to Look For

### ✅ Good Signs
- Smooth animations
- Instant auto-save feedback
- No console errors
- Loading states show/hide
- Success messages appear
- Data persists after reload

### ❌ Red Flags
- Console errors
- Failed API calls (Network tab)
- Data doesn't persist
- Broken responsive layout
- Missing translations
- Slow loading (>2s)

## 🎯 Next Steps

After testing locally:

1. **Fix any bugs found**
2. **Review deployment checklist**
3. **Run production build:**
   ```bash
   pnpm build
   pnpm start
   ```
4. **Deploy to staging**
5. **Final QA testing**
6. **Deploy to production** 🚀

## 📝 Notes

- All times are Europe/Sofia timezone
- Email/SMS delivery not implemented yet
- Avatar upload is placeholder
- Account deletion is UI only
- Real-time via polling (not WebSocket yet)

## 🆘 Need Help?

- Check `PROFILE_MODULE_README.md` for detailed docs
- Review `DEPLOYMENT_CHECKLIST.md` for production
- See API docs in OpenAPI format (TODO)
- Contact: dev-team@selnet.bg

---

**Happy Testing!** 🎉
