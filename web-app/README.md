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
- Check browser console for errors
- Verify localStorage is enabled
- Clear browser cache and reload

### Database Errors in Production
- Ensure `/app/data` directory exists and is writable
- Check container logs: `docker logs fitness-tracker`
- Verify SQLite file permissions

### PWA Not Installing
- Ensure HTTPS is enabled (required for PWA)
- Check `manifest.json` is accessible
- Verify service worker is registered

### Authentication Issues
- Verify Supabase environment variables
- Check Supabase project is active
- Review auth logs in Supabase dashboard

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

---

Built with [Claude Code](https://claude.com/claude-code)
