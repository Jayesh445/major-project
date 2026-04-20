import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { minimaxHTTP } from '../models/minimax-http.js';
import { getApprovedSuppliers, getPurchaseOrders } from '../api-client.js';

// ── Step 1: Gather supplier data ─────────────────────────────────────────────
const gatherSupplierDataStep = createStep({
  id: 'gather-supplier-data',
  description: 'Fetches all suppliers and their purchase order history',
  inputSchema: z.object({}),
  outputSchema: z.object({
    suppliers: z.array(z.any()),
  }),
  execute: async () => {
    console.log('[SupplierEval] Step 1: Gathering supplier data...');

    const suppliers = await getApprovedSuppliers();

    const enriched = await Promise.all(
      suppliers.map(async (s: any) => {
        const orders = await getPurchaseOrders({ supplier: s._id.toString(), limit: 30 });

        let onTime = 0;
        let late = 0;
        let completed = 0;
        let cancelled = 0;
        let totalSpend = 0;

        for (const po of orders) {
          totalSpend += po.totalAmount || 0;
          if (['fully_received', 'partially_received'].includes(po.status)) {
            completed++;
            if (po.expectedDeliveryDate && new Date(po.updatedAt) <= new Date(po.expectedDeliveryDate)) {
              onTime++;
            } else {
              late++;
            }
          }
          if (po.status === 'cancelled') cancelled++;
        }

        return {
          supplierId: s._id.toString(),
          companyName: s.companyName,
          rating: s.rating,
          catalogProductCount: s.catalogProducts?.length ?? 0,
          negotiationStats: s.negotiationStats || { totalNegotiations: 0, acceptedOffers: 0, averageSavingsPercent: 0 },
          orderMetrics: {
            totalOrders: orders.length,
            completedOrders: completed,
            onTimeDeliveries: onTime,
            lateDeliveries: late,
            cancelledOrders: cancelled,
            totalSpend,
          },
        };
      })
    );

    console.log(`[SupplierEval] Gathered data for ${enriched.length} suppliers`);
    return { suppliers: enriched };
  },
});

// ── Step 2: Score and rank using AI ──────────────────────────────────────────
const scoreAndRankStep = createStep({
  id: 'score-and-rank-suppliers',
  description: 'Uses AI agent to analyze supplier data and generate scores',
  inputSchema: z.object({
    suppliers: z.array(z.any()),
  }),
  outputSchema: z.object({
    evaluationDate: z.string(),
    supplierScores: z.array(z.any()),
    alerts: z.array(z.any()),
    summary: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log('[SupplierEval] Step 2: Scoring and ranking...');

    const supplierSummary = inputData.suppliers
      .map(
        (s: any) =>
          `- ${s.companyName} (ID: ${s.supplierId}): Rating=${s.rating}/5, Products=${s.catalogProductCount}, ` +
          `Orders=${s.orderMetrics.totalOrders} (completed=${s.orderMetrics.completedOrders}, onTime=${s.orderMetrics.onTimeDeliveries}, late=${s.orderMetrics.lateDeliveries}, cancelled=${s.orderMetrics.cancelledOrders}), ` +
          `Spend=₹${s.orderMetrics.totalSpend}, Negotiations=${s.negotiationStats.totalNegotiations} (accepted=${s.negotiationStats.acceptedOffers}, avgSavings=${s.negotiationStats.averageSavingsPercent}%)`
      )
      .join('\n');

    const prompt = `Evaluate and score the following suppliers using the SRI formula:

**Suppliers (${inputData.suppliers.length} total):**
${supplierSummary}

Score each supplier using the SRI formula, rank them, identify alerts, and provide recommendations.
Return ONLY valid JSON. No markdown, no code blocks.`;

    let data;
    try {
      const message = await minimaxHTTP.chat(
        [
          {
            role: 'system',
            content: `You are a supplier evaluation AI. Score suppliers using the SRI (Supplier Readiness Index) formula based on quality, reliability, and innovation metrics.

SRI = (Quality_Score * 0.4) + (Reliability_Score * 0.35) + (Innovation_Score * 0.25)

Output format MUST be valid JSON only:
{
  "evaluationDate": "YYYY-MM-DD",
  "supplierScores": [
    {"supplierId": "id", "companyName": "name", "sriScore": number, "qualityScore": number, "reliabilityScore": number, "innovationScore": number, "rank": number, "recommendation": "approve|monitor|caution"}
  ],
  "alerts": [
    {"supplierId": "id", "companyName": "name", "alertType": "late_delivery|quality_issue|overdue_payment", "severity": "critical|warning", "details": "details"}
  ],
  "summary": "summary of evaluation results"
}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        { temperature: 0, max_tokens: 2048 }
      );

      const jsonMatch = message.match(/\{[\s\S]*\}/);
      data = JSON.parse(jsonMatch ? jsonMatch[0] : message);
    } catch {
      data = {
        evaluationDate: new Date().toISOString().split('T')[0],
        supplierScores: [],
        alerts: [],
        summary: 'Failed to parse evaluation results',
      };
    }

    console.log(`[SupplierEval] Scored ${data.supplierScores?.length ?? 0} suppliers`);

    return {
      evaluationDate: data.evaluationDate || new Date().toISOString().split('T')[0],
      supplierScores: data.supplierScores || [],
      alerts: data.alerts || [],
      summary: data.summary || '',
    };
  },
});

// ── Workflow definition ───────────────────────────────────────────────────────
export const supplierEvaluationWorkflow = createWorkflow({
  id: 'supplier-evaluation-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    evaluationDate: z.string(),
    supplierScores: z.array(z.any()),
    alerts: z.array(z.any()),
    summary: z.string(),
  }),
})
  .then(gatherSupplierDataStep)
  .then(scoreAndRankStep);

supplierEvaluationWorkflow.commit();
