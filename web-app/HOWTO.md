# FITNESS-TRACKER Web App - User Guide

A comprehensive fitness tracking PWA for household health management.

## Getting Started

### Installation

```bash
cd web-app
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### First-Time Setup

1. **With Supabase Auth**: Create an account or sign in
2. **Demo Mode**: Click "Skip for now" to explore with sample data

Demo mode includes two test users (Taylor & Dylan) with 30 days of pre-populated data.

---

## Features Overview

### Dashboard (`/`)

Your daily command center showing:
- **Nutrition Progress** - Calories, protein, carbs, fat, fiber with progress bars
- **Today's Weight** - Current weight with 7-day trend indicator
- **Workout Status** - Today's scheduled or completed workout
- **Workout Streak** - Consecutive days of exercise
- **Low Stock Alerts** - Pantry items needing restocking
- **Quick Actions** - Log Weight, Log Food, Start Workout buttons

### Quick Log (`/log`)

Three-tab interface for fast data entry:

#### Weight Tab
- Enter weight with +/- adjustment buttons
- Preset adjustments: -10, -5, -1, -0.5, +0.5, +1, +5, +10 lbs
- View 14-day progress chart
- See recent weight history

#### Food Tab
- Navigate by date (previous/today/next)
- Log meals by type (breakfast, lunch, dinner, snack)
- Track water intake
- View daily nutrition totals
- Quick-add recent foods

#### Workout Tab
- View today's scheduled workout
- Start workouts from suggested routines
- Mark exercises and workouts complete
- Track workout streak

### Workouts (`/workouts`)

Weekly workout management:
- **Calendar View** - 7-day grid with completion indicators
- **Day Details** - Expand to see full workout
- **Completion Toggle** - Mark workouts done
- **Routine Browser** - Access 30+ pre-built routines

#### Workout Indicators
- Green dot = Completed
- Yellow dot = In progress
- Blue dot = Scheduled
- No dot = Rest day

### Workout Routines (`/workouts/routines`)

Browse the routine library:
- **Strength** - Squat, bench, deadlift focused (8 routines)
- **Cardio** - Running, cycling, elliptical (6 routines)
- **HIIT** - Sprint intervals, tabata, circuits (8 routines)
- **Mobility** - Yoga, stretching, recovery (6 routines)

Each routine includes:
- Exercise list with sets/reps/weight
- Difficulty level
- Estimated duration
- Equipment needed
- Warmup and cooldown suggestions

### Meals (`/meals`)

View and plan daily meals:
- Date navigation
- Meal cards grouped by type
- Nutrition totals for the day
- "Log all meals" bulk action

### Pantry (`/pantry`)

Inventory management:
- **Categories**: Proteins, Dairy, Grains, Produce, Frozen, Condiments, Snacks, Supplements
- **Search** - Find items quickly
- **Low Stock Filter** - See what needs restocking
- **Quick Actions** - Adjust quantities with +/- buttons

### Recipes (`/recipes`)

Recipe browser with 100+ options:
- **Filter by Category** - Breakfast, Lunch, Dinner, Snacks
- **Search** - Name, ingredients, tags
- **Quick Filter** - Under 30 min prep
- **High Protein** - 25g+ per serving
- **Create Custom** - Add your own recipes

### Settings (`/settings`)

App configuration:
- **Theme** - Light, Dark, System
- **Color Accent** - Custom color picker
- **Household** - Manage family members

---

## Person Switching

The app supports multiple household members:

1. **Header Toggle** - Tap person pills to switch
2. **Per-Person Data** - Weight, workouts, food logged separately
3. **Shared Data** - Pantry and recipes are household-wide

---

## Data Persistence

### Demo Mode (No Login)
- Data stored in browser localStorage
- Persists until browser data cleared
- Pre-populated with 30 days of sample data

### Authenticated Mode (Supabase)
- Data synced to cloud database
- Accessible across devices
- Requires account creation

---

## Nutrition Tracking

### Daily Targets (Default)
| Macro | Target |
|-------|--------|
| Calories | 2,000 |
| Protein | 140g |
| Carbs | 200g |
| Fat | 65g |
| Fiber | 30g |

### Progress Indicators
- **Green** - On track (>80% of target)
- **Yellow** - Moderate (50-80%)
- **Red** - Low (<50%)

### Logging Food
1. Go to Log > Food tab
2. Tap + button
3. Enter food name and macros
4. Select meal type
5. Save

---

## Workout Scheduling

### Training Focus Types

**Powerlifting** (4 days/week)
- Monday: Squat Day
- Tuesday: Bench Day
- Wednesday: Rest
- Thursday: Deadlift Day
- Friday: Volume/Accessories
- Weekend: Rest

**Cardio** (5 days/week)
- Monday: HIIT + Core
- Tuesday: Lower Body + Mobility
- Wednesday: Cardio Circuit
- Thursday: Upper Body + Core
- Friday: Yoga/Active Recovery
- Weekend: Rest

**Mixed** (4 days/week)
- Balanced strength and cardio
- Flexible scheduling

---

## PWA Installation

### iOS (Safari)
1. Open app in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open app in Chrome
2. Tap menu (three dots)
3. Select "Add to Home Screen"
4. Tap "Add"

### Desktop (Chrome/Edge)
1. Look for install icon in address bar
2. Click "Install"

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-5` | Navigate to tab (Dashboard, Log, Workouts, Pantry, Settings) |
| `Esc` | Close modals |
| `Enter` | Submit forms |

---

## Troubleshooting

### Data Not Saving
- Check browser localStorage is enabled
- Try clearing site data and refreshing
- Ensure not in private/incognito mode (data won't persist)

### Demo Mode Showing Wrong Data
- Clear localStorage: DevTools > Application > Storage > Clear site data
- Refresh the page

### PWA Not Installing
- Ensure using HTTPS (or localhost for dev)
- Check browser supports PWA (Chrome, Edge, Safari)
- Clear browser cache and try again

### Supabase Connection Issues
- Verify `.env.local` has correct credentials
- Check Supabase project is active
- Review browser console for errors

---

## API Reference

### Weight
```
GET  /api/weight?person_id=xxx&date=yyyy-mm-dd
POST /api/weight { person_id, date, weight_lbs, notes }
DELETE /api/weight?id=xxx
```

### Workouts
```
GET  /api/workouts?person_id=xxx&start_date=xxx&end_date=xxx
POST /api/workouts { person_id, date, type, exercises, completed }
```

### Meals
```
GET  /api/meals?date=yyyy-mm-dd&person_id=xxx
POST /api/meals { date, meal_type, name, calories, protein_g, ... }
DELETE /api/meals?id=xxx
```

### Pantry
```
GET  /api/pantry
POST /api/pantry { name, category, quantity, unit }
PATCH /api/pantry { id, quantity }
DELETE /api/pantry?id=xxx
```

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Auth**: Supabase (optional)
- **Storage**: localStorage / Supabase
- **PWA**: Service Workers

---

## Support

For issues or feature requests, check the project's CLAUDE.md for development context and available agents.
