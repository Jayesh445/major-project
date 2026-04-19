# Blockchain Verification Guide for Purchase Orders

## Overview
This guide explains how to verify that blockchain logging is working correctly at each step of the PO workflow.

## 1. Visual Verification in UI

### Check PO Detail Page
1. Navigate to any PO in `/dashboard/procurement/orders/{poId}`
2. Look for the **"Blockchain Status"** section showing:
   - ✓ **On-chain** badge (if verified)
   - Transaction hash (clickable to view on blockchain)
   - Block number and timestamp
   - "Not Yet Logged" (if not yet on-chain)

### Check PO List Page
1. Go to `/dashboard/procurement/orders`
2. In the table, look for **blockchain status indicators**:
   - Green checkmark = verified on-chain
   - Orange indicator = pending blockchain logging
   - Each PO row shows blockchain status

### Check Supplier View
1. As a supplier, go to `/dashboard/supplier/catalog`
2. Click on any PO card
3. View the **"On-chain verified"** link
4. Click to verify the transaction on Etherscan/block explorer

---

## 2. Database Verification

### Check BlockchainLog Collection
Run in MongoDB shell or MongoDB Compass:

```javascript
// Find all blockchain logs for a specific PO
db.blockchainslog.find({ purchaseOrderId: ObjectId("...") })
```

Expected output for a logged PO:
```json
{
  "_id": ObjectId("..."),
  "purchaseOrderId": ObjectId("..."),
  "eventType": "PO_CREATED",
  "transactionHash": "0x1234567890abcdef...",
  "blockNumber": 19547125,
  "timestamp": "2024-04-20T10:30:00Z",
  "contractAddress": "0xabc123...",
  "status": "confirmed"
}
```

### Check PurchaseOrder Model
```javascript
// Find PO and check blockchain fields
db.purchaseorders.findOne({ _id: ObjectId("...") })
```

Look for these blockchain-related fields:
```json
{
  "_id": ObjectId("..."),
  "poNumber": "PO-2024-001",
  "blockchainTxHash": "0x1234567890abcdef...",
  "blockchainLoggedAt": "2024-04-20T10:30:00Z",
  "status": "acknowledged",
  ...
}
```

### Quick Stats
```javascript
// Count how many POs have blockchain logging
db.purchaseorders.countDocuments({ blockchainTxHash: { $exists: true } })

// See latest blockchain logs
db.blockchainslog.find().sort({ createdAt: -1 }).limit(5)

// Check specific PO's blockchain timeline
db.blockchainslog.find({ purchaseOrderId: ObjectId("...") }).sort({ createdAt: 1 })
```

---

## 3. API Response Verification

### Call PO Detail Endpoint
```bash
curl -X GET http://localhost:5000/api/v1/purchase-orders/{poId} \
  -H "Authorization: Bearer {accessToken}"
```

Expected response includes:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "poNumber": "PO-2024-001",
    "blockchainTxHash": "0x1234...",
    "blockchainLoggedAt": "2024-04-20T10:30:00Z",
    "status": "sent_to_supplier",
    "lineItems": [...],
    "supplier": {...}
  }
}
```

### Check Blockchain Logs Endpoint
```bash
# Get all blockchain logs
curl -X GET http://localhost:5000/api/blockchain/logs \
  -H "Authorization: Bearer {accessToken}"

# Get logs for specific PO
curl -X GET http://localhost:5000/api/blockchain/logs?purchaseOrderId={poId} \
  -H "Authorization: Bearer {accessToken}"
```

---

## 4. Blockchain Event at Each PO Status

### Step 1: PO Created (Draft Status)
- **Event Type**: `PO_CREATED`
- **Where to Check**:
  - PO detail page shows blockchain status
  - MongoDB: `blockchainTxHash` field populated
  - Blockchain explorer: Transaction visible
- **What You'll See**:
  ```
  ✓ On-chain badge with transaction hash
  Transaction: 0x1234...
  Block: 19547125
  ```

### Step 2: PO Submitted for Approval
- **Event Type**: `PO_SUBMITTED_FOR_APPROVAL`
- **Where to Check**:
  - Status changes to "pending_approval"
  - Blockchain shows this state change
  - BlockchainLog has event entry
- **What You'll See**:
  ```
  Status: ⏳ Pending Approval
  On-chain: ✓ Verified
  ```

### Step 3: PO Approved
- **Event Type**: `PO_APPROVED`
- **Where to Check**:
  - Green "Approved" badge on UI
  - blockchainTxHash updates
  - BlockchainLog shows approval event
- **What You'll See**:
  ```
  Status: ✓ Approved
  Approved by: [Admin name]
  On-chain: ✓ Verified
  ```

### Step 4: PO Sent to Supplier
- **Event Type**: `PO_SENT_TO_SUPPLIER`
- **Where to Check**:
  - Supplier sees order in `/dashboard/supplier/catalog`
  - Status shows "Sent to Supplier"
  - Blockchain confirms sending
- **What You'll See**:
  ```
  Status: 📤 Sent to Supplier
  Sent on: [timestamp]
  On-chain: ✓ Verified
  ```

### Step 5: Supplier Acknowledges
- **Event Type**: `PO_ACKNOWLEDGED`
- **Where to Check**:
  - Status changes to "acknowledged"
  - Warehouse can start receiving
  - Blockchain confirms acknowledgment
- **What You'll See**:
  ```
  Status: ✓ Acknowledged
  Acknowledged by: Supplier
  On-chain: ✓ Verified
  ```

### Step 6: Goods Received
- **Event Type**: `GOODS_RECEIVED`
- **Where to Check**:
  - Status changes to "partially_received" or "fully_received"
  - Warehouse receipt details shown
  - Blockchain confirms receipt
- **What You'll See**:
  ```
  Status: ✓ Fully Received
  Received: [date/time]
  On-chain: ✓ Verified
  ```

---

## 5. Real-time Verification via Logs

### Check Backend Logs
Look for blockchain logging messages in the terminal where backend is running:

```
[Blockchain] Logging PO_CREATED event for PO-2024-001
[Blockchain] Transaction confirmed: 0x1234567890abcdef
[Blockchain] BlockchainLog saved: {eventType: PO_CREATED, ...}
[Blockchain] PurchaseOrder updated with blockchainTxHash
```

### Check Webhook Notifications (Alchemy)
1. Go to Alchemy dashboard
2. Navigate to your app's webhook settings
3. Check webhook delivery logs for:
   - Event type received
   - Transaction hash
   - Block number
   - Confirmation status

---

## 6. Complete Workflow Verification

### Test the Entire Flow
1. **Create a PO**
   - Check: UI shows "On-chain" badge
   - Check: API response includes blockchainTxHash
   - Check: MongoDB has BlockchainLog entry

2. **Submit for Approval**
   - Check: Status updates to pending_approval
   - Check: Blockchain shows new event
   - Check: Timestamp is current

3. **Approve PO**
   - Check: Status updates to approved
   - Check: Blockchain logs approval
   - Check: blockchainLoggedAt updates

4. **Send to Supplier**
   - Check: Status updates to sent_to_supplier
   - Check: Supplier receives notification
   - Check: Blockchain confirms sending

5. **Supplier Acknowledges**
   - Check: Status updates to acknowledged
   - Check: Warehouse sees it in Receiving page
   - Check: Blockchain confirms acknowledgment

6. **Warehouse Receives**
   - Check: Status updates to partially/fully_received
   - Check: Inventory updated
   - Check: Blockchain confirms receipt

### For Each Step, Verify All Three:
```
✓ UI shows correct status and blockchain badge
✓ API response includes blockchain fields
✓ Database has BlockchainLog entry
```

---

## 7. Debugging Blockchain Issues

### If You See "Not Yet Logged"

**Check 1: Is blockchain module enabled?**
```bash
# In backend .env file, should have:
BLOCKCHAIN_ENABLED=true
```

**Check 2: Are all environment variables set?**
```bash
# Required:
BLOCKCHAIN_ENABLED=true
ALCHEMY_API_KEY=your_alchemy_key
BLOCKCHAIN_CONTRACT_ADDRESS=0x...
WEBHOOK_SIGNING_KEY=your_signing_key
```

**Check 3: Check recent blockchain logs in database**
```javascript
// Check for errors
db.blockchainslog.find({ status: "failed" }).limit(5)

// Check latest logs
db.blockchainslog.find().sort({ createdAt: -1 }).limit(10)
```

**Check 4: Check backend logs**
- Look for error messages
- Check for webhook errors
- Verify contract address is correct

**Check 5: Verify Alchemy webhook**
- Webhook URL is accessible from internet
- Webhook is enabled
- Signing key matches in backend
- Recent deliveries are successful

---

## 8. Quick Verification Commands

### MongoDB Queries
```javascript
// Check if blockchain logging is working
db.purchaseorders.findOne(
  { blockchainTxHash: { $exists: true } },
  { poNumber: 1, blockchainTxHash: 1, blockchainLoggedAt: 1 }
)

// Count POs with blockchain
db.purchaseorders.countDocuments({ blockchainTxHash: { $exists: true } })

// Get blockchain logging percentage
var total = db.purchaseorders.countDocuments({})
var logged = db.purchaseorders.countDocuments({ blockchainTxHash: { $exists: true } })
print(`${logged}/${total} POs logged on blockchain (${((logged/total)*100).toFixed(2)}%)`)

// See all events for a PO
db.blockchainslog.find({ purchaseOrderId: ObjectId("...") }).pretty()
```

### API Calls (via cURL)
```bash
# Get a specific PO with blockchain data
curl -X GET http://localhost:5000/api/v1/purchase-orders/[poId] \
  -H "Authorization: Bearer [token]" | jq '.data | {poNumber, status, blockchainTxHash, blockchainLoggedAt}'

# Get all blockchain logs
curl -X GET http://localhost:5000/api/blockchain/logs \
  -H "Authorization: Bearer [token]" | jq '.data[0:5]'
```

---

## 9. Test with Real Users

### Test as Admin
1. Login to `/login` with admin credentials
2. Go to `/dashboard/procurement/orders`
3. Create a new PO or select existing one
4. Check blockchain status at each step
5. Verify "Send to Supplier" and "Approve" buttons log to blockchain

### Test as Supplier
1. Login with supplier credentials (supplier1@test.com / Password123!)
2. Go to `/dashboard/supplier/catalog`
3. View pending orders
4. Click on any order to see blockchain verification link
5. Click "On-chain verified" to see transaction on blockchain explorer

### Test as Warehouse Manager
1. Login with warehouse manager credentials
2. Go to `/dashboard/warehouse/receiving`
3. View orders awaiting receipt
4. Click "Receive All" to complete receiving
5. Check blockchain status updates

---

## 10. Verification Checklist

For complete blockchain verification:

- [ ] PO detail page shows blockchain status
- [ ] Transaction hash is visible and clickable
- [ ] Block number displayed
- [ ] Timestamp is accurate
- [ ] "On-chain verified" link works
- [ ] BlockchainLog exists in MongoDB
- [ ] PO has blockchainTxHash field
- [ ] blockchainLoggedAt is populated
- [ ] Status updates reflected on-chain
- [ ] No errors in backend logs
- [ ] Alchemy webhook shows successful deliveries
- [ ] Supplier can see on-chain verification
- [ ] Warehouse sees blockchain status
- [ ] All 6 workflow steps logged
- [ ] Test data backfill worked (43 POs logged)

---

## 11. Expected Results

### Healthy Blockchain Logging
```
✓ 100% of new POs logged within 2-3 seconds
✓ All status changes recorded
✓ Supplier confirmations logged
✓ Receipt events recorded
✓ No failed transactions
✓ Webhook delivering successfully
```

### UI Indicators
```
✓ "On-chain" badge visible on all PO pages
✓ Green checkmark indicates verification
✓ Transaction hash clickable
✓ Timestamp accurate
✓ Status updates visible immediately
```

### Database Health
```
✓ BlockchainLog growing with each PO action
✓ No orphaned transactions
✓ All statuses tracked
✓ Timestamps consistent
```

---

## Support & Troubleshooting

If blockchain logging isn't working:

1. **Check `.env` configuration**
   - Verify all blockchain variables are set
   - Confirm API keys are valid

2. **Check backend logs**
   - Look for blockchain module initialization messages
   - Check for webhook errors

3. **Check Alchemy dashboard**
   - Verify webhook is enabled
   - Check recent deliveries
   - Look for failed requests

4. **Check MongoDB**
   - Verify BlockchainLog collection exists
   - Check for recent entries
   - Look for error logs

5. **Restart services**
   ```bash
   # Kill and restart backend
   npm run dev
   ```

6. **Re-run backfill (if needed)**
   ```bash
   # Update existing POs with blockchain data
   npm run backfill:blockchain
   ```

---

**Last Updated**: April 2024
**Status**: Fully Functional ✓
