import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  getAllInventory,
  getPurchaseOrders,
  getSuppliersByProduct,
  saveReorderRecommendations,
} from '../api-client.js';

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

// ── Step 2: Compute EOQ, supplier info, and save recommendations ─────────────
const generateReorderPlanStep = createStep({
  id: 'generate-reorder-plan',
  description: 'Computes EOQ for each product, enriches with supplier info, and persists recommendations',
  inputSchema: z.object({
    allProducts: z.array(z.any()),
    needingReorder: z.array(z.any()),
  }),
  outputSchema: z.object({
    analysisDate: z.string(),
    recommendationIds: z.array(z.string()),
    summary: z.object({
      totalProducts: z.number(),
      needingReorder: z.number(),
      criticalItems: z.number(),
      estimatedTotalSpend: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    if (inputData.needingReorder.length === 0) {
      console.log('[SmartReorder] No products need reordering');
      return {
        analysisDate: new Date().toISOString().split('T')[0],
        recommendationIds: [],
        summary: {
          totalProducts: inputData.allProducts.length,
          needingReorder: 0,
          criticalItems: 0,
          estimatedTotalSpend: 0,
        },
      };
    }

    console.log('[SmartReorder] Step 2: Computing EOQ + enriching with supplier data...');

    const orderingCostPerPO = 500;
    const holdingCostPerUnit = 50;
    const recommendations: any[] = [];

    for (const p of inputData.needingReorder) {
      // EOQ formula: sqrt(2 * annualDemand * orderingCost / holdingCost)
      const annualDemand = p.avgDailyDemand * 365;
      const eoq = Math.ceil(
        Math.sqrt((2 * annualDemand * orderingCostPerPO) / holdingCostPerUnit)
      );

      // Fetch supplier info for pricing
      let supplierCount = 0;
      let minSupplierPrice = 0;
      let avgSupplierLeadTime = 7;
      try {
        const suppliers = await getSuppliersByProduct(p.productId);
        supplierCount = suppliers.length;
        const catalogEntries = suppliers
          .map((s: any) => {
            const entry = s.catalogProducts?.find(
              (cp: any) =>
                cp.product?._id?.toString() === p.productId ||
                cp.product?.toString() === p.productId
            );
            return entry;
          })
          .filter(Boolean);

        const prices = catalogEntries.map((e: any) => e.unitPrice).filter((x: number) => x > 0);
        const leadTimes = catalogEntries.map((e: any) => e.leadTimeDays).filter((x: number) => x > 0);

        minSupplierPrice = prices.length > 0 ? Math.min(...prices) : 0;
        avgSupplierLeadTime = leadTimes.length > 0
          ? Math.round(leadTimes.reduce((a: number, b: number) => a + b, 0) / leadTimes.length)
          : 7;
      } catch (e) {
        console.warn(`[SmartReorder] Failed to fetch suppliers for ${p.sku}:`, e);
      }

      // Recommended qty: max(EOQ, 7 days of demand buffer)
      const weeklyDemand = Math.ceil(p.avgDailyDemand * 7);
      const recommendedQty = Math.max(eoq, weeklyDemand);

      // Urgency based on days until stockout
      const urgency =
        p.daysUntilStockout <= 3 ? 'critical' :
        p.daysUntilStockout <= 7 ? 'high' :
        p.daysUntilStockout <= 14 ? 'medium' : 'low';

      // Generate reason text
      const reasonParts = [
        `Stock at ${p.availableStock} units vs ROP ${p.reorderPoint}`,
        `${p.daysUntilStockout} days until stockout at current demand`,
      ];
      if (urgency === 'critical') reasonParts.unshift('CRITICAL:');
      if (supplierCount === 0) reasonParts.push('WARNING: No approved suppliers');
      if (supplierCount === 1) reasonParts.push('Single-source risk');
      const reason = reasonParts.join(' | ');

      const estimatedUnitPrice = minSupplierPrice || 100; // fallback
      const estimatedTotalCost = estimatedUnitPrice * recommendedQty;

      recommendations.push({
        product: p.productId,
        warehouse: p.warehouseId,
        currentStock: p.currentStock,
        availableStock: p.availableStock,
        reorderPoint: p.reorderPoint,
        safetyStock: p.safetyStock,
        avgDailyDemand: p.avgDailyDemand,
        daysUntilStockout: p.daysUntilStockout,
        pendingIncoming: p.pendingIncoming,
        recommendedQty,
        eoq,
        estimatedUnitPrice,
        estimatedTotalCost,
        urgency,
        reason,
        supplierCount,
        minSupplierPrice,
        avgSupplierLeadTime,
        status: 'pending',
      });
    }

    // Persist to MongoDB
    let savedIds: string[] = [];
    try {
      const result = await saveReorderRecommendations(recommendations);
      savedIds = result.ids;
      console.log(`[SmartReorder] Saved ${result.count} recommendations`);
    } catch (e) {
      console.error('[SmartReorder] Failed to save:', e);
    }

    const criticalItems = recommendations.filter((r) => r.urgency === 'critical').length;
    const estimatedTotalSpend = recommendations.reduce((sum, r) => sum + r.estimatedTotalCost, 0);

    return {
      analysisDate: new Date().toISOString().split('T')[0],
      recommendationIds: savedIds,
      summary: {
        totalProducts: inputData.allProducts.length,
        needingReorder: recommendations.length,
        criticalItems,
        estimatedTotalSpend: Math.round(estimatedTotalSpend),
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
    recommendationIds: z.array(z.string()),
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
