# Troubleshooting Workflow

Standard process for investigating and fixing issues in FITNESS-TRACKER.

---

## Quick Response Team

When an issue is reported, spawn these agents in parallel:

### Agent 1: Root Cause Analysis
```
Task: Explore agent
Purpose: Find the source of the bug
Focus: Search for error patterns, trace data flow, identify failing code
```

### Agent 2: Impact Assessment
```
Task: Explore agent
Purpose: Check related files for side effects
Focus: Find all files that import/use the affected code
```

### Agent 3: Solution Research
```
Task: general-purpose agent
Purpose: Research best practices and solutions
Focus: Web search for similar issues, check documentation
```

### Agent 4: Fix Planning (if complex)
```
Task: Plan agent
Purpose: Design fix approach for multi-file changes
Focus: Identify all changes needed, order of operations
```

---

## Issue Categories

### Category A: Data Not Saving
**Symptoms**: User data disappears, changes not persisting
**Check**:
1. localStorage keys in browser DevTools
2. Supabase dashboard for data
3. API route error handling
4. Network tab for failed requests

**Common Fixes**:
- Check `DEMO_MODE_KEY` in localStorage
- Verify Supabase credentials in `.env.local`
- Check API route error responses

### Category B: UI Not Updating
**Symptoms**: State changes but UI doesn't reflect
**Check**:
1. React DevTools for state
2. useMemo/useCallback dependencies
3. Context provider value changes
4. Component re-render triggers

**Common Fixes**:
- Add missing dependencies to hooks
- Check state mutation vs new object
- Verify context provider wrapping

### Category C: Auth Issues
**Symptoms**: Login fails, session lost, demo mode stuck
**Check**:
1. Supabase auth logs
2. localStorage auth keys
3. AuthProvider state
4. Cookie settings

**Common Fixes**:
- Clear localStorage and retry
- Check Supabase project settings
- Verify redirect URLs

### Category D: Performance Issues
**Symptoms**: Slow load, laggy UI, high memory
**Check**:
1. React DevTools Profiler
2. Network waterfall
3. Bundle analyzer
4. Memory tab in DevTools

**Common Fixes**:
- Add memoization
- Lazy load components
- Reduce re-renders
- Split large files

---

## Debug Commands

### Check Current State
```bash
# View git status
cd /mnt/c/Obsidian && git status

# Check running dev servers
lsof -i:3000,3001

# View recent commits
git log --oneline -10

# Check worktree status
git worktree list
```

### Quick Fixes
```bash
# Clear Next.js cache
rm -rf .next/cache

# Restart dev server
lsof -ti:3000 | xargs kill -9; npm run dev

# Reset localStorage (in browser console)
localStorage.clear(); location.reload();
```

### Debugging
```bash
# Run with verbose logging
DEBUG=* npm run dev

# Check TypeScript errors
npx tsc --noEmit

# Lint check
npm run lint
```

---

## Escalation Path

1. **Level 1**: Single agent investigates
2. **Level 2**: Parallel agents (root cause + impact)
3. **Level 3**: Full team (all 4 agents)
4. **Level 4**: Architecture review (Plan agent designs solution)

---

## Post-Fix Checklist

- [ ] Root cause identified and documented
- [ ] Fix tested in dev environment
- [ ] Related areas checked for side effects
- [ ] Changes committed to appropriate branch
- [ ] COMPLETION-PLAN.md updated if needed
