#!/bin/bash
# Test script to verify API endpoints on live site
# Usage: ./test-api-live.sh [URL]
# Example: ./test-api-live.sh https://your-fitness-tracker.example.com

SITE_URL="${1:-http://localhost:3000}"

echo "Testing Fitness Tracker API at $SITE_URL"
echo "========================================="

# Test 1: Health check
echo -e "\n1. Testing health check..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/")
if [ "$STATUS" = "200" ]; then
  echo "✓ Site is up (HTTP $STATUS)"
else
  echo "✗ Site returned HTTP $STATUS"
fi

# Test 2: GET persons (should work in demo mode)
echo -e "\n2. Testing GET /api/persons..."
RESPONSE=$(curl -s "$SITE_URL/api/persons")
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# Test 3: DELETE without auth (should fail with 401/403)
echo -e "\n3. Testing DELETE /api/persons without auth..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$SITE_URL/api/persons?id=test")
if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ] || [ "$STATUS" = "400" ]; then
  echo "✓ Unauthorized DELETE properly rejected (HTTP $STATUS)"
else
  echo "✗ Unexpected status: HTTP $STATUS"
fi

# Test 4: Check CSRF endpoint
echo -e "\n4. Testing CSRF token endpoint..."
CSRF_RESPONSE=$(curl -s "$SITE_URL/api/csrf")
echo "$CSRF_RESPONSE" | jq . 2>/dev/null || echo "$CSRF_RESPONSE"

echo -e "\n========================================="
echo "Testing complete!"
echo ""
echo "To test authenticated deletion, you need to:"
echo "1. Login to the site in browser"
echo "2. Open DevTools (F12) → Network tab"
echo "3. Try to delete a person"
echo "4. Check the DELETE request response"
