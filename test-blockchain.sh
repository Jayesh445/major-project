#!/bin/bash
# Simple blockchain test — avoids multi-line bash pitfalls

set -e

BACKEND="http://localhost:5000"
EMAIL="admin@autostock.ai"
PASSWORD="Admin@123"

echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Extract token using grep + sed (no node required)
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//;s/"$//')

if [ -z "$TOKEN" ]; then
  echo "ERROR: Login failed. Response:"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "   Token: ${TOKEN:0:30}..."

echo ""
echo "2. Submitting blockchain log..."
RESPONSE=$(curl -s -X POST "$BACKEND/api/internal/blockchain-logs" \
  -H "Content-Type: application/json" \
  -H "x-internal-api-key: internal-sc-ai-secret-key-2024" \
  -d '{"eventType":"po_created","referenceModel":"PurchaseOrder","referenceId":"69d88ada6e53869074a14967","payload":{"poNumber":"TEST-REAL","totalAmount":50000},"amount":50000}')

echo "$RESPONSE"

echo ""
echo "3. Extracting txHash..."
TX_HASH=$(echo "$RESPONSE" | grep -o '"txHash":"[^"]*"' | sed 's/"txHash":"//;s/"$//')
STATUS=$(echo "$RESPONSE" | grep -o '"confirmationStatus":"[^"]*"' | sed 's/"confirmationStatus":"//;s/"$//')

echo "   txHash: $TX_HASH"
echo "   status: $STATUS"

if [ "$STATUS" = "pending" ]; then
  echo ""
  echo "SUCCESS! Real Sepolia submission detected (status=pending)."
  echo "   View on Etherscan: https://sepolia.etherscan.io/tx/$TX_HASH"
  echo ""
  echo "4. Waiting 45s for confirmation..."
  sleep 45
  echo "   Checking log status..."
  curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND/api/blockchain/logs?limit=1" | head -c 400
  echo ""
elif [ "$STATUS" = "confirmed" ]; then
  echo ""
  echo "WARNING: Status is 'confirmed' immediately — this means the backend is still in OFFLINE FALLBACK mode."
  echo "   That hash is NOT on Sepolia. The backend needs to be restarted to pick up the new .env values."
  echo ""
  echo "   To fix: stop the backend (Ctrl+C) and restart with: cd D:/major-project/backend && npx tsx src/index.ts"
  echo "   You should see: '[BlockchainWorker] Started — polling pending logs every 30s'"
else
  echo "UNKNOWN status: $STATUS"
fi
