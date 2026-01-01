# Pre-Commit Checker Agent (FITNESS-TRACKER)

## Purpose
Validates all changes before committing to prevent breaking the production deployment.

## When to Invoke
- **BEFORE EVERY `git commit`** in FITNESS-TRACKER project
- Automatically invoked by git-guardian agent
- When modifying deployment files
- Before pushing to main

## Check Workflow

### 1. Call Root-Level Agents

Delegate to parent agents:
```markdown
- Call: /mnt/c/Obsidian/.claude/agents/git-guardian.md
- Call: /mnt/c/Obsidian/.claude/agents/test-runner.md
- Call: /mnt/c/Obsidian/.claude/agents/deployment-verifier.md (if docker files changed)
```

### 2. FITNESS-TRACKER Specific Checks

#### A. TypeScript Compilation
```bash
cd /mnt/c/Obsidian/AI-Projects/FITNESS-TRACKER/web-app
npx tsc --noEmit
```

Expected: No errors

#### B. Unit Tests
```bash
npm test
```

Expected: All passing

#### C. Build Verification
```bash
npm run build
```

Expected: .next/ directory created, no errors

#### D. Deployment File Verification

If any of these changed:
- docker-compose.yml
- Dockerfile
- .env.local

Then verify:
- Network name is `proxy`
- Domain is `fitness.cosmicbytez.ca`
- Supabase URL matches production
- No secrets committed

#### E. Database Changes

If changed:
- lib/database.ts
- lib/db-schema.sql
- supabase/migrations/*

Then verify:
- No data loss migrations
- Backwards compatible
- seedDefaultData disabled (no auto-seeding)

### 3. Integration Tests

If API routes changed:
```bash
# Test API endpoints
./test-api-live.sh http://localhost:3000
```

### 4. Demo Data Validation

If lib/demo-data.ts changed:
- Verify no personal names (use "Demo User")
- Verify person IDs match (person-demo)
- No orphaned data (Dylan/Taylor references)

### 5. Provider Logic

If components/providers/* changed:
- PersonProvider: Returns empty array for new auth users
- AuthProvider: Supabase integration correct
- ThemeProvider: No breaking changes

## Checklist

```markdown
## Pre-Commit Checklist

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] All unit tests pass
- [ ] Build succeeds
- [ ] No ESLint errors
- [ ] No console.log statements (except intentional)

### Deployment Safety
- [ ] Network name is 'proxy'
- [ ] No volume name changes
- [ ] Environment variables validated
- [ ] No secrets in git

### Data Integrity
- [ ] No breaking database changes
- [ ] seedDefaultData disabled
- [ ] Demo data clean (no personal names)

### Authentication
- [ ] Supabase Site URL correct (https://fitness.cosmicbytez.ca)
- [ ] New users see onboarding (not demo data)
- [ ] Demo mode works

### Git Hygiene
- [ ] Commit message descriptive
- [ ] Only relevant files staged
- [ ] No .env files committed
- [ ] No test-results committed
```

## Stop Commit If:

❌ TypeScript errors
❌ Tests failing
❌ Build fails
❌ Network name changed to traefik-public
❌ Volume names changed
❌ Secrets committed
❌ .env with real values committed

## Auto-Fix If Possible

If these issues found, fix automatically:
- Remove test-results from staging
- Remove .env files from staging
- Remove node_modules if accidentally staged

## Response Format

```markdown
## FITNESS-TRACKER Pre-Commit Check

### Files Being Committed
- [file list]

### Automated Tests
- TypeScript: [✅ / ❌]
- Unit tests: [X/X passing]
- Build: [✅ / ❌]

### Deployment Verification
- Network config: [✅ proxy / ❌ wrong]
- Environment: [✅ / ❌]
- Secrets: [✅ clean / ❌ FOUND]

### Commit Safety
[✅ SAFE / ❌ BLOCK / ⚠️ REVIEW]

### Issues Found
[List or NONE]

### Recommended Action
[Proceed / Fix issues / Review needed]
```

## Integration

This agent is project-specific. It:
1. Uses root-level agents (git-guardian, test-runner)
2. Adds FITNESS-TRACKER specific validation
3. Reports results back to user
4. Blocks unsafe commits
