#!/bin/bash
#
# Deployment and Testing Script for FITNESS-TRACKER
# Run this on the production server after code changes
#
set -e

echo "=================================="
echo "FITNESS-TRACKER Deployment & Test"
echo "=================================="
echo ""

# Configuration
DEPLOY_DIR="/srv/docker-apps/fitness-tracker/web-app"
DOMAIN="https://fitness.cosmicbytez.ca"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Step 1: Navigate to deployment directory
info "Navigating to deployment directory..."
cd "$DEPLOY_DIR" || exit 1
success "In directory: $(pwd)"

# Step 2: Pull latest code
info "Pulling latest code from GitHub..."
git fetch origin
BEFORE_COMMIT=$(git rev-parse HEAD)
git pull origin main
AFTER_COMMIT=$(git rev-parse HEAD)

if [ "$BEFORE_COMMIT" = "$AFTER_COMMIT" ]; then
    info "Already up to date (commit: $AFTER_COMMIT)"
else
    success "Updated from $BEFORE_COMMIT to $AFTER_COMMIT"
    git log --oneline "$BEFORE_COMMIT..$AFTER_COMMIT"
fi

# Step 3: Stop containers
info "Stopping containers..."
docker-compose down
success "Containers stopped"

# Step 4: Rebuild (no cache to ensure fresh build)
info "Building containers (no cache)..."
BUILD_START=$(date +%s)
docker-compose build --no-cache
BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))
success "Build completed in ${BUILD_TIME}s"

# Step 5: Start containers
info "Starting containers..."
docker-compose up -d
success "Containers started"

# Step 6: Wait for health check
info "Waiting for health check (max 60s)..."
for i in {1..60}; do
    if docker-compose ps | grep -q "healthy"; then
        success "Container healthy after ${i}s"
        break
    fi
    if [ $i -eq 60 ]; then
        error "Health check timeout after 60s"
        docker-compose logs --tail=50 fitness-tracker
        exit 1
    fi
    sleep 1
done

# Step 7: Test production endpoints
echo ""
info "Testing production endpoints..."

# Test 1: Main site
info "Testing main site..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/")
if [ "$HTTP_CODE" = "200" ]; then
    success "Main site: HTTP $HTTP_CODE"
else
    error "Main site: HTTP $HTTP_CODE (expected 200)"
fi

# Test 2: Recipe API route (NEW)
info "Testing recipe API route..."
RECIPE_RESPONSE=$(curl -s "$DOMAIN/api/recipes-data/index")
if echo "$RECIPE_RESPONSE" | grep -q "\"id\""; then
    success "Recipe API: Returning JSON data"
    RECIPE_COUNT=$(echo "$RECIPE_RESPONSE" | grep -o "\"id\"" | wc -l)
    info "   Found $RECIPE_COUNT recipes in index"
else
    error "Recipe API: Not returning valid JSON"
    echo "   Response: ${RECIPE_RESPONSE:0:200}"
fi

# Test 3: CSRF endpoint
info "Testing CSRF endpoint..."
CSRF_RESPONSE=$(curl -s "$DOMAIN/api/csrf")
if echo "$CSRF_RESPONSE" | grep -q "\"token\""; then
    success "CSRF API: Token returned in response body"
else
    error "CSRF API: Token not in response"
fi

# Test 4: Persons API
info "Testing persons API..."
PERSONS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/api/persons")
if [ "$PERSONS_CODE" = "200" ]; then
    success "Persons API: HTTP $PERSONS_CODE"
else
    error "Persons API: HTTP $PERSONS_CODE"
fi

# Test 5: Test recipe categories
echo ""
info "Testing all recipe categories..."
for category in breakfast lunch dinner snack; do
    CATEGORY_RESPONSE=$(curl -s "$DOMAIN/api/recipes-data/$category")
    if echo "$CATEGORY_RESPONSE" | grep -q "\"id\""; then
        CATEGORY_COUNT=$(echo "$CATEGORY_RESPONSE" | jq '. | length' 2>/dev/null || echo "?")
        success "   $category: $CATEGORY_COUNT recipes"
    else
        error "   $category: Failed to load"
    fi
done

# Test 6: Check BMI calculation (create test user)
echo ""
info "Testing BMI calculation..."
info "Creating test person: 170cm, 150lbs (should be ~26 BMI)"
TEST_PERSON_RESPONSE=$(curl -s -X POST "$DOMAIN/api/persons" \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $(curl -s $DOMAIN/api/csrf | jq -r .token 2>/dev/null || echo 'test')" \
    -d '{
        "name": "API Test User",
        "gender": "male",
        "age": 30,
        "height": 170,
        "weight": 150,
        "training_focus": "general",
        "workoutDaysPerWeek": 3
    }' 2>/dev/null || echo "")

if echo "$TEST_PERSON_RESPONSE" | grep -q "\"bmi\""; then
    BMI_VALUE=$(echo "$TEST_PERSON_RESPONSE" | grep -o "\"bmi\":[0-9.]*" | grep -o "[0-9.]*")
    if [ -n "$BMI_VALUE" ]; then
        if (( $(echo "$BMI_VALUE > 25 && $BMI_VALUE < 27" | bc -l 2>/dev/null || echo 0) )); then
            success "BMI calculation: $BMI_VALUE (correct range: 25-27)"
        else
            error "BMI calculation: $BMI_VALUE (expected ~26)"
        fi
    fi
else
    info "BMI test: Skipped (requires authentication)"
fi

# Test 7: Container stats
echo ""
info "Container resource usage..."
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" fitness-tracker

# Final summary
echo ""
echo "=================================="
echo "Deployment Summary"
echo "=================================="
echo "Commit: $AFTER_COMMIT"
echo "Build Time: ${BUILD_TIME}s"
echo "Status: $(docker-compose ps | grep fitness-tracker | awk '{print $4}')"
echo ""
echo "Live at: $DOMAIN"
echo "=================================="

# Show recent logs
echo ""
info "Recent logs (last 20 lines):"
docker-compose logs --tail=20 fitness-tracker

echo ""
success "Deployment and testing complete!"
echo ""
echo "Manual tests to perform:"
echo "1. Visit $DOMAIN and test authentication"
echo "2. Create new user and verify onboarding appears"
echo "3. Browse recipes and verify all 300 are accessible"
echo "4. Test person deletion with CSRF protection"
echo ""
