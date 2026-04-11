import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { getAllInventory, getPurchaseOrders, getSuppliersByProduct } from '../api-client.js';

// ── Step 1: Scan all inventory for reorder needs ─────────────────────────────
const scanInventoryStep = createStep({
  id: 'scan-inventory-for-reorder',
  description: 'Scans all inventory records to identify products that need reordering',
  inputSchema: z.object({}),
  outputSchema: z.object({
    allProducts: z.array(z.any()),
    needingReorder: z.array(z.any()),
  }),
  execute: async () => {
    console.log('[SmartReorder] Step 1: Scanning inventory...');

    const [inventories, pendingPOs] = await Promise.all([
      getAllInventory(),
      getPurchaseOrders({ status: 'sent_to_supplier', limit: 100 }),
    ]);

    const active = inventories.filter(
      (inv: any) => inv.product?.isActive && inv.warehouse?.isActive
    );

    const products = active.map((inv: any) => {
      const productId = inv.product._id.toString();
      const warehouseId = inv.warehouse._id.toString();

      const pendingIncoming = pendingPOs
        .filter((po: any) =>
          po.lineItems?.some((li: any) =>
            (li.product?.toString() || li.product?._id?.toString()) === productId
          )
        )
        .reduce((sum: number, po: any) => {
          const item = po.lineItems.find((li: any) =>
            (li.product?.toString() || li.product?._id?.toString()) === productId
          );
          return sum + (item ? item.orderedQty - item.receivedQty : 0);
        }, 0);

      const recentTxns = (inv.transactions as any[] || [])
        .filter((t: any) => {
          const age = Date.now() - new Date(t.timestamp).getTime();
          return age < 30 * 24 * 60 * 60 * 1000 && ['sale', 'transfer_out'].includes(t.type);
        });
      const avgDailyDemand = recentTxns.length > 0
        ? recentTxns.reduce((s: number, t: any) => s + Math.abs(t.quantity), 0) / 30
        : 5;

      const effectiveStock = inv.availableStock + pendingIncoming;
      const daysUntilStockout = avgDailyDemand > 0 ? Math.floor(effectiveStock / avgDailyDemand) : 999;

      return {
        productId,
        productName: inv.product.name,
        sku: inv.product.sku,
        warehouseId,
        warehouseName: inv.warehouse.name,
        currentStock: inv.currentStock,
        availableStock: inv.availableStock,
        reorderPoint: inv.reorderPoint,
        safetyStock: inv.safetyStock,
        pendingIncoming,
        effectiveStock,
        avgDailyDemand: Math.round(avgDailyDemand * 10) / 10,
        daysUntilStockout,
        needsReorder: inv.availableStock <= inv.reorderPoint && pendingIncoming === 0,
      };
    });

    const needingReorder = products.filter((p: any) => p.needsReorder)
      .sort((a: any, b: any) => a.daysUntilStockout - b.daysUntilStockout);

    console.log(`[SmartReorder] Found ${needingReorder.length}/${products.length} products needing reorder`);

    return { allProducts: products, needingReorder };
  },
});

// ── Step 2: Generate smart reorder plan via AI agent ─────────────────────────
const generateReorderPlanStep = createStep({
  id: 'generate-reorder-plan',
  description: 'Uses AI agent to create an optimized reorder plan with EOQ calculations',
  inputSchema: z.object({
    allProducts: z.array(z.any()),
    needingReorder: z.array(z.any()),
  }),
  outputSchema: z.object({
    analysisDate: z.string(),
    reorderRecommendations: z.array(z.any()),
    summary: z.object({
      totalProducts: z.number(),
      needingReorder: z.number(),
      criticalItems: z.number(),
      estimatedTotalSpend: z.number(),
    }),
  }),
  execute: async ({ inputData, mastra }) => {
    if (inputData.needingReorder.length === 0) {
      console.log('[SmartReorder] No products need reordering');
      return {
        analysisDate: new Date().toISOString().split('T')[0],
        reorderRecommendations: [],
        summary: {
          totalProducts: inputData.allProducts.length,
          needingReorder: 0,
          criticalItems: 0,
          estimatedTotalSpend: 0,
        },
      };
    }

    const agent = mastra?.getAgent('smartReorderAgent');
    if (!agent) throw new Error('Smart reorder agent not found');

    console.log('[SmartReorder] Step 2: Generating reorder plan...');

    const productList = inputData.needingReorder
      .map(
        (p: any) =>
          `- ${p.sku} (${p.productName}) @ ${p.warehouseName}: stock=${p.availableStock}, ROP=${p.reorderPoint}, safety=${p.safetyStock}, demand=${p.avgDailyDemand}/day, daysLeft=${p.daysUntilStockout}, pending=${p.pendingIncoming}`
      )
      .join('\n');

    const prompt = `Generate an optimized reorder plan for the following products:

**Products Needing Reorder (${inputData.needingReorder.length}):**
${productList}

**Total Products Monitored:** ${inputData.allProducts.length}

Use the tools to calculate EOQ for each product and generate recommendations.
Assume: ordering cost = 500 INR/PO, holding cost = 50 INR/unit/year, lead time std dev = 2 days.
Return ONLY valid JSON. No markdown, no code blocks.`;

    const result = await agent.generate([{ role: 'user', content: prompt }]);

    let data;
    try {
      const text = result.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      data = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      data = {
        analysisDate: new Date().toISOString().split('T')[0],
        reorderRecommendations: [],
        summary: {
          totalProducts: inputData.allProducts.length,
          needingReorder: inputData.needingReorder.length,
          criticalItems: inputData.needingReorder.filter((p: any) => p.daysUntilStockout <= 3).length,
          estimatedTotalSpend: 0,
        },
      };
    }

    console.log(`[SmartReorder] Generated ${data.reorderRecommendations?.length ?? 0} recommendations`);

    return {
      analysisDate: data.analysisDate || new Date().toISOString().split('T')[0],
      reorderRecommendations: data.reorderRecommendations || [],
      summary: data.summary || {
        totalProducts: inputData.allProducts.length,
        needingReorder: inputData.needingReorder.length,
        criticalItems: 0,
        estimatedTotalSpend: 0,
      },
    };
  },
});

// ── Workflow ──────────────────────────────────────────────────────────────────
export const smartReorderWorkflow = createWorkflow({
  id: 'smart-reorder-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    analysisDate: z.string(),
    reorderRecommendations: z.array(z.any()),
    summary: z.object({
      totalProducts: z.number(),
      needingReorder: z.number(),
      criticalItems: z.number(),
      estimatedTotalSpend: z.number(),
    }),
  }),
})
  .then(scanInventoryStep)
  .then(generateReorderPlanStep);

smartReorderWorkflow.commit();
