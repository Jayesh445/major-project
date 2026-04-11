import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { getAllInventory, getPurchaseOrders, getActiveWarehouses } from '../api-client.js';

// ── Step 1: Collect system-wide data ─────────────────────────────────────────
const collectSystemDataStep = createStep({
  id: 'collect-system-data',
  description: 'Collects inventory, PO, and warehouse data for anomaly scanning',
  inputSchema: z.object({}),
  outputSchema: z.object({
    inventory: z.array(z.any()),
    recentOrders: z.array(z.any()),
    warehouses: z.array(z.any()),
  }),
  execute: async () => {
    console.log('[AnomalyDetection] Step 1: Collecting system data...');

    const [inventories, orders, warehouses] = await Promise.all([
      getAllInventory(),
      getPurchaseOrders({ limit: 50 }),
      getActiveWarehouses(),
    ]);

    const activeInventory = inventories
      .filter((inv: any) => inv.product?.isActive && inv.warehouse?.isActive)
      .map((inv: any) => ({
        productId: inv.product._id.toString(),
        productName: inv.product.name,
        sku: inv.product.sku,
        warehouseId: inv.warehouse._id.toString(),
        warehouseName: inv.warehouse.name,
        currentStock: inv.currentStock,
        availableStock: inv.availableStock,
        reorderPoint: inv.reorderPoint,
        safetyStock: inv.safetyStock,
      }));

    const enrichedOrders = orders.map((po: any) => ({
      poNumber: po.poNumber,
      supplierId: po.supplier?._id?.toString(),
      supplierName: po.supplier?.companyName || 'Unknown',
      warehouseName: po.warehouse?.name || 'Unknown',
      totalAmount: po.totalAmount,
      status: po.status,
      triggeredBy: po.triggeredBy,
      createdAt: po.createdAt,
    }));

    const enrichedWarehouses = warehouses.map((wh: any) => ({
      id: wh._id.toString(),
      name: wh.name,
      code: wh.code,
      totalCapacity: wh.totalCapacity,
      usedCapacity: wh.usedCapacity,
      utilizationPercent: wh.totalCapacity > 0 ? Math.round((wh.usedCapacity / wh.totalCapacity) * 1000) / 10 : 0,
    }));

    console.log(`[AnomalyDetection] Collected: ${activeInventory.length} inventory items, ${enrichedOrders.length} orders, ${enrichedWarehouses.length} warehouses`);

    return {
      inventory: activeInventory,
      recentOrders: enrichedOrders,
      warehouses: enrichedWarehouses,
    };
  },
});

// ── Step 2: AI-powered anomaly analysis ──────────────────────────────────────
const analyzeAnomaliesStep = createStep({
  id: 'analyze-anomalies',
  description: 'Uses AI agent to detect anomalies across all supply chain data',
  inputSchema: z.object({
    inventory: z.array(z.any()),
    recentOrders: z.array(z.any()),
    warehouses: z.array(z.any()),
  }),
  outputSchema: z.object({
    scanTimestamp: z.string(),
    anomalies: z.array(z.any()),
    summary: z.object({
      totalAnomalies: z.number(),
      criticalCount: z.number(),
      warningCount: z.number(),
      infoCount: z.number(),
      overallHealthScore: z.number(),
    }),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('anomalyDetectionAgent');
    if (!agent) throw new Error('Anomaly detection agent not found');

    console.log('[AnomalyDetection] Step 2: Running anomaly analysis...');

    const inventorySummary = inputData.inventory
      .map(
        (i: any) =>
          `${i.sku} @ ${i.warehouseName}: stock=${i.availableStock}, ROP=${i.reorderPoint}, safety=${i.safetyStock}, ratio=${(i.availableStock / Math.max(i.reorderPoint, 1)).toFixed(2)}`
      )
      .join('\n');

    const ordersSummary = inputData.recentOrders
      .slice(0, 20)
      .map(
        (o: any) =>
          `${o.poNumber}: ${o.supplierName}, ₹${o.totalAmount}, status=${o.status}, trigger=${o.triggeredBy}, date=${o.createdAt}`
      )
      .join('\n');

    const warehouseSummary = inputData.warehouses
      .map((w: any) => `${w.code} (${w.name}): ${w.utilizationPercent}% capacity (${w.usedCapacity}/${w.totalCapacity})`)
      .join('\n');

    const prompt = `Scan the following supply chain data for anomalies:

**Inventory (${inputData.inventory.length} items):**
${inventorySummary}

**Recent Purchase Orders (${inputData.recentOrders.length} orders):**
${ordersSummary}

**Warehouses (${inputData.warehouses.length}):**
${warehouseSummary}

Detect ALL anomalies across inventory, procurement, warehouse, and demand categories.
Return ONLY valid JSON. No markdown, no code blocks.`;

    const result = await agent.generate([{ role: 'user', content: prompt }]);

    let data;
    try {
      const text = result.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      data = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      data = {
        scanTimestamp: new Date().toISOString(),
        anomalies: [],
        summary: { totalAnomalies: 0, criticalCount: 0, warningCount: 0, infoCount: 0, overallHealthScore: 100 },
      };
    }

    console.log(`[AnomalyDetection] Found ${data.anomalies?.length ?? 0} anomalies`);

    return {
      scanTimestamp: data.scanTimestamp || new Date().toISOString(),
      anomalies: data.anomalies || [],
      summary: data.summary || { totalAnomalies: 0, criticalCount: 0, warningCount: 0, infoCount: 0, overallHealthScore: 100 },
    };
  },
});

// ── Workflow definition ───────────────────────────────────────────────────────
export const anomalyDetectionWorkflow = createWorkflow({
  id: 'anomaly-detection-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    scanTimestamp: z.string(),
    anomalies: z.array(z.any()),
    summary: z.object({
      totalAnomalies: z.number(),
      criticalCount: z.number(),
      warningCount: z.number(),
      infoCount: z.number(),
      overallHealthScore: z.number(),
    }),
  }),
})
  .then(collectSystemDataStep)
  .then(analyzeAnomaliesStep);

anomalyDetectionWorkflow.commit();
