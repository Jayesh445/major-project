# Alchemy Webhook Setup Guide

## Overview

The Alchemy webhook integration enables **real-time blockchain transaction confirmations** instead of relying on the 30-second polling worker. When a transaction is confirmed on-chain, Alchemy sends an immediate notification to your backend webhook endpoint.

**Benefits:**
- ✅ Instant transaction confirmations (no 30-second delay)
- ✅ Frontend shows "Verified" status immediately
- ✅ Reduces blockchain API calls
- ✅ Fallback: Polling worker still runs if webhook fails

## Implementation Architecture

```
Transaction Submitted (status='pending')
        ↓
   Two parallel paths:
   ├─ Webhook Path (Primary)
   │  └─ Alchemy detects confirmation
   │     └─ POST /api/blockchain/webhook
   │        └─ BlockchainLog.status = 'confirmed'
   │           └─ Frontend shows "Verified" immediately ⚡
   │
   └─ Polling Path (Fallback)
      └─ Worker checks every 30 seconds
         └─ If not yet updated, updates status
```

## Setup Steps

### 1. Set Environment Variable

Add your Alchemy webhook signing key to `.env`:

```bash
# .env
ALCHEMY_WEBHOOK_SIGNING_KEY=your_signing_key_here
```

**How to get signing key:**
- You already created the webhook in Alchemy Dashboard
- Go to Settings → Webhooks
- Click your webhook to view details
- Copy the "Signing Key" value
- Paste it in your `.env`

### 2. Ensure Backend URL is Public (for Production)

Alchemy needs to send POST requests to your webhook endpoint. This must be publicly accessible:

```
POST https://your-backend-domain.com/api/blockchain/webhook
```

For development with ngrok:
```bash
# In one terminal
ngrok http 5000

# You'll get a public URL like:
# https://abc123.ngrok.io -> http://localhost:5000
# Webhook endpoint becomes:
# https://abc123.ngrok.io/api/blockchain/webhook
```

### 3. Webhook Already Created ✅

You've already created the webhook in Alchemy with the GraphQL structure:

```graphql
{
  block {
    hash,
    number,
    timestamp,
    logs(filter: {addresses: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"]}) {
      data,
      topics,
      index,
      account {
        address
      },
      transaction {
        hash,
        nonce,
        index,
        from { address },
        to { address },
        value,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
        gas,
        status,
        gasUsed,
        cumulativeGasUsed,
        effectiveGasPrice,
        createdContract { address }
      }
    }
  }
}
```

**What this does:**
- Monitors all events (logs) from your contract address
- Includes detailed transaction information (status, gas, etc)
- Fires for every block with matching logs
- Provides complete transaction context for each log

### 4. Get the Signing Key

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com)
2. Select your app
3. Go to **Settings → Webhooks**
4. Click on your webhook
5. Copy the **Signing Key**
6. Add to `backend/.env`:
   ```bash
   ALCHEMY_WEBHOOK_SIGNING_KEY=whk_your_signing_key_here
   ```
7. Restart your backend

## How It Works

### Webhook Request Structure

Alchemy sends a block event with all matching logs:

```json
POST /api/blockchain/webhook
Header: x-alchemy-signature: <hmac-sha256-hash>

{
  "webhookId": "whk_123456",
  "id": "evt_123456",
  "createdAt": "2024-01-15T10:30:00Z",
  "type": "block",
  "block": {
    "hash": "0xabcdef1234567890...",
    "number": 5678901,
    "timestamp": 1705318200,
    "logs": [
      {
        "data": "0x...",
        "topics": ["0x...", "0x..."],
        "index": 0,
        "account": {
          "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        },
        "transaction": {
          "hash": "0x1234567890abcdef...",
          "nonce": 42,
          "index": 5,
          "from": { "address": "0x..." },
          "to": { "address": "0x..." },
          "value": "1000000000000000000",
          "gasPrice": "20000000000",
          "maxFeePerGas": "30000000000",
          "maxPriorityFeePerGas": "2000000000",
          "gas": "21000",
          "status": 1,  // 1 = success, 0 = failed
          "gasUsed": "21000",
          "cumulativeGasUsed": "1234567",
          "effectiveGasPrice": "22000000000"
        }
      },
      // ... more logs if multiple transactions in block
    ]
  }
}
```

**Key Points:**
- `block.logs` is an array of all logs matching your contract filter
- Each log contains the transaction details
- `transaction.status` = 1 (success) or 0 (failed)
- `block.timestamp` is Unix timestamp (seconds since epoch)

### Signature Verification

1. Alchemy computes: `HMAC-SHA256(body, signingKey)`
2. Sends result in `x-alchemy-signature` header
3. Our webhook handler verifies: `hash === signature`
4. If invalid, returns **401 Unauthorized**

### Status Update Flow

```typescript
// 1. Webhook received with block data
handleWebhook(blockEvent) → {
  // 2. Verify HMAC-SHA256 signature
  ✓ Signature valid
  
  // 3. Extract block info
  blockNumber = blockEvent.block.number
  blockHash = blockEvent.block.hash
  timestamp = blockEvent.block.timestamp (Unix seconds)
  
  // 4. For each log in block
  for (log of blockEvent.block.logs) {
    txHash = log.transaction.hash
    txStatus = log.transaction.status
    
    // 5. Find pending BlockchainLog in MongoDB
    blockchainLog = BlockchainLog.findOne({ txHash, status: 'pending' })
    
    // 6. Update status based on tx.status
    if (txStatus === 1) {
      blockchainLog.status = 'confirmed'
      blockchainLog.blockNumber = blockNumber
      blockchainLog.blockHash = blockHash
      blockchainLog.confirmedAt = new Date(timestamp * 1000)
    } else if (txStatus === 0) {
      blockchainLog.status = 'failed'
    }
    
    // 7. Save to MongoDB
    blockchainLog.save()
  }
  
  // 8. Frontend polls and sees "Verified" ✅
}
```

## Testing

### Local Testing with Webhook

1. Get a pending transaction hash from MongoDB:
```bash
# In MongoDB shell
db.blockchaincreatelogs.findOne({ confirmationStatus: "pending" })
# Copy the txHash value
```

2. Simulate webhook request:
```bash
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
            "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",  // USE REAL TX HASH
            "nonce": 42,
            "index": 5,
            "from": { "address": "0x1111111111111111111111111111111111111111" },
            "to": { "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
            "value": "0",
            "gasPrice": "20000000000",
            "gas": "65000",
            "status": 1,
            "gasUsed": "52000",
            "cumulativeGasUsed": "1234567",
            "effectiveGasPrice": "20000000000"
          }
        }
      ]
    }
  }'
```

**Note:** Skip the `x-alchemy-signature` header for testing. The webhook handler skips signature validation in development mode.

3. Check MongoDB:
```bash
db.blockchaincreatelogs.findOne({ txHash: "0x1234..." })
# Should now see: 
#   confirmationStatus: "confirmed"
#   blockNumber: 5678901
#   blockHash: "0xabcdef..."
#   confirmedAt: 2024-01-15T10:30:00Z
```

### Webhook History in Alchemy Dashboard

- Go to Settings → Webhooks → Your Webhook
- View **Request/Response History**
- See success/failure for each webhook call
- Retry failed webhooks manually

## Monitoring & Troubleshooting

### Check Webhook Status

```bash
# View recent webhooks in Alchemy dashboard
Dashboard → Settings → Webhooks → History

# Also check backend logs:
docker logs backend  # or tail -f logs/backend.log

# Search for:
# [AlchemyWebhook] Confirmed: po_created tx=...
# [AlchemyWebhook] Failed: tx=...
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid signature | Check `ALCHEMY_WEBHOOK_SIGNING_KEY` in `.env` |
| Webhook not firing | URL unreachable | Ensure URL is public (ngrok for dev, domain for prod) |
| Status not updating | Alchemy disabled | Set `SEPOLIA_RPC_URL` and other env vars |
| Double updates | Both webhook + polling | Normal, both are safe (idempotent) |

### Disable Webhook (Fallback to Polling)

If webhook is causing issues, simply remove the signing key:

```bash
# In .env, comment out or delete:
# ALCHEMY_WEBHOOK_SIGNING_KEY=...
```

The polling worker will continue to function (30-second delay instead of instant).

## Production Deployment

### Checklist

- [ ] `ALCHEMY_WEBHOOK_SIGNING_KEY` set in production `.env`
- [ ] Backend URL is publicly accessible (DNS/domain name)
- [ ] SSL/TLS enabled (https://)
- [ ] Firewall allows POST to `/api/blockchain/webhook`
- [ ] Monitor webhook logs in Alchemy dashboard
- [ ] Set up alerts if webhook failure rate > 5%

### CloudFlare / Reverse Proxy

If behind a proxy, ensure raw body is preserved:

```nginx
# nginx.conf
location /api/blockchain/webhook {
  proxy_pass http://backend:5000;
  proxy_request_buffering off;  # Important for webhook signature verification
  proxy_set_header Content-Length $content_length;
}
```

## FAQ

**Q: What happens to existing 50 pending transactions?**
A: They'll continue using the polling worker (30-second intervals) until confirmed. Webhook processes new blocks going forward. No retroactive processing needed.

**Q: Do I need to restart the backend?**
A: Yes, add `ALCHEMY_WEBHOOK_SIGNING_KEY` to `.env` and restart. The webhook handler is always active but only validates if the key is set.

**Q: What if Alchemy sends a webhook but our backend is down?**
A: Alchemy retries for ~5 minutes with exponential backoff. The polling worker will catch up when the backend is back online.

**Q: Why does the webhook fire for ALL events, not just my contract?**
A: The contract address filter (`0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`) in your webhook configuration limits logs to that address. The webhook still processes the entire block, but only your contract's logs are included.

**Q: Can I test without Alchemy?**
A: Yes, use the curl examples above. The webhook handler validates the signature but skips validation in development mode (if signing key is missing).

**Q: What if a transaction fails on-chain?**
A: The webhook sets `transaction.status = 0`, and our handler updates BlockchainLog with `confirmationStatus = 'failed'`. Frontend will display failure status.

**Q: Can I modify the webhook query to filter different events?**
A: Yes! Update the GraphQL query in Alchemy webhook settings. For example, you could filter by specific event topics or add more contract addresses.

## Related Files

- `webhook.service.ts` - Webhook handler and signature verification
- `controller.ts` - `handleWebhook()` endpoint
- `routes.ts` - `POST /api/blockchain/webhook` route
- `service.ts` - `logEventOnChain()` creates initial pending logs
- `worker.ts` - Polling fallback (still runs every 30s)
