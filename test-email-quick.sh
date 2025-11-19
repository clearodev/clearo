#!/bin/bash

# Quick Email Test Script
# Tests AWS SES email sending

API_URL="http://localhost:3003"
EMAIL="${1:-test@example.com}"

echo "🧪 Testing Email Functionality"
echo "================================"
echo ""
echo "API URL: $API_URL"
echo "Test Email: $EMAIL"
echo ""

# Test 1: Password Reset Email
echo "📧 Test 1: Password Reset Email"
echo "--------------------------------"
RESULT=$(curl -s -X POST "$API_URL/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESULT" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESULT" | grep -v "HTTP_STATUS")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Success: $BODY"
  echo "📬 Check your inbox at: $EMAIL"
else
  echo "❌ Failed (HTTP $HTTP_STATUS): $BODY"
fi

echo ""
echo "================================"
echo ""
echo "💡 Next Steps:"
echo "   1. Check your email inbox: $EMAIL"
echo "   2. Check spam folder if not in inbox"
echo "   3. Click the reset link in the email"
echo ""
echo "📋 To test signup (verification email):"
echo "   curl -X POST $API_URL/api/auth/signup \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"$EMAIL\",\"username\":\"testuser\",\"password\":\"Test123456\"}'"
echo ""

