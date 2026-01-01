# Fitness Tracker - Production Deployment Guide

## Overview

This guide covers deploying the Fitness Tracker PWA on a home server with:
- Docker containerization
- Traefik reverse proxy with automatic HTTPS
- SQLite database (no external dependencies)
- Automatic daily backups
- Optional auto-updates via Watchtower

---

## Prerequisites

- Docker & Docker Compose installed
- Domain pointing to your server (or use Cloudflare Tunnel)
- Ports 80 and 443 available

---

## Quick Start (5 minutes)

### 1. Clone and Configure

```bash
# On your server
git clone <your-repo> fitness-tracker
cd fitness-tracker/web-app

# Copy and edit environment file
cp .env.production .env
nano .env
```

Edit `.env`:
```env
DOMAIN=fitness.yourdomain.com
APP_URL=https://fitness.yourdomain.com
ACME_EMAIL=your-email@domain.com
```

### 2. Create Docker Network

```bash
docker network create traefik-public
```

### 3. Deploy

**Option A: Full stack (includes Traefik)**
```bash
docker compose up -d
```

**Option B: App only (if Traefik already running)**
```bash
docker compose -f docker-compose.standalone.yml up -d
```

### 4. Verify

```bash
# Check containers
docker compose ps

# View logs
docker compose logs -f fitness-tracker

# Test health
curl -I https://fitness.yourdomain.com
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    ┌─────▼─────┐
                    │  Traefik  │ ← Automatic HTTPS (Let's Encrypt)
                    │  :80/:443 │
                    └─────┬─────┘
                          │
              ┌───────────▼───────────┐
              │   Fitness Tracker     │
              │      Next.js          │
              │       :3000           │
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │   SQLite Database     │
              │   /app/data/          │
              │   (Docker Volume)     │
              └───────────────────────┘
                          │
              ┌───────────▼───────────┐
              │   Daily Backups       │
              │   (7-day retention)   │
              └───────────────────────┘
```

---

## Configuration Options

### SQLite Mode (Default)
- No external dependencies
- Data stored in Docker volume
- Perfect for household use (1-10 users)
- Automatic daily backups

### Supabase Mode (Optional)
For multi-device sync and cloud backup, add to `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

---

## Maintenance

### View Logs
```bash
docker compose logs -f fitness-tracker
```

### Manual Backup
```bash
# Copy SQLite database from volume
docker cp fitness-tracker:/app/data/fitness.db ./backup-$(date +%Y%m%d).db
```

### Restore Backup
```bash
# Stop app
docker compose stop fitness-tracker

# Restore database
docker cp ./backup-20240101.db fitness-tracker:/app/data/fitness.db

# Start app
docker compose start fitness-tracker
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build
```

### Access Backups
```bash
# List backups
docker run --rm -v fitness-tracker-backups:/backups alpine ls -la /backups

# Copy backup to host
docker run --rm -v fitness-tracker-backups:/backups -v $(pwd):/host alpine \
  cp /backups/fitness_20240101_120000.db /host/
```

---

## Security Hardening

### 1. Firewall (UFW)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2ban for Traefik
```bash
# /etc/fail2ban/jail.local
[traefik-auth]
enabled = true
filter = traefik-auth
logpath = /var/log/traefik/access.log
maxretry = 5
bantime = 3600
```

### 3. Regular Updates
```bash
# Enable Watchtower auto-updates (already in docker-compose)
# Or manually:
docker compose pull
docker compose up -d
```

---

## Cloudflare Tunnel (Alternative to Port Forwarding)

If you can't open ports 80/443, use Cloudflare Tunnel:

```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create fitness-tracker

# Configure tunnel
cat > ~/.cloudflared/config.yml << EOF
tunnel: <tunnel-id>
credentials-file: /home/$USER/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: fitness.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run fitness-tracker

# Or as a service
sudo cloudflared service install
```

---

## Troubleshooting

### Container won't start
```bash
docker compose logs fitness-tracker
docker compose down
docker compose up -d
```

### SSL certificate issues
```bash
# Check Traefik logs
docker compose logs traefik

# Force certificate renewal
docker compose restart traefik
```

### Database corruption
```bash
# Restore from backup
docker compose stop fitness-tracker
docker run --rm -v fitness-tracker-backups:/backups -v fitness-tracker-data:/data alpine \
  cp /backups/fitness_LATEST.db /data/fitness.db
docker compose start fitness-tracker
```

### Port conflicts
```bash
# Check what's using ports
sudo lsof -i :80
sudo lsof -i :443
```

---

## Resource Usage

| Component | RAM | CPU | Disk |
|-----------|-----|-----|------|
| Fitness Tracker | ~150MB | Low | ~100MB |
| Traefik | ~50MB | Low | ~50MB |
| SQLite Database | N/A | N/A | ~10MB |
| Backups (7 days) | N/A | N/A | ~70MB |

**Total:** ~200MB RAM, minimal CPU, ~250MB disk

---

## Accessing Your App

Once deployed:
1. **Web:** https://fitness.yourdomain.com
2. **PWA:** Install from browser (Add to Home Screen)
3. **Mobile:** Works as installable app on iOS/Android

---

## Files Reference

| File | Purpose |
|------|---------|
| `Dockerfile` | Production container build |
| `docker-compose.yml` | Full stack (app + Traefik + backups) |
| `docker-compose.standalone.yml` | App only (existing Traefik) |
| `.env.production` | Environment template |
| `DEPLOY.md` | This guide |
