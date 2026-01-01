# Fitness Tracker PWA

Personal fitness management Progressive Web App for tracking workouts, nutrition, weight, and pantry inventory. Designed for a 2-person household in Edmonton, Alberta.

## Features

- **Dashboard**: Daily overview with nutrition, workout, and weight widgets
- **Quick Log**: Tabbed interface for weight, food, and workout logging
- **Workouts**: Weekly calendar with 30+ pre-built routines, streak tracking
- **Recipes**: 100+ recipes with macro info, search, and filtering
- **Meal Planning**: Track daily meals with nutrition breakdown
- **Pantry**: Inventory management with low-stock alerts
- **Weight Tracking**: Historical charts and trend analysis
- **Demo Mode**: Full functionality without login (Taylor/Dylan test users)
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

## Household Profile

Optimized for a 2-person household with:
- **Him**: Powerlifting focus (squat/bench/deadlift), 140-180g protein daily
- **Her**: Cardio/mobility focus (HIIT, yoga, toning), 140-180g protein daily
- Shared home gym with half rack, adjustable bench, barbell, dumbbells
- Dietary preferences: white rice only, PB Fit powder, Built Marshmallow bars
- Allergy: HIM has banana allergy (no raw bananas, substitute yellow kiwi)

## Training Schedules

### His Schedule (Powerlifting - 4 days)
| Mon | Tue | Wed | Thu | Fri | Sat/Sun |
|-----|-----|-----|-----|-----|---------|
| Squat | Bench | REST | Deadlift | Volume | REST |

### Her Schedule (Cardio/Mobility - 5 days)
| Mon | Tue | Wed | Thu | Fri | Sat/Sun |
|-----|-----|-----|-----|-----|---------|
| HIIT + Core | Lower + Mobility | Cardio Circuit | Upper + Core | Yoga/Recovery | REST |

## Grocery Stores (Edmonton)

Shopping priority:
1. **Costco** - Bulk proteins, pantry staples
2. **Safeway** - Sale meats, fresh produce
3. **Superstore** - Budget items, PC alternatives

Weekly budget: $150-200 CAD for 2 people

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
- **Project Context**: [../CLAUDE.md](../CLAUDE.md)
- **License**: Personal/household use only

## Production Status

**Status**: ✅ Production Ready

- 90 files deployed
- 16,565 lines of code
- 119 tests passing
- Security hardened
- Docker ready
- Documentation complete

Built with [Claude Code](https://claude.com/claude-code)
