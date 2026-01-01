# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL: Working Guidelines

**BEFORE making ANY changes:**

1. **Read DEPLOYMENT.md** - Contains server-specific configuration (network names, paths, env vars)
2. **Use TodoWrite** - Track ALL tasks, mark progress, don't batch completions
3. **Use Agents** - Explore agent for codebase understanding, Plan agent before major changes
4. **Test First** - Run `npm run build` locally BEFORE pushing
5. **Commit Frequently** - Small, focused commits with clear messages
6. **Verify State** - Check actual server config before assuming anything

**NEVER change without verification:**
- Network names (server uses `proxy`, not `traefik-public`)
- Docker configurations
- Environment variable paths
- Deployment-specific settings

**If you don't know something:**
- ASK first
- Check DEPLOYMENT.md
- Use agents to explore
- DON'T guess or assume

## Project Overview

Personal fitness management PWA for a 2-person household in Edmonton, Alberta. The **web-app/** directory contains the primary Next.js application for tracking workouts, nutrition, weight, and pantry inventory.

**Primary Entry Point:** `web-app/` - Next.js 14 PWA (main application)

## Web App Status

**Status**: ~80% Complete - Production Ready for Local/PWA Use

**Stack**:
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS + clsx
- Supabase (optional authentication)
- SQLite/localStorage (demo mode)
- PWA-enabled with service workers

**Development**:
```bash
cd web-app
npm install
npm run dev    # Start dev server on port 3000
npm run build  # Production build
```

## Household Profile

| Person | Training Focus | Supplements | Notes |
|--------|---------------|-------------|-------|
| Him | Powerlifting (squat/bench/deadlift) | One-A-Day Men's | Heavy compounds, strength PRs, banana allergy |
| Her | Cardio, mobility, light strength | One-A-Day Women's + Metamucil | HIIT, yoga, toning |

**Shared:**
- Location: Edmonton, Alberta
- Home gym with half rack, adjustable bench, barbell, dumbbells

## Dietary Preferences

- **Banana allergy**: HIM only - no raw bananas (can eat banana bread/muffins). Substitute yellow kiwi.
- **Rice**: WHITE RICE ONLY - never brown rice
- **Bread**: Whole grain, cheapest quality option
- **Nut butter**: Use **PB Fit** (powdered) instead of peanut/almond butter
- **Protein bars**: **BUILT Marshmallow Bars** (Costco) preferred
- **Savory snacks**: Pepperoni sticks, beef jerky, pickled eggs
- **Protein target**: 140-180g per person daily
- **Fiber target**: 25-30g daily

## Training Schedules

### His Schedule (Powerlifting - 4 days)
| Mon | Tue | Wed | Thu | Fri | Sat/Sun |
|-----|-----|-----|-----|-----|---------|
| Squat | Bench | REST | Deadlift | Volume | REST |

### Her Schedule (Cardio/Mobility - 5 days)
| Mon | Tue | Wed | Thu | Fri | Sat/Sun |
|-----|-----|-----|-----|-----|---------|
| HIIT + Core | Lower + Mobility | Cardio Circuit | Upper + Core | Yoga/Recovery | REST |

## Web App Structure

```
web-app/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # Dashboard (main landing)
│   ├── log/page.tsx          # Quick logging (weight/food/workout tabs)
│   ├── workouts/             # Workout pages & routines
│   ├── meals/page.tsx        # Meal planning
│   ├── pantry/page.tsx       # Pantry inventory
│   ├── recipes/              # Recipe browser & creator
│   ├── settings/             # App settings & household
│   ├── auth/                 # Login/signup/reset
│   ├── debug/page.tsx        # Debug info
│   └── api/                  # API routes (REST endpoints)
├── components/               # React components
│   ├── navigation/           # Header, BottomNav
│   ├── providers/            # Auth, Person, Theme contexts
│   ├── cards/                # Display cards
│   ├── forms/                # Form components
│   ├── modals/               # Modal dialogs
│   ├── tracking/             # Tracking widgets
│   ├── charts/               # Visualizations
│   └── ui/                   # Base UI components
├── lib/                      # Utilities & data
│   ├── types.ts              # TypeScript interfaces
│   ├── demo-data.ts          # Demo mode data (Taylor/Dylan)
│   ├── supabase.ts           # Supabase client
│   ├── food-log.ts           # Nutrition utilities
│   ├── weight-log.ts         # Weight tracking
│   ├── workout-log.ts        # Workout utilities
│   ├── pantry-log.ts         # Pantry management
│   ├── recipes/              # 100+ pre-built recipes
│   └── workouts/             # 30+ workout routines
├── public/                   # Static assets & PWA
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icons/                # App icons
└── supabase/                 # Database migrations
```

## Key Features

### Implemented
- **Dashboard** - Daily overview with nutrition, workout, weight widgets
- **Quick Log** - Tabbed interface for weight, food, workout logging
- **Workouts** - Weekly calendar, 30+ routines, streak tracking
- **Recipes** - 100+ recipes with macro info, search, filtering
- **Pantry** - Inventory management, low-stock alerts
- **Settings** - Theme, household management
- **Auth** - Optional Supabase authentication
- **Demo Mode** - Full functionality without login (Taylor/Dylan test users)
- **PWA** - Installable, offline-capable

### Demo Mode
Click "Skip for now" on login to use demo mode with pre-populated data:
- **Taylor** (Female, Cardio focus) - 30yo, 5'1", 174 lbs
- **Dylan** (Male, Powerlifting focus) - 32yo, 5'10", 245 lbs
- 30 days of weight history
- Sample workouts and meals
- Full pantry inventory

## API Routes

All routes in `app/api/`:
- `GET/POST/DELETE /weight` - Weight entries
- `GET/POST /workouts` - Workout logging
- `GET/POST/DELETE /meals` - Food logging
- `GET/POST/PATCH/DELETE /pantry` - Pantry items
- `GET/POST/PUT/DELETE /persons` - Household members
- `GET/POST/DELETE /recipes` - User recipes

## Data Models

```typescript
Person { id, name, gender, age, height, weight, bmi, dailyCalorieTarget, training_focus, workoutDaysPerWeek, householdId }
Workout { id, person_id, date, type, exercises[], duration_minutes, intensity, completed }
WeightEntry { id, person_id, date, weight_lbs, notes }
Meal { id, date, meal_type, name, calories, protein_g, carbs_g, fat_g, fiber_g }
PantryItem { id, name, category, quantity, unit, location, low_stock_threshold }
Recipe { id, name, category, ingredients[], instructions[], nutrition, servings }
```

## Context Providers

- **AuthProvider** - Supabase auth state, login/logout
- **PersonProvider** - Current person, household switching, demo mode
- **ThemeProvider** - Light/dark/system themes

## Available Agents

Four agents in `.claude/agents/` for planning assistance:

| Agent | Purpose |
|-------|---------|
| **meal-planner** | Create weekly meal plans, generate grocery lists |
| **workout-planner** | Generate personalized workout schedules |
| **nutritionist** | Review nutrition, suggest improvements |
| **data-manager** | Manage tracking data, generate reports |

## Quick Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |

## Grocery Stores (Edmonton)

Shopping priority:
1. **Costco** - Bulk proteins, pantry staples
2. **Safeway** - Sale meats, fresh produce
3. **Superstore** - Budget items, PC alternatives

Weekly budget: $150-200 CAD for 2 people

## Environment Variables

Create `.env.local` in web-app/:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Leave empty for demo-only mode (no authentication required).
