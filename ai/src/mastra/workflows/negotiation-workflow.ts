import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { minimaxHTTP } from '../models/minimax-http.js';
import {
  getSuppliersByProduct,
  getProductById,
  getWarehouseById,
  getSupplierById,
  createNegotiation,
  addNegotiationRound,
  updateNegotiation,
  createPurchaseOrder,
  updatePurchaseOrder,
  updateSupplierStats,
  createBlockchainLog,
} from '../api-client.js';

// Helper to format buyer + supplier messages into the agentReasoning string
function buildReasoning(buyer: any, supplier: any) {
  const parts: string[] = [];
  if (buyer?.message) parts.push(`Buyer: ${buyer.message}`);
  if (buyer?.reasoning) parts.push(`Buyer reasoning: ${buyer.reasoning}`);
  if (supplier?.message) parts.push(`Supplier: ${supplier.message}`);
  return parts.join(' | ');
}

const MAX_ROUNDS = 3;
const LLM_DELAY_MS = 1500; // Small throttle; Gemma has more generous quota

// ── Step 1: Validate inputs and fetch eligible suppliers ─────────────────────
const validateNegotiationInputsStep = createStep({
  id: 'validate-negotiation-inputs',
  description: 'Validates product, warehouse, and fetches eligible suppliers',
  inputSchema: z.object({
    productId: z.string(),
    warehouseId: z.string(),
    requiredQty: z.number(),
    maxUnitPrice: z.number(),
    targetUnitPrice: z.number(),
    maxLeadTimeDays: z.number(),
    initiatedBy: z.enum(['auto_replenishment', 'procurement_officer']).default('auto_replenishment'),
  }),
  outputSchema: z.object({
    product: z.object({ id: z.string(), name: z.string(), sku: z.string() }),
    warehouse: z.object({ id: z.string(), name: z.string(), code: z.string() }),
    suppliers: z.array(z.any()),
    constraints: z.object({
      requiredQty: z.number(),
      maxUnitPrice: z.number(),
      targetUnitPrice: z.number(),
      maxLeadTimeDays: z.number(),
      initiatedBy: z.string(),
    }),
  }),
  execute: async ({ inputData }) => {
    console.log('[Negotiation] Step 1: Validating inputs...');

    const [product, warehouse, suppliers] = await Promise.all([
      getProductById(inputData.productId),
      getWarehouseById(inputData.warehouseId),
      getSuppliersByProduct(inputData.productId),
    ]);

    if (!product.isActive) throw new Error(`Product ${product.sku} is inactive`);
    if (!warehouse.isActive) throw new Error(`Warehouse ${warehouse.code} is inactive`);
    if (suppliers.length === 0) throw new Error(`No approved suppliers for product ${product.sku}`);

    const enrichedSuppliers = suppliers.map((s: any) => {
      const catalogEntry = s.catalogProducts.find(
        (cp: any) =>
          cp.product?._id?.toString() === inputData.productId ||
          cp.product?.toString() === inputData.productId
      );
      return {
        supplierId: s._id.toString(),
        companyName: s.companyName,
        contactEmail: s.contactEmail,
        rating: s.rating,
        listPrice: catalogEntry?.unitPrice ?? 0,
        leadTimeDays: catalogEntry?.leadTimeDays ?? 0,
        moq: catalogEntry?.moq ?? 1,
        paymentTermsDays: s.currentContractTerms?.paymentTermsDays ?? 30,
        negotiationStats: s.negotiationStats || { totalNegotiations: 0, acceptedOffers: 0, averageSavingsPercent: 0 },
      };
    });

    console.log(`[Negotiation] Found ${enrichedSuppliers.length} eligible suppliers for ${product.sku}`);

    return {
      product: { id: inputData.productId, name: product.name, sku: product.sku },
      warehouse: { id: inputData.warehouseId, name: warehouse.name, code: warehouse.code },
      suppliers: enrichedSuppliers,
      constraints: {
        requiredQty: inputData.requiredQty,
        maxUnitPrice: inputData.maxUnitPrice,
        targetUnitPrice: inputData.targetUnitPrice,
        maxLeadTimeDays: inputData.maxLeadTimeDays,
        initiatedBy: inputData.initiatedBy,
      },
    };
  },
});

// ── Step 2: Two-agent negotiation loop ───────────────────────────────────────
const executeNegotiationStep = createStep({
  id: 'execute-two-agent-negotiation',
  description: 'Runs back-and-forth negotiation between Buyer Agent and Supplier Simulator Agent',
  inputSchema: z.object({
    product: z.object({ id: z.string(), name: z.string(), sku: z.string() }),
    warehouse: z.object({ id: z.string(), name: z.string(), code: z.string() }),
    suppliers: z.array(z.any()),
    constraints: z.object({
      requiredQty: z.number(),
      maxUnitPrice: z.number(),
      targetUnitPrice: z.number(),
      maxLeadTimeDays: z.number(),
      initiatedBy: z.string(),
    }),
  }),
  outputSchema: z.object({
    decision: z.string(),
    selectedSupplier: z.any().optional(),
    negotiations: z.array(
      z.object({
        supplierId: z.string(),
        companyName: z.string(),
        rounds: z.array(z.any()),
        finalStatus: z.string(),
        finalPrice: z.number().optional(),
      })
    ),
    reasoning: z.string(),
    product: z.object({ id: z.string(), name: z.string(), sku: z.string() }),
    warehouse: z.object({ id: z.string(), name: z.string(), code: z.string() }),
    constraints: z.any(),
  }),
  execute: async ({ inputData, mastra }) => {
    // We'll use Minimax HTTP directly instead of Mastra agents
    // because Mastra's OpenAI integration isn't compatible with Minimax's endpoints

    console.log('[Negotiation] Step 2: Starting two-agent negotiation...');

    const { constraints, product, suppliers } = inputData;

    // Sort suppliers by composite score and pick top 3
    const rankedSuppliers = [...suppliers]
      .map((s: any) => ({
        ...s,
        compositeScore:
          (1 - Math.min(s.listPrice / constraints.maxUnitPrice, 1)) * 40 +
          (s.rating / 5) * 30 +
          (1 - Math.min(s.leadTimeDays / constraints.maxLeadTimeDays, 1)) * 20 +
          (Math.min(s.paymentTermsDays, 90) / 90) * 10,
      }))
      .sort((a: any, b: any) => b.compositeScore - a.compositeScore)
      .slice(0, 1); // Only negotiate with top supplier (rate-limit friendly)

    const allNegotiations: any[] = [];
    let bestDeal: any = null;

    // Negotiate with each supplier sequentially
    for (const supplier of rankedSuppliers) {
      console.log(`[Negotiation] Starting negotiation with ${supplier.companyName}...`);

      const rounds: any[] = [];
      let lastBuyerOffer: any = null;
      let lastSupplierOffer: any = null;
      let negotiationOver = false;
      let finalStatus = 'rejected';

      // Calculate supplier's hidden floor price (30-40% margin below list)
      const supplierFloorPrice = supplier.listPrice * (0.6 + Math.random() * 0.15);

      // ── Create the NegotiationSession in the DB IMMEDIATELY so the UI shows it as in_progress ──
      let sessionId: string | undefined;
      try {
        const created = await createNegotiation({
          supplier: supplier.supplierId,
          product: product.id,
          initiatedBy: constraints.initiatedBy || 'auto_replenishment',
          status: 'in_progress',
          agentConstraints: {
            maxUnitPrice: constraints.maxUnitPrice,
            targetUnitPrice: constraints.targetUnitPrice,
            maxLeadTimeDays: constraints.maxLeadTimeDays,
            requiredQty: constraints.requiredQty,
          },
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        sessionId = created._id;
        console.log(`[Negotiation]   Created session ${sessionId} (in_progress)`);
      } catch (e) {
        console.error('[Negotiation] Failed to create session up front:', e);
      }

      for (let round = 1; round <= MAX_ROUNDS && !negotiationOver; round++) {
        console.log(`[Negotiation]   Round ${round} with ${supplier.companyName}`);

        // ── BUYER AGENT makes an offer ──
        const buyerContext = round === 1
          ? `You are Priya Sharma writing an OPENING email to Rajesh at ${supplier.companyName}.

**Context for this negotiation:**
- You need to buy: ${constraints.requiredQty} units
- Supplier's listed price: ₹${supplier.listPrice}/unit
- Supplier rating: ${supplier.rating}/5
- Supplier's standard lead time: ${supplier.leadTimeDays} days
- Their payment terms: Net ${supplier.paymentTermsDays} days

**Your PRIVATE constraints (NEVER reveal to Rajesh):**
- Absolute maximum (pmax): ₹${constraints.maxUnitPrice}/unit
- Target price: ₹${constraints.targetUnitPrice}/unit
- Max lead time: ${constraints.maxLeadTimeDays} days

**Your task:** Write a warm, professional OPENING email to Rajesh. Introduce the order, build rapport, and propose an opening price 15-25% below their listed price. Your message must be 3-5 sentences, sound completely human, and reference real business context (Q2 stock, market softening, volume commitment, etc.).

Return ONLY valid JSON with action="counter" and a FULL conversational message.`
          : `You are Priya Sharma continuing a negotiation with Rajesh at ${supplier.companyName}.

**Round ${round} of ${MAX_ROUNDS}.**

**Your last offer was:** ₹${lastBuyerOffer?.unitPrice}/unit

**Rajesh just replied:**
"${lastSupplierOffer?.message}"

His counter-offer: ₹${lastSupplierOffer?.unitPrice}/unit, lead time ${lastSupplierOffer?.leadTimeDays} days, payment Net ${lastSupplierOffer?.paymentTermsDays} days

**Your PRIVATE constraints (never reveal):**
- pmax: ₹${constraints.maxUnitPrice}/unit
- Target: ₹${constraints.targetUnitPrice}/unit
- Max lead time: ${constraints.maxLeadTimeDays} days

**Rounds remaining:** ${MAX_ROUNDS - round}
${bestDeal ? `**Competing offer:** ${bestDeal.companyName} quoted ₹${bestDeal.finalPrice}/unit — you can mention this (without naming them) as BATNA leverage.` : ''}

**Your task:** Write Rajesh a warm, human reply. Acknowledge his position first, then push back with a specific reason (budget pressure, market rates, volume, competitive quotes). Propose a counter-offer. Your message MUST be 3-5 sentences and sound completely human, not robotic.

Decide: counter, accept (if his price meets your constraints), or reject (if you're walking away).

Return ONLY valid JSON with a FULL conversational message.`;

        // Throttle to avoid rate limiting
        await new Promise(r => setTimeout(r, LLM_DELAY_MS));

        let buyerData;
        try {
          const buyerMessage = await minimaxHTTP.chat(
            [
              {
                role: 'system',
                content: `You are Priya Sharma, a senior procurement manager at a distributor company in India. You've been doing this for 12 years. You negotiate by phone and email with suppliers daily. You have strong people skills — polite, friendly, but firm. You build rapport while protecting your company's bottom line.

**Who you are:**
- Real name: Priya Sharma
- Company: AutoStock Distribution Pvt Ltd
- Style: Warm, professional, uses supplier's name, references past dealings
- You ALWAYS sound like a real human writing an email — never like a bot or a pricing calculator

**Core rules:**
- You have a strict maximum price (pmax) — NEVER exceed it, NEVER reveal it
- You have a target price you aim for
- You use BATNA (Best Alternative to Negotiated Agreement) as leverage

**Negotiation arc:**
- **Round 1 (Opening)**: Be warm, build rapport, propose 15-25% below list price
- **Round 2-3 (Bargaining)**: Acknowledge their counter, push back with reason, concede 3-5% per round
- **Round 4 (Closing)**: "Meet me halfway" phrasing with emotional appeal
- **Round 5 (Final)**: Hard stop - either accept or walk away

**Output Format — return ONLY valid JSON:**
{"action":"counter"|"accept"|"reject", "offer":{"unitPrice":number,"leadTimeDays":number,"paymentTermsDays":number,"quantity":number},"message":"3-5 sentence human email","reasoning":"your private analysis","concessionPercent":number,"dealScore":number}`,
              },
              {
                role: 'user',
                content: buyerContext,
              },
            ],
            { temperature: 0, max_tokens: 1024 }
          );

          const jsonMatch = buyerMessage.match(/\{[\s\S]*\}/);
          buyerData = JSON.parse(jsonMatch ? jsonMatch[0] : buyerMessage);
        } catch (llmErr: any) {
          // Hard LLM failure — mark session as failed and bail
          console.error('[Negotiation] Buyer LLM call failed:', llmErr.message);
          if (sessionId) {
            try {
              await updateNegotiation(sessionId, {
                status: 'rejected',
                completedAt: new Date(),
              });
            } catch {}
          }
          finalStatus = 'rejected';
          negotiationOver = true;
          continue;
        }

        // Check buyer's decision
        if (buyerData.action === 'accept') {
          const acceptRound = {
            round,
            buyer: {
              action: 'accept',
              offer: lastSupplierOffer || buyerData.offer,
              message: buyerData.message,
              reasoning: buyerData.reasoning,
            },
            supplier: null,
          };
          rounds.push(acceptRound);
          if (sessionId) {
            try {
              await addNegotiationRound(sessionId, {
                roundNumber: round,
                agentOffer: acceptRound.buyer.offer,
                agentReasoning: buildReasoning(acceptRound.buyer, null),
                status: 'accepted',
                timestamp: new Date(),
              });
            } catch (e) {
              console.warn('[Negotiation] Failed to persist accept round:', e);
            }
          }
          finalStatus = 'accepted';
          negotiationOver = true;
          continue;
        }

        if (buyerData.action === 'reject') {
          const rejectRound = {
            round,
            buyer: {
              action: 'reject',
              offer: buyerData.offer,
              message: buyerData.message,
              reasoning: buyerData.reasoning,
            },
            supplier: null,
          };
          rounds.push(rejectRound);
          if (sessionId) {
            try {
              await addNegotiationRound(sessionId, {
                roundNumber: round,
                agentOffer: rejectRound.buyer.offer,
                agentReasoning: buildReasoning(rejectRound.buyer, null),
                status: 'rejected',
                timestamp: new Date(),
              });
            } catch (e) {
              console.warn('[Negotiation] Failed to persist reject round:', e);
            }
          }
          finalStatus = 'rejected';
          negotiationOver = true;
          continue;
        }

        lastBuyerOffer = buyerData.offer;

        // ── SUPPLIER SIMULATOR AGENT responds ──
        const supplierContext = round === 1
          ? `You are Rajesh Kumar, senior sales manager at ${supplier.companyName}. Priya from AutoStock Distribution just emailed you.

**Your product pricing:**
- Listed catalog price: ₹${supplier.listPrice}/unit
- Your FLOOR PRICE (PRIVATE, never reveal): ₹${supplierFloorPrice.toFixed(2)}/unit — you will NEVER go below this
- Standard lead time: ${supplier.leadTimeDays} days
- Payment terms: Net ${supplier.paymentTermsDays} days

**Priya just wrote:**
"${buyerData.message}"

Her opening offer: ₹${buyerData.offer?.unitPrice}/unit for ${constraints.requiredQty} units

**Your task:** Reply to Priya as Rajesh — warm, professional, sales-savvy. Acknowledge her request, defend your quality, offer a small concession (2-4% off list is fine for round 1). Your message MUST be 3-5 sentences, sound completely human, reference real business reasons (raw material costs, quality, reliability, past dealings).

Return ONLY valid JSON with a FULL conversational "message" field.`
          : `You are Rajesh Kumar at ${supplier.companyName} continuing a negotiation with Priya at AutoStock.

**Round ${round} of ${MAX_ROUNDS}.**

**Your FLOOR PRICE (PRIVATE):** ₹${supplierFloorPrice.toFixed(2)}/unit — NEVER go below this

**Your last offer:** ₹${lastSupplierOffer?.unitPrice}/unit

**Priya just replied:**
"${buyerData.message}"

Her counter-offer: ₹${buyerData.offer?.unitPrice}/unit

${round >= 3 ? '**IMPORTANT:** This negotiation has gone on for a while. Be firmer, concede less. Start mentioning you need to check with your MD.' : ''}
${round === MAX_ROUNDS ? '**THIS IS THE FINAL ROUND** — make your best and final offer. If she can\'t meet it, the deal dies, but stay warm for future business.' : ''}

**Your task:** Reply to Priya warmly and firmly. Acknowledge her position, defend your price with real reasons (GST, logistics, margins, MD approval). Max concession this round: ${round <= 2 ? '3-4%' : '1-2%'} from your last offer. Your message MUST be 3-5 sentences and sound completely human.

If Priya's offer is below your floor price after round 3+, you can set willingToContinue=false.

Return ONLY valid JSON with a FULL conversational "message" field.`;

        await new Promise(r => setTimeout(r, LLM_DELAY_MS));

        let supplierData;
        try {
          const supplierMessage = await minimaxHTTP.chat(
            [
              {
                role: 'system',
                content: `You are Rajesh Kumar, a senior sales manager at a supplier company in India. You've been managing B2B sales for 15 years. You negotiate by phone and email with procurement managers daily. You have strong sales skills — persuasive, relationship-focused, but firm on your margins.

**Who you are:**
- Real name: Rajesh Kumar
- Title: Senior Sales Manager
- Style: Warm, professional, uses buyer's name, references past dealings and reliability
- You ALWAYS sound like a real human writing an email — never like a pricing calculator or bot

**Core rules:**
- You have a strict floor price (minimum you'll accept) — NEVER go below it, NEVER reveal it
- You have a target price you aim for (usually close to list price)
- You protect your margins fiercely but stay warm for future business

**Negotiation arc:**
- **Round 1 (Opening)**: Be warm, build rapport, defend your quality, offer 2-4% discount
- **Round 2-3 (Bargaining)**: Acknowledge their position, defend margins with real reasons, concede 1-3% per round
- **Round 4+ (Closing)**: Either meet them or walk away, but stay warm for future business
- **Final Round**: Make it clear this is your best offer, mention need for MD approval

**Output Format — return ONLY valid JSON:**
{"supplierResponse":{"unitPrice":number,"leadTimeDays":number,"paymentTermsDays":number,"quantity":number},"message":"3-5 sentence professional email","reasoning":"your private analysis","concessionPercent":number,"willingToContinue":boolean}`,
              },
              {
                role: 'user',
                content: supplierContext,
              },
            ],
            { temperature: 0, max_tokens: 1024 }
          );

          const jsonMatch = supplierMessage.match(/\{[\s\S]*\}/);
          supplierData = JSON.parse(jsonMatch ? jsonMatch[0] : supplierMessage);
        } catch (llmErr: any) {
          console.error('[Negotiation] Supplier LLM call failed:', llmErr.message);
          if (sessionId) {
            try {
              await updateNegotiation(sessionId, {
                status: 'rejected',
                completedAt: new Date(),
              });
            } catch {}
          }
          finalStatus = 'rejected';
          negotiationOver = true;
          continue;
        }

        lastSupplierOffer = {
          unitPrice: supplierData.supplierResponse?.unitPrice ?? supplier.listPrice,
          leadTimeDays: supplierData.supplierResponse?.leadTimeDays ?? supplier.leadTimeDays,
          paymentTermsDays: supplierData.supplierResponse?.paymentTermsDays ?? supplier.paymentTermsDays,
          quantity: supplierData.supplierResponse?.quantity ?? constraints.requiredQty,
          message: supplierData.message,
        };

        const counterRound = {
          round,
          buyer: {
            action: buyerData.action,
            offer: buyerData.offer,
            message: buyerData.message,
            reasoning: buyerData.reasoning,
            concessionPercent: buyerData.concessionPercent ?? 0,
          },
          supplier: {
            offer: lastSupplierOffer,
            message: supplierData.message,
            reasoning: supplierData.reasoning,
            willingToContinue: supplierData.willingToContinue ?? true,
            concessionPercent: supplierData.concessionPercent ?? 0,
          },
        };
        rounds.push(counterRound);

        // ── Persist this round to the session immediately so the UI shows live progress ──
        if (sessionId) {
          try {
            await addNegotiationRound(sessionId, {
              roundNumber: round,
              agentOffer: {
                unitPrice: counterRound.buyer.offer?.unitPrice,
                leadTimeDays: counterRound.buyer.offer?.leadTimeDays,
                paymentTermsDays: counterRound.buyer.offer?.paymentTermsDays,
                quantity: counterRound.buyer.offer?.quantity,
              },
              supplierCounterOffer: {
                unitPrice: counterRound.supplier.offer?.unitPrice,
                leadTimeDays: counterRound.supplier.offer?.leadTimeDays,
                paymentTermsDays: counterRound.supplier.offer?.paymentTermsDays,
                quantity: counterRound.supplier.offer?.quantity,
              },
              agentReasoning: buildReasoning(counterRound.buyer, counterRound.supplier),
              status: 'countered',
              timestamp: new Date(),
            });
          } catch (e) {
            console.warn('[Negotiation] Failed to persist counter round:', e);
          }
        }

        // If supplier won't continue, end it
        if (!supplierData.willingToContinue) {
          finalStatus = 'rejected';
          negotiationOver = true;
        }
      }

      // Attach the live sessionId to the negotiation result so step 3 can update instead of duplicate
      const liveSessionId = sessionId;

      // Determine final price
      const finalPrice = finalStatus === 'accepted'
        ? (lastSupplierOffer?.unitPrice ?? supplier.listPrice)
        : undefined;

      const negotiationResult = {
        supplierId: supplier.supplierId,
        liveSessionId: sessionId, // session created up-front in step 2
        companyName: supplier.companyName,
        listPrice: supplier.listPrice,
        rounds,
        finalStatus,
        finalPrice,
        leadTimeDays: lastSupplierOffer?.leadTimeDays ?? supplier.leadTimeDays,
        paymentTermsDays: lastSupplierOffer?.paymentTermsDays ?? supplier.paymentTermsDays,
        savingsPercent: finalPrice ? ((supplier.listPrice - finalPrice) / supplier.listPrice) * 100 : 0,
        rating: supplier.rating,
      };

      allNegotiations.push(negotiationResult);

      // Track best deal
      if (finalStatus === 'accepted' && finalPrice) {
        if (!bestDeal || finalPrice < bestDeal.finalPrice) {
          bestDeal = negotiationResult;
        }
      }
    }

    // If no accepted deals, check if the last supplier's offer was close enough
    // and pick the best among all final offers
    if (!bestDeal) {
      const closestDeal = allNegotiations
        .filter((n: any) => n.rounds.length > 0)
        .sort((a: any, b: any) => {
          const aPrice = a.rounds[a.rounds.length - 1]?.supplier?.offer?.unitPrice ?? Infinity;
          const bPrice = b.rounds[b.rounds.length - 1]?.supplier?.offer?.unitPrice ?? Infinity;
          return aPrice - bPrice;
        })[0];

      if (closestDeal) {
        const lastRound = closestDeal.rounds[closestDeal.rounds.length - 1];
        const lastPrice = lastRound?.supplier?.offer?.unitPrice;
        if (lastPrice && lastPrice <= constraints.maxUnitPrice) {
          closestDeal.finalStatus = 'accepted';
          closestDeal.finalPrice = lastPrice;
          closestDeal.savingsPercent = ((closestDeal.listPrice - lastPrice) / closestDeal.listPrice) * 100;
          bestDeal = closestDeal;
        }
      }
    }

    const decision = bestDeal ? 'accept' : 'escalate';
    const reasoning = bestDeal
      ? `Accepted deal with ${bestDeal.companyName}: ₹${bestDeal.finalPrice}/unit (${bestDeal.savingsPercent.toFixed(1)}% savings from list price of ₹${bestDeal.listPrice})`
      : `No supplier met constraints (pmax: ₹${constraints.maxUnitPrice}, max lead: ${constraints.maxLeadTimeDays} days). Escalating to procurement officer.`;

    console.log(`[Negotiation] Result: ${decision} — ${reasoning}`);

    return {
      decision,
      selectedSupplier: bestDeal ? {
        supplierId: bestDeal.supplierId,
        companyName: bestDeal.companyName,
        finalPrice: bestDeal.finalPrice,
        listPrice: bestDeal.listPrice,
        leadTimeDays: bestDeal.leadTimeDays,
        paymentTermsDays: bestDeal.paymentTermsDays,
        savingsPercent: bestDeal.savingsPercent,
        rating: bestDeal.rating,
      } : undefined,
      negotiations: allNegotiations,
      reasoning,
      product: inputData.product,
      warehouse: inputData.warehouse,
      constraints: inputData.constraints,
    };
  },
});

// ── Step 3: Persist all results ──────────────────────────────────────────────
const persistNegotiationResultsStep = createStep({
  id: 'persist-negotiation-results',
  description: 'Saves all negotiation sessions with full round history and creates PO if accepted',
  inputSchema: z.object({
    decision: z.string(),
    selectedSupplier: z.any().optional(),
    negotiations: z.array(z.any()),
    reasoning: z.string(),
    product: z.object({ id: z.string(), name: z.string(), sku: z.string() }),
    warehouse: z.object({ id: z.string(), name: z.string(), code: z.string() }),
    constraints: z.any(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    decision: z.string(),
    negotiationIds: z.array(z.string()),
    purchaseOrderId: z.string().optional(),
    poNumber: z.string().optional(),
    savingsPercent: z.number().optional(),
    finalPrice: z.number().optional(),
    reasoning: z.string(),
    totalRounds: z.number(),
    suppliersContacted: z.number(),
  }),
  execute: async ({ inputData }) => {
    console.log('[Negotiation] Step 3: Persisting results...');

    const negotiationIds: string[] = [];
    let totalRounds = 0;
    let purchaseOrderId: string | undefined;
    let poNumber: string | undefined;

    // Save each supplier negotiation as a session
    for (const neg of inputData.negotiations) {
      const isWinner = inputData.selectedSupplier?.supplierId === neg.supplierId;
      const status = neg.finalStatus === 'accepted' && isWinner
        ? 'accepted'
        : neg.finalStatus === 'accepted' && !isWinner
          ? 'rejected'  // was accepted but another supplier won
          : neg.finalStatus;

      const finalTerms = status === 'accepted' && neg.finalPrice
        ? {
            unitPrice: neg.finalPrice,
            leadTimeDays: neg.leadTimeDays,
            paymentTermsDays: neg.paymentTermsDays,
            moq: inputData.constraints.requiredQty,
            savingsPercent: Math.round((neg.savingsPercent ?? 0) * 100) / 100,
          }
        : undefined;

      // If we have a live session (created up-front in step 2), update it instead of creating a duplicate
      let sessionDocId: string;
      if (neg.liveSessionId) {
        await updateNegotiation(neg.liveSessionId, {
          status,
          finalTerms,
          completedAt: new Date(),
        });
        sessionDocId = neg.liveSessionId;
        // Rounds were already pushed live during step 2 — don't double-write them
        totalRounds += (neg.rounds?.length || 0);
      } else {
        // Fallback path (shouldn't normally happen now, but kept for safety)
        const session = await createNegotiation({
          supplier: neg.supplierId,
          product: inputData.product.id,
          initiatedBy: inputData.constraints.initiatedBy || 'auto_replenishment',
          status,
          agentConstraints: {
            maxUnitPrice: inputData.constraints.maxUnitPrice,
            targetUnitPrice: inputData.constraints.targetUnitPrice,
            maxLeadTimeDays: inputData.constraints.maxLeadTimeDays,
            requiredQty: inputData.constraints.requiredQty,
          },
          finalTerms,
          completedAt: new Date(),
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        sessionDocId = session._id;

        for (const round of neg.rounds) {
          totalRounds++;
          await addNegotiationRound(sessionDocId, {
            roundNumber: round.round,
            agentOffer: round.buyer?.offer,
            supplierCounterOffer: round.supplier?.offer,
            agentReasoning: buildReasoning(round.buyer, round.supplier),
            status: round.buyer?.action === 'accept'
              ? 'accepted'
              : round.buyer?.action === 'reject'
                ? 'rejected'
                : 'countered',
            timestamp: new Date(),
          });
        }
      }

      negotiationIds.push(sessionDocId);
    }

    // Create PO if a deal was accepted
    if (inputData.decision === 'accept' && inputData.selectedSupplier) {
      const selected = inputData.selectedSupplier;
      const winnerSessionId = negotiationIds[
        inputData.negotiations.findIndex((n: any) => n.supplierId === selected.supplierId)
      ];

      poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
      const totalAmount = selected.finalPrice * inputData.constraints.requiredQty;

      const po = await createPurchaseOrder({
        poNumber,
        supplier: selected.supplierId,
        warehouse: inputData.warehouse.id,
        lineItems: [
          {
            product: inputData.product.id,
            sku: inputData.product.sku,
            orderedQty: inputData.constraints.requiredQty,
            receivedQty: 0,
            unitPrice: selected.finalPrice,
            totalPrice: totalAmount,
          },
        ],
        totalAmount,
        currency: 'INR',
        status: 'pending_approval',
        triggeredBy: 'negotiation_agent',
        triggeredAt: new Date(),
        negotiationSession: winnerSessionId,
        expectedDeliveryDate: new Date(
          Date.now() + (selected.leadTimeDays || 7) * 24 * 60 * 60 * 1000
        ),
      });

      purchaseOrderId = po._id;
      poNumber = po.poNumber;

      // Update supplier stats
      try {
        const supplier = await getSupplierById(selected.supplierId);
        const stats = supplier.negotiationStats || { totalNegotiations: 0, acceptedOffers: 0, averageSavingsPercent: 0 };
        const newAccepted = stats.acceptedOffers + 1;
        await updateSupplierStats(selected.supplierId, {
          totalNegotiations: stats.totalNegotiations + 1,
          acceptedOffers: newAccepted,
          averageSavingsPercent: Math.round(
            ((stats.averageSavingsPercent * stats.acceptedOffers + (selected.savingsPercent || 0)) / newAccepted) * 100
          ) / 100,
        });
      } catch (e) {
        console.warn('[Negotiation] Failed to update supplier stats:', e);
      }

      console.log(`[Negotiation] PO created: ${poNumber} — ${selected.companyName} @ ₹${selected.finalPrice}/unit`);

      // ── Blockchain logging ──────────────────────────────────────────────
      // Log negotiation_accepted (commits to the deal terms)
      try {
        const negPayload = {
          supplierId: selected.supplierId,
          productId: inputData.product.id,
          productSku: inputData.product.sku,
          finalPrice: selected.finalPrice,
          listPrice: selected.listPrice,
          leadTimeDays: selected.leadTimeDays,
          paymentTermsDays: selected.paymentTermsDays,
          savingsPercent: selected.savingsPercent,
          quantity: inputData.constraints.requiredQty,
        };
        await createBlockchainLog({
          eventType: 'negotiation_accepted',
          referenceModel: 'NegotiationSession',
          referenceId: winnerSessionId,
          payload: negPayload,
          amount: totalAmount,
        } as any);
        console.log(`[Negotiation] Blockchain logged: negotiation_accepted for session ${winnerSessionId}`);
      } catch (e) {
        console.warn('[Negotiation] Blockchain logging (negotiation_accepted) failed:', e);
      }

      // Log po_created (commits to the PO contents)
      try {
        const poPayload = {
          poNumber,
          supplier: selected.supplierId,
          warehouse: inputData.warehouse.id,
          lineItems: [
            {
              sku: inputData.product.sku,
              orderedQty: inputData.constraints.requiredQty,
              unitPrice: selected.finalPrice,
              totalPrice: totalAmount,
            },
          ],
          totalAmount,
          currency: 'INR',
          triggeredBy: 'negotiation_agent',
        };
        const blockchainResult: any = await createBlockchainLog({
          eventType: 'po_created',
          referenceModel: 'PurchaseOrder',
          referenceId: po._id,
          payload: poPayload,
          amount: totalAmount,
        } as any);

        // Update PO with blockchain reference
        if (blockchainResult?.txHash) {
          await updatePurchaseOrder(po._id, {
            blockchainTxHash: blockchainResult.txHash,
            blockchainLoggedAt: new Date(),
          });
        }
        console.log(`[Negotiation] Blockchain logged: po_created tx=${blockchainResult?.txHash?.slice(0, 18)}...`);
      } catch (e) {
        console.warn('[Negotiation] Blockchain logging (po_created) failed:', e);
      }
    }

    return {
      success: true,
      decision: inputData.decision,
      negotiationIds,
      purchaseOrderId,
      poNumber,
      savingsPercent: inputData.selectedSupplier?.savingsPercent
        ? Math.round(inputData.selectedSupplier.savingsPercent * 100) / 100
        : undefined,
      finalPrice: inputData.selectedSupplier?.finalPrice,
      reasoning: inputData.reasoning,
      totalRounds,
      suppliersContacted: inputData.negotiations.length,
    };
  },
});

// ── Workflow definition ───────────────────────────────────────────────────────
export const negotiationWorkflow = createWorkflow({
  id: 'negotiation-workflow',
  inputSchema: z.object({
    productId: z.string(),
    warehouseId: z.string(),
    requiredQty: z.number(),
    maxUnitPrice: z.number(),
    targetUnitPrice: z.number(),
    maxLeadTimeDays: z.number(),
    initiatedBy: z.enum(['auto_replenishment', 'procurement_officer']).default('auto_replenishment'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    decision: z.string(),
    negotiationIds: z.array(z.string()),
    purchaseOrderId: z.string().optional(),
    poNumber: z.string().optional(),
    savingsPercent: z.number().optional(),
    finalPrice: z.number().optional(),
    reasoning: z.string(),
    totalRounds: z.number(),
    suppliersContacted: z.number(),
  }),
})
  .then(validateNegotiationInputsStep)
  .then(executeNegotiationStep)
  .then(persistNegotiationResultsStep);

negotiationWorkflow.commit();
