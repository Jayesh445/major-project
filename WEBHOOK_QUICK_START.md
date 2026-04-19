# Alchemy Webhook Quick Start (5 Minutes)

## TL;DR

Your backend now supports **instant blockchain confirmations** via Alchemy webhooks instead of 30-second polling.

### What You Get
- ⚡ Transaction status updates in <1 second (instead of ~30s)
- 🔄 Fallback polling still works if webhook fails
- 📊 Real-time "Verified" status on frontend
- ✅ Existing transactions unaffected

---

## Step 1: Add Environment Variable (1 min)

Edit `backend/.env`:

```bash
ALCHEMY_WEBHOOK_SIGNING_KEY=your_signing_key_here
```

Save the file. **Don't commit this to git** — it's a secret.

---

## Step 2: Restart Backend (1 min)

```bash
# Stop the running backend (Ctrl+C)
# Then start it again:

cd backend
npm run dev
```

Or if using Docker:
```bash
docker-compose restart backend
```

---

## Step 3: Register Webhook with Alchemy (3 min)

### For Production (Real Domain)

1. Go to https://dashboard.alchemy.com
2. Select your app
3. Click **Settings** in left sidebar
4. Scroll to **Webhooks** section
5. Click **Create New Webhook**
6. Fill in:
   - **Webhook URL:** `https://yourdomain.com/api/blockchain/webhook`
   - **Network:** Ethereum Sepolia
   - Click **Create**
7. Copy the **Signing Key**
8. Paste into `backend/.env` as `ALCHEMY_WEBHOOK_SIGNING_KEY=...`
9. Restart backend

### For Development (ngrok)

If testing locally, use ngrok to create a public tunnel:

```bash
# Terminal 1: Start ngrok
ngrok http 5000
# Output: https://abc123def456.ngrok.io → http://localhost:5000
```

```bash
# Terminal 2: Register this webhook URL with Alchemy:
# https://abc123def456.ngrok.io/api/blockchain/webhook

# Then add signing key to backend/.env
ALCHEMY_WEBHOOK_SIGNING_KEY=...

# Terminal 3: Restart backend
cd backend && npm run dev
```

---

## That's It! ✅

Your webhook is now active. Next time you create a PO:

```
1. PO Created
   ↓
2. Transaction submitted to blockchain
   ↓
3. Alchemy detects confirmation (within seconds)
   ↓
4. Sends webhook notification to your backend
   ↓
5. Backend updates database immediately
   ↓
6. Frontend shows "Verified" status ⚡
```

---

## Verify It's Working

### Option 1: Create a New PO

1. Go to frontend: `http://localhost:3000/dashboard/procurement/orders/new`
2. Create a PO
3. Go to `http://localhost:3000/dashboard/dev-tools/pending-transactions`
4. Watch for your transaction
5. It should show "Confirmed" within 30 seconds (usually <10 seconds)

### Option 2: Check Backend Logs

```bash
# Look for these log messages:
[AlchemyWebhook] Confirmed: po_created tx=0x1234... block=5678901
[AlchemyWebhook] Failed: tx=...
```

### Option 3: Check Alchemy Dashboard

1. Go to Alchemy Dashboard
2. Settings → Webhooks
3. Click your webhook
4. View **History** tab
5. You should see successful webhook calls with 200 status

---

## What About Existing 50 Transactions?

They'll continue using the polling worker (every 30 seconds) until confirmed. No action needed.

**Optional:** Check them immediately with:
```bash
cd backend
npx ts-node src/modules/blockchain/backfill.script.ts
```

This will query the blockchain for all 50 and update their status if already confirmed.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized in logs | Check `ALCHEMY_WEBHOOK_SIGNING_KEY` is correct |
| Webhook not firing | Make sure webhook URL is publicly accessible |
| Transactions still slow | Webhook may not be registered yet, check Alchemy dashboard |
| ngrok URL expired | Restart ngrok (gets new URL each time) |

---

## Full Documentation

For detailed setup, architecture, and troubleshooting:

📖 **Backend:** `backend/BLOCKCHAIN_WEBHOOK_IMPLEMENTATION.md`
📖 **Setup Guide:** `backend/src/modules/blockchain/WEBHOOK_SETUP.md`

---

## Key Files

**New Code:**
- `backend/src/modules/blockchain/webhook.service.ts` - Webhook handler
- `backend/src/modules/blockchain/backfill.script.ts` - Cleanup script
- `backend/src/modules/blockchain/WEBHOOK_SETUP.md` - Detailed guide

**Modified Code:**
- `backend/src/modules/blockchain/controller.ts` - Added webhook endpoint
- `backend/src/modules/blockchain/routes.ts` - Added `/webhook` route
- `backend/src/index.ts` - Added raw body capture

---

## Summary

✅ Backend webhook endpoint ready
✅ Signature verification in place
✅ Fallback polling still works
✅ Frontend will show instant status updates
✅ All existing data preserved

**Ready to deploy!** 🚀
