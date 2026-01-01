# DEPLOYMENT CONFIGURATION

**CRITICAL: READ THIS BEFORE MAKING ANY CHANGES**

## Server Setup (azu-docker01)

### Network Configuration
- **Traefik network name**: `proxy` (NOT `traefik-public`)
- **Network is external**: YES (already exists, managed by Traefik)
- **DO NOT CHANGE THIS** without checking `docker inspect traefik` first

### File Paths
- **Deployment location**: `/srv/docker-apps/fitness-tracker/web-app`
- **Docker compose**: `/srv/docker-apps/fitness-tracker/web-app/docker-compose.yml`
- **Git repo**: https://github.com/azullus/fitness-tracker

### Environment Variables
- Located in: `/srv/docker-apps/fitness-tracker/web-app/.env`
- Contains:
  - `DOMAIN=fitness.cosmicbytez.ca`
  - `SUPABASE_URL=https://qgynhdkgtkytkcuaztgu.supabase.co`
  - `SUPABASE_ANON_KEY=sb_publishable_...`
  - `APP_URL=https://fitness.cosmicbytez.ca`

### Supabase Configuration
- **Site URL**: `https://fitness.cosmicbytez.ca` (NOT `https:fitness...`)
- **Auth enabled**: YES
- **Database**: SQLite local + Supabase auth only

## BEFORE MAKING ANY CHANGES

1. **Check current state**:
   ```bash
   docker inspect traefik | grep -A 10 Networks
   docker ps -a | grep fitness
   cat docker-compose.yml | grep -A 5 networks:
   ```

2. **Use TodoWrite** to track ALL tasks

3. **Use agents** to verify configs:
   - Explore agent to check existing setup
   - Plan agent before major changes

4. **Test locally** with `npm run build` BEFORE pushing

5. **Commit frequently** with descriptive messages

## DEPLOYMENT PROCESS

```bash
cd /srv/docker-apps/fitness-tracker/web-app
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
docker-compose logs -f fitness-tracker
```

## NEVER CHANGE WITHOUT VERIFICATION

- Network names (use `proxy`)
- Traefik labels
- Volume names
- .env file location

## IF SOMETHING BREAKS

1. Check logs: `docker-compose logs fitness-tracker --tail=200`
2. Check container: `docker ps -a | grep fitness`
3. Check network: `docker network ls`
4. **DO NOT** guess - verify actual state first
