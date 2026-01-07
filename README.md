# Fitness Tracker PWA

> Next.js 14 PWA for household fitness tracking: workouts, nutrition, meal planning, pantry inventory, offline-capable, self-hosted SQLite backend.

[![Release](https://img.shields.io/github/v/release/azullus/fitness-tracker?logo=github)](https://github.com/azullus/fitness-tracker/releases)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa&logoColor=white)]()
[![License](https://img.shields.io/github/license/azullus/fitness-tracker)](LICENSE)
[![Stars](https://img.shields.io/github/stars/azullus/fitness-tracker?style=flat)](https://github.com/azullus/fitness-tracker/stargazers)
[![Issues](https://img.shields.io/github/issues/azullus/fitness-tracker)](https://github.com/azullus/fitness-tracker/issues)
[![Last Commit](https://img.shields.io/github/last-commit/azullus/fitness-tracker)](https://github.com/azullus/fitness-tracker/commits/main)

Designed for individuals or households who want comprehensive fitness and nutrition tracking.

## Features

- **Dashboard**: Daily overview with nutrition, workout, and weight widgets
- **Quick Log**: Tabbed interface for weight, food, and workout logging
- **Workouts**: Weekly calendar with 30+ pre-built routines, streak tracking
- **Recipes**: 100+ recipes with macro info, search, and filtering
- **Meal Planning**: Track daily meals with nutrition breakdown
- **Pantry**: Inventory management with low-stock alerts
- **Weight Tracking**: Historical charts and trend analysis
- **Household Management**: Support for multiple people with individual tracking
- **Demo Mode**: Full functionality without login (test users included)
- **PWA**: Installable, offline-capable, mobile-optimized

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, clsx
- **Database**: SQLite (production) with demo mode fallback
- **Auth**: Optional Supabase authentication
- **Security**: Rate limiting, CSRF protection, API authentication
- **Deployment**: Docker with Traefik reverse proxy
- **Testing**: Jest + React Testing Library (119 tests)

## Quick Start

### Option 1: Development Mode

```bash
cd web-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click "Skip for now" to use demo mode.

### Option 2: Docker Deployment

See [DEPLOY.md](DEPLOY.md) for comprehensive production deployment guide.

**Quick deploy with existing Traefik:**

```bash
cp .env.production .env
# Edit .env with your domain and settings
docker-compose -f docker-compose.standalone.yml up -d
```

## Project Structure

```
web-app/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # Dashboard (main landing)
│   ├── log/page.tsx          # Quick logging (weight/food/workout)
│   ├── workouts/             # Workout pages & routines
│   ├── meals/page.tsx        # Meal planning
│   ├── pantry/page.tsx       # Pantry inventory
│   ├── recipes/              # Recipe browser & creator
│   ├── settings/             # App settings & household
│   ├── auth/                 # Login/signup/reset
│   └── api/                  # API routes (REST endpoints)
├── components/               # React components
│   ├── navigation/           # Header, BottomNav
│   ├── providers/            # Auth, Person, Theme contexts
│   ├── cards/                # Display cards
│   ├── forms/                # Form components
│   ├── modals/               # Modal dialogs
│   ├── tracking/             # Tracking widgets
│   └── ui/                   # Base UI components
├── lib/                      # Utilities & data
│   ├── types.ts              # TypeScript interfaces
│   ├── demo-data.ts          # Demo mode data
│   ├── database.ts           # SQLite operations
│   ├── supabase.ts           # Optional Supabase client
│   ├── csrf.ts               # CSRF protection
│   ├── rate-limit.ts         # Rate limiting
│   ├── env.ts                # Environment validation
│   ├── error-monitoring.ts   # Error tracking
│   ├── recipes/              # 100+ pre-built recipes
│   └── workouts/             # 30+ workout routines
├── public/                   # Static assets & PWA
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icons/                # App icons
├── supabase/                 # Database migrations (optional)
├── __tests__/                # Jest test suites
├── Dockerfile                # Production container
├── docker-compose.yml        # Full stack deployment
├── docker-compose.standalone.yml  # Standalone app
└── DEPLOY.md                 # Deployment guide
```

## Demo Mode

Click "Skip for now" on the login page to use demo mode with pre-populated data:

- **Taylor** (Female, Cardio focus) - 30yo, 5'1", 174 lbs
- **Dylan** (Male, Powerlifting focus) - 32yo, 5'10", 245 lbs
- 30 days of weight history
- Sample workouts and meals
- Full pantry inventory

Demo mode uses browser localStorage and is fully functional without authentication.

## Environment Variables

Create `.env.local` for development or `.env` for production:

```env
# Optional: Supabase Authentication (leave blank for demo-only mode)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Production: Database location
DATABASE_TYPE=sqlite
DATABASE_PATH=/app/data

# Production: App configuration
NEXT_PUBLIC_APP_URL=https://fitness.yourdomain.com
NEXT_PUBLIC_APP_NAME="Fitness Tracker"
```

See `.env.example` for all available options.

## API Routes

All routes in `app/api/`:

- `GET/POST/DELETE /api/weight` - Weight entries
- `GET/POST/PATCH /api/workouts` - Workout logging
- `GET/POST/DELETE /api/meals` - Food logging
- `GET/POST/PATCH/DELETE /api/pantry` - Pantry items
- `GET/POST/PUT/DELETE /api/persons` - Household members
- `GET/POST/PUT/DELETE /api/recipes` - User recipes
- `GET /api/csrf` - CSRF token generation

All routes include:
- Authentication checks
- Rate limiting (READ: 100/min, WRITE: 30/min, DELETE: 20/min)
- CSRF protection on state-changing operations
- Input validation
- Error monitoring

## Security Features

- **Authentication**: Optional Supabase auth with secure demo mode
- **Rate Limiting**: Sliding window algorithm prevents abuse
- **CSRF Protection**: Double-submit cookie pattern on all POST/PUT/PATCH/DELETE
- **Ownership Verification**: Users can only access their own data
- **Input Validation**: Comprehensive validators for all user input
- **Environment Validation**: Type-safe configuration with startup checks
- **Error Monitoring**: Centralized error tracking with severity levels
- **Docker Security**: Non-root user, health checks, minimal attack surface

## Development Commands

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Generate PWA icons
npm run generate-icons
```

## PWA Installation

### Desktop (Chrome/Edge)
1. Open the app in your browser
2. Click the install icon in the address bar
3. Click "Install"

### Mobile (iOS Safari)
1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"

### Mobile (Android Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen"

## Deployment Options

### Self-Hosted (Recommended)

See [DEPLOY.md](DEPLOY.md) for complete guide. Supports:
- Docker Compose with Traefik
- Automatic HTTPS with Let's Encrypt
- Daily SQLite backups
- Auto-updates with Watchtower
- Cloudflare tunnel alternative

### Other Platforms

The app uses Next.js standalone output and can deploy to:
- Any Docker-capable host
- VM with Node.js 20+
- Cloud providers (AWS, GCP, Azure)

**Note**: This app is designed for personal/household use, not multi-tenant SaaS.

## Household Management

The app supports multiple household members with individual tracking:

- **Person Profiles**: Track age, height, weight, BMI, calorie targets
- **Training Focus**: Customize workout types (powerlifting, cardio, mobility, general)
- **Workout Days**: Set individual training schedules (1-7 days per week)
- **Isolation**: Each person's data is tracked separately
- **Switching**: Easy switching between household members

Add and manage household members in **Settings → Household**.

## Pre-Built Content

### Workouts (30+ Routines)

**Strength Training:**
- Full body compound lifts
- Upper/lower splits
- Push/pull/legs routines
- Powerlifting focused (squat/bench/deadlift)

**Cardio:**
- HIIT circuits
- Steady-state cardio
- Tabata intervals

**Mobility:**
- Yoga flows
- Dynamic stretching
- Recovery routines

### Recipes (100+ Options)

**Breakfast:** High-protein options, oatmeal, smoothie bowls, egg dishes

**Lunch:** Salads, wraps, bowls, quick meals

**Dinner:** Chicken, beef, pork, seafood, vegetarian options

**Snacks:** Protein-rich snacks, quick bites

All recipes include:
- Macro breakdown (calories, protein, carbs, fat, fiber)
- Ingredient lists
- Step-by-step instructions
- Serving sizes

## Customization

### Add Your Own Recipes
1. Go to **Recipes** → **New Recipe**
2. Enter name, category, ingredients, instructions
3. Add nutrition info (optional - can calculate from ingredients)
4. Save and use in meal planning

### Create Custom Workouts
1. Go to **Workouts** → **Routines** → **Custom**
2. Add exercises with sets/reps/weight
3. Save routine for future use
4. Track completion and progress

### Adjust Nutrition Targets
1. Go to **Settings** → **Household**
2. Edit person profile
3. Update daily calorie target, macro goals
4. Targets are used in dashboard progress tracking

## Testing

Test suite includes:
- **Unit Tests**: Validation, rate limiting, utilities
- **Component Tests**: UI components, forms, modals
- **Integration Tests**: API routes, database operations
- **Security Tests**: CSRF, rate limiting, authorization

Run tests: `npm test`

Coverage: 119 tests across 4 test suites

## Troubleshooting

### Demo Mode Not Working

**Issue**: "Skip for now" button doesn't load demo data or test users

**Solutions**:

1. **LocalStorage Disabled**
   ```javascript
   // Test in browser console (F12)
   localStorage.setItem('test', 'value');
   console.log(localStorage.getItem('test'));
   ```
   - **Fix**: Enable cookies and site data in browser settings
   - **Chrome**: Settings → Privacy → Cookies → Allow all cookies

2. **Incognito/Private Mode**
   - LocalStorage clears when browser closes
   - **Fix**: Use normal browsing mode for persistent data

3. **Clear Browser Cache**
   ```bash
   # Hard refresh
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   ```

4. **Check Console Errors**
   ```javascript
   // Open browser console (F12)
   // Look for errors related to demo-data.ts
   // Check if demo users (Taylor/Dylan) loaded
   ```

### Database Errors in Production

**Issue**: SQLite errors or data not persisting on server

**Solutions**:

1. **Database Directory Missing**
   ```bash
   # Check if data directory exists
   ls -la /app/data

   # Create if missing
   mkdir -p /app/data
   chmod 755 /app/data
   ```

2. **Permission Issues**
   ```bash
   # Check SQLite file ownership
   ls -la /app/data/fitness-tracker.db

   # Fix permissions (container runs as node user)
   chown -R 1000:1000 /app/data
   chmod 644 /app/data/fitness-tracker.db
   ```

3. **Database Corruption**
   ```bash
   # Check database integrity
   sqlite3 /app/data/fitness-tracker.db "PRAGMA integrity_check;"

   # If corrupted, restore from backup
   cp /app/backups/fitness-tracker-YYYYMMDD.db /app/data/fitness-tracker.db
   ```

4. **Docker Volume Issues**
   ```bash
   # Check Docker volume exists
   docker volume ls | grep fitness-data

   # Inspect volume
   docker volume inspect fitness-data

   # Recreate volume if needed
   docker-compose down
   docker volume rm fitness-data
   docker-compose up -d
   ```

### PWA Installation Issues

**Issue**: "Add to Home Screen" not appearing or PWA won't install

**Solutions**:

1. **HTTPS Required**
   - PWA only works on HTTPS (or localhost)
   - **Fix**: Deploy to server with SSL or use Traefik reverse proxy
   ```bash
   # Verify HTTPS
   curl -I https://fitness.yourdomain.com
   # Should return 200 OK with HTTPS
   ```

2. **Manifest Issues**
   ```bash
   # Check manifest.json is accessible
   curl https://fitness.yourdomain.com/manifest.json

   # Verify manifest.json contents
   cat public/manifest.json
   # Must have name, short_name, icons, start_url
   ```

3. **Service Worker Not Registered**
   ```javascript
   // Check in browser console (F12)
   navigator.serviceWorker.getRegistrations()
     .then(registrations => console.log(registrations));

   // Should show service worker registered
   ```

4. **Browser Compatibility**
   - **iOS Safari**: Tap Share → "Add to Home Screen"
   - **Android Chrome**: Menu → "Add to Home Screen"
   - **Desktop Chrome**: Click install icon in address bar

5. **Cache Issues**
   ```javascript
   // Unregister service worker
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(r => r.unregister());
   });

   // Clear cache
   caches.keys().then(names => {
     names.forEach(name => caches.delete(name));
   });

   // Reload page
   location.reload(true);
   ```

### Authentication Issues

**Issue**: Can't login, logout, or Supabase auth failing

**Solutions**:

1. **Missing Environment Variables**
   ```bash
   # Check .env.local file
   cat .env.local
   # Must have:
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

   # Verify in Supabase Dashboard
   # Project Settings → API → Project URL & anon/public key
   ```

2. **Supabase Project Paused**
   - Free tier projects pause after 1 week of inactivity
   - **Fix**: Login to Supabase dashboard and unpause project

3. **CORS Errors**
   ```bash
   # Add domain to Supabase allowed domains
   # Supabase Dashboard → Authentication → URL Configuration
   # Add: https://fitness.yourdomain.com
   ```

4. **Row Level Security (RLS) Issues**
   ```sql
   -- Check RLS policies in Supabase
   -- SQL Editor → Run:
   SELECT * FROM pg_policies WHERE tablename = 'persons';

   -- Ensure policies allow user operations
   -- Example policy for persons table:
   CREATE POLICY "Users can view own household"
     ON persons FOR SELECT
     USING (auth.uid() = user_id);
   ```

5. **Auth Session Expired**
   ```javascript
   // Clear Supabase session
   localStorage.removeItem('supabase.auth.token');

   // Reload and login again
   location.reload();
   ```

### Workout Logging Issues

**Issue**: Workouts not saving or not appearing in calendar

**Solutions**:

1. **Form Validation Errors**
   ```javascript
   // Check browser console for validation errors
   // Ensure all required fields filled:
   // - Date
   // - Workout type
   // - At least one exercise with sets/reps
   ```

2. **Exercise Data Format**
   ```javascript
   // Exercises must be valid JSON array
   // Example correct format:
   [
     {"name": "Squat", "sets": 5, "reps": 5, "weight": 225},
     {"name": "Bench Press", "sets": 5, "reps": 5, "weight": 185}
   ]
   ```

3. **Calendar Not Updating**
   ```javascript
   // Force page refresh
   window.location.reload();

   // Or clear React state
   // Click on different week and back
   ```

4. **API Route Errors**
   ```bash
   # Check Next.js logs
   docker logs fitness-tracker | grep "POST /api/workouts"

   # Test API endpoint
   curl -X POST http://localhost:3000/api/workouts \
     -H "Content-Type: application/json" \
     -d '{"person_id": 1, "date": "2024-01-01", "type": "Strength"}'
   ```

### Meal/Food Logging Issues

**Issue**: Meals not appearing or nutrition totals wrong

**Solutions**:

1. **Recipe Not Found**
   ```bash
   # Check if recipe exists
   # Open Browser Console → Application → IndexedDB (for demo mode)
   # Or check Supabase → Table Editor → recipes

   # Verify recipe has valid nutrition data
   # Must have: calories, protein_g, carbs_g, fat_g
   ```

2. **Nutrition Not Calculating**
   ```javascript
   // Verify recipe nutrition format
   {
     "calories": 450,
     "protein_g": 35,
     "carbs_g": 40,
     "fat_g": 15,
     "fiber_g": 5
   }

   // All values must be numbers, not strings
   ```

3. **Meal Type Filter**
   - Check if viewing correct meal type (breakfast/lunch/dinner/snack)
   - **Fix**: Clear filters or select "All Meals"

4. **Date Range**
   - Ensure viewing correct date
   - **Fix**: Use date picker to select today's date

### Pantry Management Issues

**Issue**: Pantry items not updating or low stock alerts not working

**Solutions**:

1. **Quantity Update Failures**
   ```bash
   # Check API logs
   docker logs fitness-tracker | grep "PATCH /api/pantry"

   # Test API endpoint
   curl -X PATCH http://localhost:3000/api/pantry/123 \
     -H "Content-Type: application/json" \
     -d '{"quantity": 5}'
   ```

2. **Low Stock Threshold Not Set**
   ```javascript
   // Each pantry item needs low_stock_threshold
   // Example:
   {
     "name": "Chicken Breast",
     "quantity": 3,
     "low_stock_threshold": 5  // Alert when quantity < 5
   }
   ```

3. **Category Filter**
   - Items may be filtered by category
   - **Fix**: Select "All Categories" to see all items

### Recipe Search Not Working

**Issue**: Can't find recipes or search returns no results

**Solutions**:

1. **Search Index**
   ```javascript
   // Recipes filter by name and category
   // Check spelling and try:
   // - Partial names ("chicken" instead of "Chicken Breast")
   // - Different category
   // - Clear search and browse all
   ```

2. **Custom Recipes Not Showing**
   ```bash
   # Check if recipe was saved
   # Browser Console → Application → IndexedDB → recipes
   # Or Supabase → recipes table

   # Verify user_id matches current user
   ```

3. **Macro Filters Too Strict**
   ```javascript
   // If using macro filters (high protein, low carb, etc.)
   // Try clearing filters

   // Recipe must match ALL active filters
   // Example: "High Protein" = protein_g >= 30
   ```

### Performance Issues

**Issue**: App is slow or laggy

**Solutions**:

1. **Large Dataset**
   ```bash
   # Check data size
   # Browser Console:
   const dbSize = JSON.stringify(localStorage).length;
   console.log(`LocalStorage: ${dbSize} bytes`);

   # If > 5MB, archive old data
   # Delete workouts/meals older than 1 year
   ```

2. **Service Worker Cache**
   ```javascript
   // Clear service worker cache
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(r => r.unregister());
   });

   // Clear all caches
   caches.keys().then(names => {
     names.forEach(name => caches.delete(name));
   });

   // Hard refresh
   location.reload(true);
   ```

3. **Too Many Workout Routines**
   - Limit custom workout routines to 50
   - Delete unused routines

4. **Browser Extensions**
   - Ad blockers may interfere with API calls
   - **Fix**: Test in incognito mode or disable extensions

### Docker Deployment Issues

**Issue**: Container won't start or exits immediately

**Solutions**:

1. **Environment Variables Missing**
   ```bash
   # Check .env file exists
   ls -la .env

   # Verify required vars
   cat .env | grep DATABASE_PATH
   # Should have:
   DATABASE_TYPE=sqlite
   DATABASE_PATH=/app/data
   ```

2. **Port Conflicts**
   ```bash
   # Check if port 3000 already in use
   sudo lsof -i :3000

   # Change port in docker-compose.yml
   ports:
     - "3001:3000"
   ```

3. **Build Errors**
   ```bash
   # Check build logs
   docker-compose build --no-cache

   # If TypeScript errors, fix and rebuild
   npm run build

   # Check Docker logs
   docker logs fitness-tracker --tail 100
   ```

4. **Volume Mount Issues**
   ```bash
   # Verify volume mount in docker-compose.yml
   volumes:
     - fitness-data:/app/data

   # Check volume exists
   docker volume inspect fitness-data

   # Recreate if needed
   docker volume rm fitness-data
   docker volume create fitness-data
   ```

### Build Errors

**Issue**: `npm run build` fails

**Solutions**:

1. **Dependency Issues**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **TypeScript Errors**
   ```bash
   # Check for type errors
   npx tsc --noEmit

   # Fix reported errors
   # Common issues:
   # - Missing type definitions
   # - Incorrect prop types
   # - Unused variables
   ```

3. **Environment Variables**
   ```bash
   # .env.local not loaded in production
   # Set env vars in deployment platform

   # For Docker, use .env file
   # For Vercel, set in project settings
   ```

4. **Memory Issues**
   ```bash
   # Increase Node.js memory
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

5. **Next.js Cache**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

## Support & Documentation

- **Deployment Guide**: [DEPLOY.md](DEPLOY.md)
- **License**: MIT License - free for personal and commercial use

## Production Status

**Status**: ✅ Production Ready

- 90 files deployed
- 16,565 lines of code
- 119 tests passing
- Security hardened
- Docker ready
- Documentation complete

---

## 🔗 Related Projects

### Web Applications (Similar Stack)
- **[budget-tracker](https://github.com/azullus/budget-tracker)** - Next.js 14 PWA for personal finance tracking with offline-first architecture

### Infrastructure & Deployment
- **[docker-infrastructure](https://github.com/azullus/docker-infrastructure)** - Docker Compose IaC for self-hosted deployments with Traefik
- **[cosmicbytez-ops-toolkit](https://github.com/azullus/cosmicbytez-ops-toolkit)** - PowerShell automation for IT operations
- **[cosmicbytez-homelab](https://github.com/azullus/cosmicbytez-homelab)** - Home lab infrastructure and media server documentation

### Security Operations
- **[cosmicbytez-secops](https://github.com/azullus/cosmicbytez-secops)** - Security operations, PNPT training, and ethical hacking resources

### DevOps Tools
- **[bc-docker-manager](https://github.com/azullus/bc-docker-manager)** - Electron desktop app for Business Central Docker containers
- **[CosmicPing](https://github.com/azullus/CosmicPing)** - Network diagnostic tool with real-time charting

---

Built with [Claude Code](https://claude.com/claude-code)
