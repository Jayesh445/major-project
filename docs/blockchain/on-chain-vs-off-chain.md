# What's On-Chain vs Off-Chain — Simple Explanation

> A plain-English guide for explaining the AutoStock AI blockchain design to non-technical stakeholders, external reviewers, and the research paper audience.

---

## The One-Liner

Think of it like a **notary seal + full document** system:

- **On-chain = tamper-proof stamp** (tiny, expensive, permanent)
- **Off-chain = the actual paperwork** (big, cheap, private)

We store **fingerprints** on Ethereum and **full records** in MongoDB.

---

## 🔗 On-Chain (Ethereum Sepolia)

Only **fingerprints and minimal facts** — just enough to prove nothing was tampered with.

| What | Example | Why on-chain |
|------|---------|--------------|
| **Reference ID** | `PO-ABC123` (as bytes32) | So we can look it up later |
| **Event type** | `PO_CREATED`, `PO_RECEIVED`, `NEGOTIATION_ACCEPTED` | What happened |
| **Document hash (SHA-256)** | `0x7f3a9b...` | The "fingerprint" of the full PO — if even one comma changes, this hash changes |
| **Amount** | `₹45,000` | For payment settlement verification |
| **Timestamp** | Block time | Trustless "when did this happen" |
| **Submitter address** | Backend wallet | Non-repudiation ("who logged this") |

**That's it.** Six tiny fields per event. Roughly **200 bytes total** per transaction.

**Cost:** ~$0.0003 per event (fraction of a cent on Sepolia testnet).

---

## 💾 Off-Chain (MongoDB)

Everything **rich, detailed, and private**.

| What | Example | Why off-chain |
|------|---------|--------------|
| **Full PO line items** | 50 products, SKUs, quantities, unit prices | Too expensive to store on-chain |
| **Supplier details** | Company name, email, phone, address | Privacy + cost |
| **Negotiation transcript** | Full Priya ↔ Rajesh 3-round conversation with reasoning | Huge text, cheap in Mongo |
| **Product catalog** | Names, descriptions, categories | Not audit-critical |
| **User profiles** | Admin/warehouse/procurement staff info | Private, GDPR |
| **Inventory transactions** | Every stock in/out movement | Millions of rows |
| **Forecasts** | 7-day predictions, confidence intervals | Not legally binding |
| **txHash + blockNumber** | Pointer back to the on-chain record | So we can link both sides |
| **confirmationStatus** | `pending` / `confirmed` / `failed` | Tracks if the chain write succeeded |

---

## 🔐 How Verification Works

```
Someone scans QR code on a shipping box
            ↓
System loads the FULL PO from MongoDB (off-chain)
            ↓
Recomputes SHA-256 of that PO
            ↓
Asks the Ethereum contract:
  "Is this hash the same one you recorded when the PO was created?"
            ↓
    ┌───────┴───────┐
    ▼               ▼
  MATCH ✅       MISMATCH ❌
  "Unaltered"    "TAMPERED"
                 (payment halted)
```

---

## 🧠 Simple Analogy

> Imagine you sign a legal contract and the notary stamps a **seal** with a unique pattern into a public ledger.
> - The **contract itself** (10 pages of text) stays in your filing cabinet (MongoDB).
> - The **seal** (a single tiny pattern) goes in the public ledger (Ethereum).
>
> Anyone can check: "Does my copy of the contract produce the same seal pattern?"
> - **Yes** → contract is genuine, untouched.
> - **No** → someone modified it after the fact.
>
> The ledger is **tiny and cheap**, the contract is **big and private**.
> This is why we use blockchain only for the seal, not the whole contract.

---

## 💡 Why This Split?

| Reason | Explanation |
|--------|-------------|
| **Cost** | Storing 1 KB on Ethereum costs ~$5. Storing 1 KB in MongoDB costs ~$0.000001. |
| **Speed** | MongoDB reads are 5 ms. On-chain reads are 200 ms+. |
| **Privacy** | Supplier names, contract terms, payment accounts shouldn't be public forever. |
| **Updates** | Forecasts change, stock moves, users edit profiles. Blockchain is immutable — you can't edit, only append. |
| **Trust** | You only need immutability for the things that would enable **fraud** if altered (PO amounts, agreement terms, goods receipt confirmations). Everything else is operational data. |

---

## 📊 What Gets Logged On-Chain (4 Priority Events)

| Event | When | Why |
|-------|------|-----|
| **`po_created`** | Negotiation accepted → PO minted | Fraud prevention: locks the agreed price + quantity |
| **`negotiation_accepted`** | Deal closed in two-agent chat | Proves what was agreed (Priya ↔ Rajesh signed off) |
| **`po_received`** | Warehouse scans QR at dock | Proves goods arrived and matched — releases payment |
| **`smart_contract_executed`** | Auto-payment triggered | Audit trail for finance team |

Everything else (low-stock alerts, forecast runs, user logins, stock adjustments) stays in MongoDB only.

---

## 🎯 Elevator Pitch (for investors / reviewers)

> "We store cryptographic **fingerprints** of all purchase orders, negotiation outcomes, and goods receipts on Ethereum Sepolia (~$0.0003 per event). The **actual documents** remain in MongoDB for speed and privacy. At any time — especially at the receiving dock — we can recompute the fingerprint and ask the blockchain whether it matches, giving us **tamper-proof audit trails without the cost or privacy cost of putting everything on-chain**."

---

## 🔬 For the Research Paper

This hybrid design is called an **anchor-and-verify pattern** in distributed systems literature. Key references:

- **Neuro-symbolic architecture** — combines deterministic blockchain guarantees with flexible off-chain storage
- Related work: Karim et al. 2025 (*AI Agents Meet Blockchain*), Bhatia & Albarrak 2023 (*Blockchain-Driven Food Supply Chain with QR Code*)
- **Gas optimization**: ~80,000 gas per event on Sepolia = ~$0.0003 at 10 gwei (matching Pamungkas 2025 Polygon zkEVM baseline)
- **Confirmation rate**: target 90% within 2 min (matches Karim et al. 92% published baseline)

---

## Summary Table

| Concern | On-Chain | Off-Chain |
|---------|:--------:|:---------:|
| Storage cost | 💰💰💰 Expensive | 💰 Cheap |
| Read speed | 🐢 Slow (200ms) | ⚡ Fast (5ms) |
| Privacy | ❌ Public | ✅ Private |
| Immutability | ✅ Guaranteed | ⚠️ Trust-based |
| Suitable for | Hashes, IDs, amounts, timestamps | Full documents, PII, history |
| Updateable | ❌ Append-only | ✅ Editable |
| Regulation (GDPR) | ⚠️ Problem (right-to-delete) | ✅ Compliant |

**Rule of thumb:** If removing or altering this data would enable **fraud**, put the hash on-chain. Otherwise, keep it in MongoDB.
