# Blockchain Setup — AutoStock AI

This guide walks through deploying the **SupplyChainAudit** smart contract to Ethereum Sepolia and connecting it to the AutoStock AI backend.

> **Skip this and just want to demo?** The system runs in **offline fallback mode** by default — it generates real SHA-256 hashes and stores them in MongoDB without ever calling the chain. The frontend works exactly the same. Setup below is only needed for the *real* on-chain mode (for the research paper benchmarks and Etherscan demos).

---

## Prerequisites

- Node.js 22.13+
- An Alchemy account (free): https://www.alchemy.com/
- MetaMask or any Ethereum wallet (for the deployer key)
- Sepolia ETH (free from a faucet)

---

## Step 1 — Get an Alchemy RPC URL

1. Sign up at https://www.alchemy.com/ (free tier is plenty)
2. Click **Create new app**
3. Network: **Sepolia**
4. Copy the **HTTPS** URL — looks like `https://eth-sepolia.g.alchemy.com/v2/<YOUR_KEY>`

---

## Step 2 — Create a test wallet

**Don't use your main wallet.** Create a fresh one just for this project.

Easiest way (one-liner using ethers):

```bash
node -e "const e=require('ethers');const w=e.Wallet.createRandom();console.log('Address:',w.address);console.log('Private key:',w.privateKey);"
```

Save the private key somewhere safe. Save the address — you'll need it for the faucet.

---

## Step 3 — Get free Sepolia ETH

Open one of these faucets and paste your wallet address:

- https://sepoliafaucet.com (Alchemy's faucet — needs Alchemy login)
- https://sepolia-faucet.pk910.de (PoW mining faucet — run in browser)
- https://www.infura.io/faucet/sepolia (Infura's faucet)

You only need ~0.05 ETH (deployment costs ~0.005, each tx costs ~0.0008).

---

## Step 4 — Configure the blockchain workspace

```bash
cd D:/major-project/blockchain
cp .env.example .env
```

Edit `.env`:

```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
DEPLOYER_PRIVATE_KEY=0xYOUR_TEST_WALLET_PRIVATE_KEY
ETHERSCAN_API_KEY=  # Optional, leave blank
```

---

## Step 5 — Compile and test the contract

```bash
cd D:/major-project/blockchain
npx hardhat compile
npx hardhat test
```

You should see **18 passing tests**, including the tamper detection adversarial test.

---

## Step 6 — Deploy to Sepolia

```bash
cd D:/major-project/blockchain
npx hardhat run scripts/deploy.ts --network sepolia
```

This will:
1. Deploy the `SupplyChainAudit` contract to Sepolia
2. Wait for confirmation
3. Save deployment details to `blockchain/deployed.json`
4. Print the contract address

Example output:

```
Deploying SupplyChainAudit contract...

Deployer address: 0x1234...
Deployer balance: 0.05 ETH

SupplyChainAudit deployed to: 0xABCD1234...
Transaction hash: 0xdef...
Block number: 5123456
Gas used: 1234567

Deployment details saved to: D:/major-project/blockchain/deployed.json

Next steps:
  1. Copy the contract address into backend/.env:
     SUPPLY_CHAIN_CONTRACT_ADDRESS=0xABCD1234...
  2. Restart the backend — confirmation worker will pick it up
```

---

## Step 7 — Configure the backend

Add these lines to `D:/major-project/backend/.env`:

```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
DEPLOYER_PRIVATE_KEY=0xYOUR_TEST_WALLET_PRIVATE_KEY
SUPPLY_CHAIN_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
PUBLIC_BASE_URL=http://localhost:3000
```

---

## Step 8 — Restart the backend

```bash
cd D:/major-project/backend
pnpm dev
```

You should see:

```
Server is running on port 5000
[BlockchainWorker] Started — polling pending logs every 30s
```

(Instead of the offline fallback message.)

---

## Step 9 — Verify it works

### Submit a test event

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@autostock.ai","password":"Admin@123"}' \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>console.log(JSON.parse(d).data.accessToken))')

curl -s -X POST http://localhost:5000/api/internal/blockchain-logs \
  -H "Content-Type: application/json" \
  -H "x-internal-api-key: internal-sc-ai-secret-key-2024" \
  -d '{
    "eventType": "po_created",
    "referenceModel": "PurchaseOrder",
    "referenceId": "69d88ada6e53869074a14967",
    "payload": {"poNumber": "TEST-001", "totalAmount": 50000},
    "amount": 50000
  }'
```

Expected response:

```json
{
  "_id": "...",
  "txHash": "0x...",
  "confirmationStatus": "pending",
  "etherscanUrl": "https://sepolia.etherscan.io/tx/0x..."
}
```

### Check on Etherscan

Open the `etherscanUrl` in a browser. You should see your transaction live on Sepolia.

### Wait 30 seconds, then check confirmation

```bash
curl -s http://localhost:5000/api/blockchain/logs?limit=5 \
  -H "Authorization: Bearer $TOKEN"
```

The `confirmationStatus` should now be `"confirmed"` and `blockNumber` populated.

---

## Step 10 — Run the benchmarks for the research paper

```bash
cd D:/major-project
node docs/benchmark-blockchain.js
```

This runs 20 real on-chain writes, measures latency/throughput, runs the verification + tamper detection tests, and saves metrics to `docs/blockchain-benchmark-results.json`.

These numbers go into **Table 5.5** of the research paper.

---

## Troubleshooting

### "insufficient funds for gas * price + value"

Your test wallet doesn't have enough Sepolia ETH. Get more from a faucet (Step 3).

### "could not detect network"

Check that `SEPOLIA_RPC_URL` in `backend/.env` is correct and reachable. Test with:
```bash
curl -X POST $SEPOLIA_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Expected: a JSON response with the latest block number.

### Confirmation stays "pending" forever

- Sepolia can be slow during congestion (up to 1-2 minutes per block)
- Check Etherscan directly to see if your tx is in a block
- The confirmation worker retries up to 10 times (5 minutes total) before marking failed
- If the tx is dropped from the mempool, you'll see "failed" in the logs

### "contract has no method 'logEvent'"

The ABI in `blockchain/deployed.json` is stale (different contract version). Re-deploy:
```bash
cd blockchain && npx hardhat run scripts/deploy.ts --network sepolia
```

### Worker not starting

Check that `SUPPLY_CHAIN_CONTRACT_ADDRESS`, `SEPOLIA_RPC_URL`, and `DEPLOYER_PRIVATE_KEY` are all set in `backend/.env`. The worker logs `Skipped (... not set — using offline fallback)` if any of the three are missing.

---

## Architecture recap

```
Frontend (Receiving page, QR scan)
        │
        ▼
Backend /api/internal/blockchain-logs (POST)
        │
        ▼
blockchain/service.ts → ethers.js
        │
        ├─► Submit tx to Sepolia (returns immediately, status=pending)
        │
        └─► Save BlockchainLog to MongoDB
        ↓
        (30s later)
        ↓
blockchain/worker.ts → polls pending logs
        │
        ▼
ethers.provider.getTransactionReceipt(txHash)
        │
        ├─► Confirmed? Update MongoDB status=confirmed + blockNumber
        └─► Failed? Update status=failed
        ↓
Frontend polls /api/blockchain/logs every 20s and updates UI
```

---

## Cost estimate

| Operation | Gas | Cost @ 10 gwei (~$2400/ETH) |
|-----------|-----|------------------------------|
| Contract deployment (one-time) | ~1.2M | ~$0.06 |
| `logEvent` (single) | ~80K | ~$0.0004 |
| `logEventsBatch` (10 events) | ~620K | ~$0.003 (~$0.0003 per event) |
| `verifyHash` (read-only) | 0 | Free |

Total cost for the entire research paper benchmark (20 txs): **~$0.008**.
