# FITNESS-TRACKER Completion Plan

**Current Status**: ~40% Complete
**Target**: Production-Ready PWA

---

## Phase 1: Critical Fixes (Week 1)

### 1.1 Data Persistence & Security
- [ ] Fix Supabase integration - verify schema deployed
- [ ] Add API authentication/authorization to all routes
- [ ] Fix race conditions in pantry PATCH and weight upsert
- [ ] Add JSON parsing error handling in database.ts
- [ ] Validate foreign key relationships at API level

### 1.2 Core Stability
- [ ] Add error boundaries to root layout and critical pages
- [ ] Fix silent fallback to demo data - show user warnings
- [ ] Add date format validation to all routes
- [ ] Add numeric range validation (weight, macros, ages)

**Deliverable**: Stable data layer with proper error handling

---

## Phase 2: Missing Features (Week 2)

### 2.1 Profile Management
- [ ] Implement `/settings/profile` page (currently disabled)
- [ ] Allow editing: age, height, weight, training focus, calorie targets
- [ ] Sync profile changes to Supabase

### 2.2 Meal Planning
- [ ] Add PATCH endpoint for meals (update existing)
- [ ] Implement recipe-to-meal logging
- [ ] Add weekly meal plan generation
- [ ] Generate grocery lists from meal plans

### 2.3 Pantry Improvements
- [ ] Add expiration date UI (field exists, no display)
- [ ] Implement low stock alerts properly
- [ ] Add recipe ingredient auto-deduction

### 2.4 Workout Management
- [ ] Add edit/delete for user-created workouts
- [ ] Implement exercise history/PRs tracking
- [ ] Add custom workout creation from scratch

**Deliverable**: Feature-complete core functionality

---

## Phase 3: Performance Optimization (Week 3)

### 3.1 Bundle Size Reduction (~400KB savings)
- [ ] Convert recipe data from JS to JSON (531KB -> lazy loaded)
- [ ] Extract dashboard sub-components (ProgressBar, QuickActionButton, DashboardWidget)
- [ ] Split log/page.tsx into WeightLogger, FoodLogger, WorkoutLogger
- [ ] Lazy load OnboardingWizard, charts, modals

### 3.2 Code Quality
- [ ] Remove 60+ console.error statements
- [ ] Consolidate duplicate code (meal type config, date formatting)
- [ ] Add proper TypeScript types for API responses
- [ ] Remove unused imports (lucide icons)

### 3.3 State Management
- [ ] Split PersonProvider into focused hooks
- [ ] Extract initialization logic to custom hooks
- [ ] Add proper memoization for expensive calculations

**Deliverable**: 50% faster initial load, cleaner codebase

---

## Phase 4: Polish & UX (Week 4)

### 4.1 Progress Tracking
- [ ] Build analytics/progress page
- [ ] Add weight trend charts (expanded from current)
- [ ] Add workout compliance trends
- [ ] Add nutrition macro trends over time

### 4.2 User Experience
- [ ] Add skeleton screens during data fetch
- [ ] Implement optimistic UI updates
- [ ] Add retry logic for failed operations
- [ ] Improve mobile responsiveness

### 4.3 Accessibility
- [ ] Add ARIA labels to complex components
- [ ] Fix color-only indicators
- [ ] Add skip links for navigation
- [ ] Associate form labels correctly

**Deliverable**: Polished, accessible user experience

---

## Phase 5: Advanced Features (Optional)

### 5.1 Notifications
- [ ] Implement push notification support
- [ ] Add workout/meal reminders
- [ ] Low stock pantry alerts

### 5.2 Integrations
- [ ] CSV import/export for Obsidian sync
- [ ] Food database integration (USDA/Nutritionix)
- [ ] Barcode scanning for food logging

### 5.3 MCP Integration (See MCP-RECOMMENDATIONS.md)
- [ ] Supabase MCP for database operations
- [ ] OpenNutrition MCP for food database
- [ ] wger MCP for exercise database

---

## Git Worktree Assignments

| Branch | Focus Area | Primary Work |
|--------|------------|--------------|
| `main` | Production | Stable releases only |
| `feature/ui-improvements` | Phase 3-4 | Component extraction, UX polish |
| `feature/api-optimization` | Phase 1-2 | API fixes, data layer |
| `feature/testing` | All phases | Test coverage, validation |
| `bugfix/current` | Urgent | Hot fixes, critical bugs |

---

## Troubleshooting Team

When issues arise, spawn agents in parallel:

```
Agent 1 (Explore): Identify root cause in codebase
Agent 2 (Explore): Check related files for side effects
Agent 3 (general-purpose): Research solutions/best practices
Agent 4 (Plan): Design fix approach if complex
```

See TROUBLESHOOTING-WORKFLOW.md for detailed process.

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Feature Completion | 40% | 100% |
| Bundle Size | ~1.2MB | <800KB |
| Initial Load | ~3s | <1.5s |
| Lighthouse Score | ~70 | >90 |
| Test Coverage | 0% | >60% |
| API Error Handling | Partial | Complete |

---

## Key Files to Monitor

| File | Issue | Priority |
|------|-------|----------|
| `app/api/*/route.ts` | Security, validation | Critical |
| `lib/database.ts` | Race conditions, JSON parsing | Critical |
| `components/providers/PersonProvider.tsx` | State management | High |
| `app/page.tsx` | Bundle size (1,143 lines) | High |
| `lib/recipes/*.ts` | Bundle size (531KB) | High |
| `lib/types.ts` | Missing types | Medium |
