# Block-Based Webhook Implementation Guide

## Your Alchemy Webhook Configuration

You've created a sophisticated webhook that monitors **all events** from your contract in real-time. Here's how it works with your system:

---

## 📊 Webhook Architecture

### Alchemy Webhook Structure (What You Created)

```graphql
{
  block {
    hash,                    # Block hash: 0xabcd...
    number,                  # Block number: 5678901
    timestamp,               # Unix timestamp: 1705318200
    logs(filter: {
      addresses: ["0xa0b86..."]  # Your contract address
    }) {
      data,                  # Event data
      topics,                # Event signature
      index,                 # Log index in transaction
      account { address },   # Contract address
      transaction {          # Complete tx info
        hash,                # TX hash
        status,              # 1=success, 0=failed
        nonce,               # TX nonce
        from { address },    # Sender
        to { address },      # Recipient
        value,               # ETH value sent
        gas,                 # Gas limit
        gasUsed,             # Actual gas used
        gasPrice,            # Gas price
        # ... and more
      }
    }
  }
}
```

### What This Means

✅ **Fires for EVERY block containing your contract's events**
✅ **Includes full transaction details** (status, gas, etc)
✅ **No missed events** - catches all logs from your contract
✅ **Instant notification** - when block is finalized (~12-15 seconds on Ethereum)

---

## 🔄 Data Flow

### When a PO is Created

```
1. User creates PO in frontend
   ↓
2. Backend calls logEventOnChain()
   ├─ Submits transaction to blockchain
   ├─ Creates BlockchainLog with status='pending'
   └─ Returns txHash: 0x1234...
   ↓
3. Transaction enters mempool
   ↓
4. Validator picks up transaction
   ↓
5. Transaction is included in block (5678901)
   ├─ Block contains multiple transactions
   ├─ Your transaction generates log events
   └─ Block is finalized (~12-15 seconds)
   ↓
6. Alchemy detects block finalization
   ├─ Extracts all logs from block
   ├─ Filters for your contract address
   ├─ Includes all transaction details
   └─ Sends webhook POST
   ↓
7. Your backend receives webhook
   ├─ Verifies signature
   ├─ Finds BlockchainLog by txHash
   └─ Updates status to 'confirmed'
   ↓
8. Frontend polls (every 5s)
   └─ Sees status='confirmed'
   └─ Displays "Verified" ✅
```

---

## 📝 Log Entry Example

### Before Webhook (in MongoDB)

```javascript
{
  _id: ObjectId("507f..."),
  eventType: "po_created",
  referenceModel: "PurchaseOrder",
  referenceId: ObjectId("507f..."),
  txHash: "0x1234567890abcdef...",
  blockNumber: null,        // ← Not yet confirmed
  blockHash: null,          // ← Empty
  confirmationStatus: "pending",
  confirmedAt: null,
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

### After Webhook (Updated)

```javascript
{
  _id: ObjectId("507f..."),
  eventType: "po_created",
  referenceModel: "PurchaseOrder",
  referenceId: ObjectId("507f..."),
  txHash: "0x1234567890abcdef...",
  blockNumber: 5678901,     // ← Updated by webhook
  blockHash: "0xabcdef...", // ← Updated by webhook
  confirmationStatus: "confirmed",  // ← Updated
  confirmedAt: ISODate("2024-01-15T10:31:15Z"),  // ← Webhook timestamp
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  updatedAt: ISODate("2024-01-15T10:31:15Z")     // ← Updated
}
```

---

## 🚀 Setup (Final Steps)

### 1. Get Your Signing Key

Your webhook already exists in Alchemy. Now get the signing key:

1. Go to https://dashboard.alchemy.com
2. Select your Ethereum Sepolia app
3. Click **Settings** → **Webhooks**
4. Click your webhook to view details
5. Find **Signing Key** and copy it

### 2. Add to Environment

```bash
# backend/.env
ALCHEMY_WEBHOOK_SIGNING_KEY=whk_your_signing_key_from_alchemy
```

### 3. Restart Backend

```bash
# Stop current process (Ctrl+C)
# Then start again:
npm run dev

# Or with Docker:
docker-compose restart backend
```

### 4. Done! ✅

The webhook is now active. Monitor real-time confirmations by:

```bash
# Check backend logs
npm run dev
# Look for: [AlchemyWebhook] ✓ Confirmed: po_created tx=0x1234...
```

---

## 📈 How Your Data Gets Processed

### Webhook Handler Flow

```typescript
// 1. Alchemy sends POST to /api/blockchain/webhook
POST /api/blockchain/webhook {
  webhookId: "whk_123",
  id: "evt_456",
  block: {
    hash: "0xabcdef...",
    number: 5678901,
    timestamp: 1705318200,
    logs: [
      {
        transaction: {
          hash: "0x1234...",  // ← Your PO's tx
          status: 1,           // ← Success
          gasUsed: "52000"
        }
      },
      // ... other logs in this block
    ]
  }
}

// 2. Handler validates signature
const signature = req.headers['x-alchemy-signature']
if (!verifyAlchemySignature(body, signature, signingKey)) {
  return 401 Unauthorized
}

// 3. Process each log
for (log of block.logs) {
  txHash = log.transaction.hash
  
  // 4. Find our record
  blockchainLog = BlockchainLog.findOne({ txHash, status: 'pending' })
  
  // 5. Update status
  if (log.transaction.status === 1) {
    blockchainLog.confirmationStatus = 'confirmed'
    blockchainLog.blockNumber = 5678901
    blockchainLog.blockHash = '0xabcdef...'
    blockchainLog.confirmedAt = new Date(1705318200 * 1000)
    blockchainLog.save()
    
    console.log('[AlchemyWebhook] ✓ Confirmed: po_created tx=0x1234... block=5678901')
  }
}

// 6. Return 200 OK to Alchemy
return { received: true, logsProcessed: 42 }
```

---

## 🔍 Monitoring

### Check Webhook in Alchemy Dashboard

1. Settings → Webhooks
2. Click your webhook name
3. View **History** tab
4. See each block webhook sent:
   - Timestamp
   - Block number
   - Request/response bodies
   - Success/failure status

### Check Backend Logs

```bash
# Real-time logs (run dev server)
npm run dev

# Look for these messages:
[AlchemyWebhook] Processing block #5678901 with 42 logs
[AlchemyWebhook] ✓ Confirmed: po_created tx=0x1234... block=5678901
[AlchemyWebhook] ✓ Confirmed: negotiation_accepted tx=0x5678... block=5678901
[AlchemyWebhook] ✗ Failed: tx=0xabcd...
```

### Check MongoDB

```javascript
// Find recently confirmed transactions
db.blockchaincreatelogs
  .find({ confirmationStatus: 'confirmed' })
  .sort({ confirmedAt: -1 })
  .limit(10)
```

---

## ⏱️ Timing Breakdown

| Stage | Time | Notes |
|-------|------|-------|
| User submits PO | 0s | Creates transaction |
| TX in mempool | 0-2s | Waiting for inclusion |
| Block created | 3-6s | Validator includes TX |
| Block finalized | 12-15s | Consensus achieved |
| Webhook fires | 15-20s | Alchemy sends notification |
| Backend processes | <100ms | Updates MongoDB |
| Frontend polls | 5s intervals | Shows "Verified" |
| **Total to "Verified"** | **~20-25s** | Instant from webhook |

---

## 🛡️ Safety Features

### Signature Verification

Every webhook is signed with HMAC-SHA256:

```typescript
signature = HMAC-SHA256(requestBody, signingKey)
// Included in: x-alchemy-signature header

// Our code verifies:
if (hash !== signature) {
  return 401 Unauthorized  // Reject if not from Alchemy
}
```

### Idempotent Updates

Even if webhook fires twice for same block:

```typescript
// First call: finds pending → updates to confirmed
// Second call: finds confirmed → skips (already confirmed)
if (blockchainLog.confirmationStatus !== 'pending') {
  continue  // Skip already-processed logs
}
```

### Error Handling

- If webhook processing fails, we still return 200 OK to Alchemy (prevents retry loop)
- Errors logged but don't crash endpoint
- Fallback polling worker continues (30s intervals)

---

## 📊 Handling Multiple Logs in One Block

Your webhook can include multiple transaction logs:

```
Block #5678901 contains:
├─ Transaction 1 (your PO #1)
├─ Transaction 2 (your PO #2)
├─ Transaction 3 (your negotiation #5)
├─ Transaction 4 (other contract's TX - ignored)
└─ ... more transactions ...

Alchemy sends all logs from your contract to the webhook.
Our handler:
1. Processes log 1 → finds PO #1, updates status
2. Processes log 2 → finds PO #2, updates status
3. Processes log 3 → finds negotiation #5, updates status
4. Processes log 4 → not in our system, skips
5. Returns 200 to Alchemy
```

---

## 🚨 Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Webhook not processing | Signing key not set | Check `ALCHEMY_WEBHOOK_SIGNING_KEY` in `.env` |
| 401 Unauthorized | Invalid signature | Verify key matches Alchemy dashboard |
| Transactions not updating | Webhook not registered | Check Alchemy dashboard webhook exists |
| Backend crashes | Missing blockHash field | Run database migration (schema updated) |
| Still using polling | Webhook disabled | Check backend logs for webhook messages |

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `backend/src/modules/blockchain/webhook.service.ts` | Webhook handler and signature verification |
| `backend/src/modules/blockchain/controller.ts` | Webhook endpoint handler |
| `backend/src/modules/blockchain/routes.ts` | Webhook route definition |
| `backend/src/modules/blockchain/model.ts` | BlockchainLog schema (updated with blockHash) |
| `backend/src/index.ts` | Raw body capture for signature verification |

---

## ✨ Summary

Your webhook is a **comprehensive event monitoring system**:

✅ Monitors ALL events from your contract
✅ Fires for EVERY block with matching logs
✅ Includes full transaction context
✅ Updates database instantly
✅ Provides fallback polling safety net
✅ Production-ready with error handling

**Status:** Ready to activate! Just add the signing key to `.env` and restart. ⚡
