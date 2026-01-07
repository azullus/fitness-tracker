#!/bin/bash
# Database Reset Script for FITNESS-TRACKER
# Removes stale Taylor/Dylan data and resets to clean state

set -e

echo "=========================================="
echo "FITNESS-TRACKER Database Reset"
echo "=========================================="
echo ""
echo "This will:"
echo "  1. Stop the fitness-tracker container"
echo "  2. Delete the SQLite database"
echo "  3. Restart the container (new DB will be created)"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Step 1: Stopping container..."
docker-compose stop fitness-tracker

echo ""
echo "Step 2: Deleting SQLite database..."
docker exec fitness-tracker rm -f /app/data/fitness.db 2>/dev/null || echo "Database already deleted or doesn't exist"

echo ""
echo "Step 3: Restarting container..."
docker-compose start fitness-tracker

echo ""
echo "Step 4: Waiting for health check..."
sleep 10

echo ""
echo "Step 5: Checking container status..."
docker ps | grep fitness-tracker

echo ""
echo "=========================================="
echo "Database Reset Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Visit https://fitness.cosmicbytez.ca"
echo "  2. Login with your Supabase account"
echo "  3. You should see the onboarding wizard"
echo "  4. Create your household profile"
echo ""
echo "Note: Demo mode will still work with generic 'Demo User'"
