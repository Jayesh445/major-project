# Webhook Testing & Verification Guide

## Quick Test Procedure

Follow these steps to verify your webhook is working correctly.

---

## ✅ Step 1: Verify Setup

### Check Environment Variable

```bash
# In backend/.env, you should have:
ALCHEMY_WEBHOOK_SIGNING_KEY=whk_your_key_here

# Verify it's set
grep ALCHEMY_WEBHOOK_SIGNING_KEY backend/.env
```

### Restart Backend

```bash
# Stop current process (Ctrl+C)
# Start again with dev mode
npm run dev

# You should see:
# [BlockchainWorker] Started — polling pending logs every 30s
# [Server] listening on port 5000
# ✓ MongoDB connected
```

---

## ✅ Step 2: Create a Test PO

### Via Frontend

1. Go to `http://localhost:3000/dashboard/procurement/orders/new`
2. Fill out the form:
   - Supplier: Select any
   - Warehouse: Select any
   - Product: Select any
   - Quantity: 10
   - Unit Price: 1000
3. Click "Create Purchase Order"
4. Note the PO number or ID

### Via API (Alternative)

```bash
curl -X POST http://localhost:5000/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "poNumber": "PO-TEST-001",
    "supplier": "supplier_id",
    "warehouse": "warehouse_id",
    "lineItems": [
      {
        "sku": "SKU-123",
        "productName": "Test Product",
        "orderedQty": 10,
        "unitPrice": 1000,
        "totalPrice": 10000
      }
    ],
    "totalAmount": 10000,
    "currency": "INR"
  }'
```

---

## ✅ Step 3: Monitor Backend Logs

### Look for Transaction Submission

```
[Blockchain] Creating log for po_created
[Blockchain] Transaction submitted: 0x1234567890abcdef...
[BlockchainLog] Created pending log for PO-TEST-001
```

### Get Transaction Hash

Copy the transaction hash (`0x1234567890abcdef...`) for the next steps.

---

## ✅ Step 4: Verify Transaction on Etherscan

### Check Testnet Etherscan

1. Go to https://sepolia.etherscan.io
2. Paste transaction hash in search
3. You should see:
   - ✅ Status: Success (green checkmark)
   - Block: #5678901
   - Timestamp: Recent

### If Still Pending

The transaction might not be confirmed yet:
- Wait 12-30 seconds for Sepolia confirmation
- Refresh Etherscan page
- Return to step 4

---

## ✅ Step 5: Check MongoDB for Webhook Update

### Query Pending Transactions

```bash
# Connect to MongoDB
mongosh  # or mongo for older versions

# Switch to your database
use autostock_db

# Find pending transactions
db.blockchaincreatelogs.find({ confirmationStatus: "pending" })

# Should show:
{
  _id: ObjectId("..."),
  txHash: "0x1234...",
  confirmationStatus: "pending",  // ← Still pending
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  // ... other fields
}
```

### Check for Confirmed Transactions

```bash
# After webhook fires (12-25 seconds)
db.blockchaincreatelogs.find({ confirmationStatus: "confirmed" })

# Should show:
{
  _id: ObjectId("..."),
  txHash: "0x1234...",
  blockNumber: 5678901,       // ← Updated by webhook
  blockHash: "0xabcdef...",   // ← Updated by webhook
  confirmationStatus: "confirmed",  // ← Updated!
  confirmedAt: ISODate("2024-01-15T10:31:15Z"),  // ← Timestamp from webhook
  updatedAt: ISODate("2024-01-15T10:31:15Z"),    // ← Recent
}
```

---

## ✅ Step 6: Check Frontend Status

### View Pending Transactions Dashboard

1. Go to `http://localhost:3000/dashboard/dev-tools/pending-transactions`
2. You should see:
   - **Pending section:** Shows your transaction with spinning loader
   - **Transaction hash:** 0x1234...
   - **Event type:** po_created
   - **View on Etherscan button:** Links to Sepolia explorer

### Wait for Status Update

- Frontend polls every 5 seconds
- Within 30 seconds, transaction should move to "Confirmed" section
- Status badge changes from "Confirming..." to "Confirmed"

### If Status Updates Instantly

🎉 **Webhook is working!** The status updated from webhook, not polling.

---

## ✅ Step 7: View PO Details

### Check PO Details Page

1. Go to `http://localhost:3000/dashboard/procurement/orders`
2. Click on your new PO
3. Should show:
   - Status: "Verified" or "Confirmed"
   - Transaction hash with link
   - Block number: #5678901
   - "View on Etherscan" button
   - Green checkmark icon

---

## 🔍 Advanced Verification

### Check Alchemy Webhook History

1. Go to https://dashboard.alchemy.com
2. Select your app
3. Settings → Webhooks
4. Click your webhook
5. View **History** tab
6. You should see webhook calls with:
   - Block number matching your transaction
   - Status: 200 (success)
   - Request body contains your transaction hash
   - Timestamp within the last few minutes

### Manual Webhook Test

If you want to test webhook without waiting for real blockchain:

```bash
# 1. Get a pending tx hash from MongoDB
db.blockchaincreatelogs.findOne({ confirmationStatus: "pending" })
# Copy the txHash value

# 2. Send test webhook request
curl -X POST http://localhost:5000/api/blockchain/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "webhookId": "whk_test",
    "id": "evt_test",
    "createdAt": "2024-01-15T10:30:00Z",
    "type": "block",
    "block": {
      "hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      "number": 5678901,
      "timestamp": 1705318200,
      "logs": [
        {
          "data": "0x0000000000000000000000000000000000000000000000000000000000000001",
          "topics": ["0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"],
          "index": 0,
          "account": {
            "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
          },
          "transaction": {
            "hash": "0x<YOUR_PENDING_TX_HASH>",
            "nonce": 42,
            "index": 5,
            "from": { "address": "0x1111111111111111111111111111111111111111" },
            "to": { "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
            "value": "0",
            "gasPrice": "20000000000",
            "maxFeePerGas": "30000000000",
            "maxPriorityFeePerGas": "2000000000",
            "gas": "65000",
            "status": 1,
            "gasUsed": "52000",
            "cumulativeGasUsed": "1234567",
            "effectiveGasPrice": "22000000000"
          }
        }
      ]
    }
  }'

# 3. Check response
# Should return: { "received": true, "logsProcessed": 1 }

# 4. Query MongoDB to verify update
db.blockchaincreatelogs.findOne({ txHash: "0x<YOUR_TX_HASH>" })
# Should show: confirmationStatus: "confirmed", blockNumber: 5678901
```

---

## 🧪 Automated Test Script

Create `test-webhook.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'  # No Color

echo "🧪 Webhook Testing Script"
echo "========================="

# 1. Check environment
echo -n "✓ Checking ALCHEMY_WEBHOOK_SIGNING_KEY... "
if grep -q "ALCHEMY_WEBHOOK_SIGNING_KEY" backend/.env; then
  echo -e "${GREEN}Found${NC}"
else
  echo -e "${RED}Not found${NC}"
  exit 1
fi

# 2. Check backend is running
echo -n "✓ Checking backend on port 5000... "
if curl -s http://localhost:5000/health > /dev/null; then
  echo -e "${GREEN}Running${NC}"
else
  echo -e "${RED}Not running${NC}"
  exit 1
fi

# 3. Get pending transaction
echo -n "✓ Finding pending transaction in MongoDB... "
TX_HASH=$(mongosh --eval "
  use autostock_db
  db.blockchaincreatelogs.findOne({ confirmationStatus: 'pending' })?.txHash
" --quiet | tr -d '"\n')

if [ -z "$TX_HASH" ]; then
  echo -e "${RED}No pending transactions found${NC}"
  exit 1
fi
echo -e "${GREEN}Found: $TX_HASH${NC}"

# 4. Send test webhook
echo "✓ Sending test webhook..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/blockchain/webhook \
  -H "Content-Type: application/json" \
  -d "{
    \"webhookId\": \"whk_test\",
    \"id\": \"evt_test\",
    \"createdAt\": \"2024-01-15T10:30:00Z\",
    \"type\": \"block\",
    \"block\": {
      \"hash\": \"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890\",
      \"number\": 5678901,
      \"timestamp\": 1705318200,
      \"logs\": [
        {
          \"data\": \"0x0000000000000000000000000000000000000000000000000000000000000001\",
          \"topics\": [\"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925\"],
          \"index\": 0,
          \"account\": { \"address\": \"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48\" },
          \"transaction\": {
            \"hash\": \"$TX_HASH\",
            \"nonce\": 42,
            \"index\": 5,
            \"from\": { \"address\": \"0x1111111111111111111111111111111111111111\" },
            \"to\": { \"address\": \"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48\" },
            \"value\": \"0\",
            \"gasPrice\": \"20000000000\",
            \"gas\": \"65000\",
            \"status\": 1,
            \"gasUsed\": \"52000\",
            \"cumulativeGasUsed\": \"1234567\",
            \"effectiveGasPrice\": \"20000000000\"
          }
        }
      ]
    }
  }")

echo "Response: $RESPONSE"

# 5. Verify update
echo -n "✓ Verifying MongoDB update... "
STATUS=$(mongosh --eval "
  use autostock_db
  db.blockchaincreatelogs.findOne({ txHash: '$TX_HASH' })?.confirmationStatus
" --quiet | tr -d '"\n')

if [ "$STATUS" = "confirmed" ]; then
  echo -e "${GREEN}SUCCESS! Status is 'confirmed'${NC}"
  echo ""
  echo "✅ Webhook is working correctly!"
else
  echo -e "${RED}FAILED! Status is '$STATUS'${NC}"
  exit 1
fi
```

Run it:
```bash
chmod +x test-webhook.sh
./test-webhook.sh
```

---

## 📋 Checklist

- [ ] Environment variable `ALCHEMY_WEBHOOK_SIGNING_KEY` set
- [ ] Backend restarted
- [ ] Created a test PO
- [ ] Transaction confirmed on Etherscan (12-30 seconds)
- [ ] MongoDB shows `confirmationStatus: "confirmed"`
- [ ] Frontend shows "Verified" status
- [ ] Backend logs show `[AlchemyWebhook]` messages
- [ ] Alchemy dashboard shows webhook history
- [ ] Manual webhook test successful (optional)

---

## 🎉 Success Indicators

✅ **Webhook is working if:**
- Backend logs show: `[AlchemyWebhook] ✓ Confirmed: po_created tx=...`
- MongoDB record shows: `blockHash`, `blockNumber`, `confirmedAt`
- Frontend status updates within 20-25 seconds
- Alchemy dashboard shows successful webhook calls

---

## 🚨 If Tests Fail

### Check Backend Logs

```bash
npm run dev

# Look for errors like:
# [AlchemyWebhook] Error processing block: ...
# [Webhook] Invalid webhook event structure
# [Webhook] Failed to process: ...
```

### Common Issues

| Error | Fix |
|-------|-----|
| 401 Unauthorized | Verify signing key matches Alchemy |
| No webhook calls in Alchemy dashboard | Webhook not registered or URL wrong |
| MongoDB update fails | Check blockHash field exists in schema |
| Status not updating after 30s | Webhook may be disabled, check logs |

---

## 📊 Performance Baseline

After successful test, you should see:

| Metric | Target | Actual |
|--------|--------|--------|
| TX submission to mempool | <1s | ? |
| Mempool to block | 3-6s | ? |
| Block to confirmation | 12-15s | ? |
| Confirmation to webhook | 0-5s | ? |
| Webhook processing | <100ms | ? |
| Frontend update | 5s (next poll) | ? |
| **Total time to "Verified"** | **~20-25s** | ? |

---

## 📞 Debugging

### Enable Debug Logging

Add to `backend/src/modules/blockchain/webhook.service.ts`:

```typescript
console.log('[DEBUG] Webhook event:', JSON.stringify(webhookEvent, null, 2))
console.log('[DEBUG] Processing block:', blockNumber)
console.log('[DEBUG] Found log:', blockchainLog)
```

### Monitor in Real-Time

```bash
# Terminal 1: Start backend
npm run dev 2>&1 | grep -E "AlchemyWebhook|BlockchainWorker"

# Terminal 2: Create PO and watch logs
# Terminal 3: Query MongoDB
mongosh autostock_db
db.blockchaincreatelogs.findOne({}, { sort: { createdAt: -1 } })
```

---

## ✨ Next Steps After Verification

Once webhook is confirmed working:

1. ✅ Test with multiple POs simultaneously
2. ✅ Verify failed transactions are marked as "failed"
3. ✅ Test frontend "View on Etherscan" links
4. ✅ Monitor webhook history in Alchemy dashboard
5. ✅ Deploy to production with same signing key

---

That's it! Your webhook is now ready for production use. 🚀
