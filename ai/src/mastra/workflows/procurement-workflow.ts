import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  getProductById,
  getWarehouseById,
  getInventoryByProductWarehouse,
  getForecasts,
  getSuppliersByProduct,
  getPurchaseOrders,
} from '../api-client.js';

// ── Step 1: Assess replenishment need ────────────────────────────────────────
const assessReplenishmentStep = createStep({
  id: 'assess-replenishment',
  description: 'Checks stock levels, forecast, and pending orders to determine if replenishment is needed',
  inputSchema: z.object({
    productId: z.string(),
    warehouseId: z.string(),
    orderingCostPerPO: z.number().default(500),
    holdingCostPerUnit: z.number().default(50),
  }),
  outputSchema: z.object({
    needsReplenishment: z.boolean(),
    product: z.object({ id: z.string(), name: z.string(), sku: z.string() }),
    warehouse: z.object({ id: z.string(), name: z.string(), code: z.string() }),
    inventory: z.object({
      currentStock: z.number(),
      availableStock: z.number(),
      reorderPoint: z.number(),
      safetyStock: z.number(),
    }),
    forecast: z.object({
      avgDailyDemand: z.number(),
      totalPredicted7Day: z.number(),
    }),
    daysUntilStockout: z.number(),
    pendingOrderQty: z.number(),
    urgency: z.string(),
    orderingCostPerPO: z.number(),
    holdingCostPerUnit: z.number(),
  }),
  execute: async ({ inputData }) => {
    console.log('[Procurement] Step 1: Assessing replenishment need...');

    const [product, warehouse, inventory, forecasts, pendingPOs] = await Promise.all([
      getProductById(inputData.productId),
      getWarehouseById(inputData.warehouseId),
      getInventoryByProductWarehouse(inputData.productId, inputData.warehouseId),
      getForecasts({ product: inputData.productId, warehouse: inputData.warehouseId, limit: 1 }),
      getPurchaseOrders({ warehouse: inputData.warehouseId, status: 'sent_to_supplier', limit: 50 }),
    ]);

    if (!product.isActive) throw new Error(`Product ${product.sku} is inactive`);

    // Calculate pending order quantity for this product
    const pendingOrderQty = pendingPOs
      .filter((po: any) =>
        po.lineItems?.some((li: any) =>
          (li.product?.toString() || li.product?._id?.toString()) === inputData.productId
        )
      )
      .reduce((sum: number, po: any) => {
        const item = po.lineItems.find((li: any) =>
          (li.product?.toString() || li.product?._id?.toString()) === inputData.productId
        );
        return sum + (item ? item.orderedQty - item.receivedQty : 0);
      }, 0);

    const latestForecast = forecasts[0];
    const avgDailyDemand = latestForecast
      ? latestForecast.dailyForecasts.reduce((s: number, f: any) => s + f.predictedDemand, 0) / latestForecast.dailyForecasts.length
      : 10;

    const effectiveStock = inventory.availableStock + pendingOrderQty;
    const daysUntilStockout = avgDailyDemand > 0 ? Math.floor(effectiveStock / avgDailyDemand) : 999;

    const urgency = daysUntilStockout <= 3 ? 'critical'
      : daysUntilStockout <= 7 ? 'high'
      : daysUntilStockout <= 14 ? 'medium'
      : 'low';

    const needsReplenishment = inventory.availableStock <= inventory.reorderPoint;

    console.log(`[Procurement] ${product.sku}: stock=${inventory.availableStock}, ROP=${inventory.reorderPoint}, days=${daysUntilStockout}, urgency=${urgency}`);

    return {
      needsReplenishment,
      product: { id: inputData.productId, name: product.name, sku: product.sku },
      warehouse: { id: inputData.warehouseId, name: warehouse.name, code: warehouse.code },
      inventory: {
        currentStock: inventory.currentStock,
        availableStock: inventory.availableStock,
        reorderPoint: inventory.reorderPoint,
        safetyStock: inventory.safetyStock,
      },
      forecast: {
        avgDailyDemand: Math.round(avgDailyDemand),
        totalPredicted7Day: latestForecast?.totalPredicted7Day ?? Math.round(avgDailyDemand * 7),
      },
      daysUntilStockout,
      pendingOrderQty,
      urgency,
      orderingCostPerPO: inputData.orderingCostPerPO,
      holdingCostPerUnit: inputData.holdingCostPerUnit,
    };
  },
});

// ── Step 2: Calculate optimal order and negotiation params ───────────────────
const calculateOrderParamsStep = createStep({
  id: 'calculate-order-params',
  description: 'Uses AI agent to calculate EOQ and determine negotiation parameters',
  inputSchema: z.object({
    needsReplenishment: z.boolean(),
    product: z.object({ id: z.string(), name: z.string(), sku: z.string() }),
    warehouse: z.object({ id: z.string(), name: z.string(), code: z.string() }),
    inventory: z.any(),
    forecast: z.any(),
    daysUntilStockout: z.number(),
    pendingOrderQty: z.number(),
    urgency: z.string(),
    orderingCostPerPO: z.number(),
    holdingCostPerUnit: z.number(),
  }),
  outputSchema: z.object({
    action: z.string(),
    product: z.object({ id: z.string(), name: z.string(), sku: z.string() }),
    warehouse: z.object({ id: z.string(), name: z.string(), code: z.string() }),
    negotiationParams: z.object({
      requiredQty: z.number(),
      maxUnitPrice: z.number(),
      targetUnitPrice: z.number(),
      maxLeadTimeDays: z.number(),
    }).optional(),
    reasoning: z.string(),
    urgency: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData.needsReplenishment) {
      console.log('[Procurement] No replenishment needed');
      return {
        action: 'no_action',
        product: inputData.product,
        warehouse: inputData.warehouse,
        reasoning: `Stock is above reorder point (${inputData.inventory.availableStock} > ${inputData.inventory.reorderPoint}). ${inputData.daysUntilStockout} days until stockout.`,
        urgency: inputData.urgency,
      };
    }

    const agent = mastra?.getAgent('procurementOrchestratorAgent');
    if (!agent) throw new Error('Procurement orchestrator agent not found');

    console.log('[Procurement] Step 2: Calculating order parameters...');

    const prompt = `Analyze the following inventory situation and recommend order parameters:

**Product:** ${inputData.product.name} (${inputData.product.sku})
**Warehouse:** ${inputData.warehouse.name} (${inputData.warehouse.code})

**Current Inventory:**
- Current stock: ${inputData.inventory.currentStock} units
- Available stock: ${inputData.inventory.availableStock} units
- Reorder point: ${inputData.inventory.reorderPoint} units
- Safety stock: ${inputData.inventory.safetyStock} units
- Pending incoming orders: ${inputData.pendingOrderQty} units

**Forecast:**
- Average daily demand: ${inputData.forecast.avgDailyDemand} units/day
- 7-day predicted demand: ${inputData.forecast.totalPredicted7Day} units
- Days until stockout: ${inputData.daysUntilStockout}
- Urgency: ${inputData.urgency}

Use the tools to:
1. Calculate EOQ (annual demand = daily * 365, ordering cost = ${inputData.orderingCostPerPO}, holding cost = ${inputData.holdingCostPerUnit})
2. Get supplier options to determine pricing

Return your recommendation as JSON.`;

    const result = await agent.generate([{ role: 'user', content: prompt }]);

    let data;
    try {
      const text = result.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      data = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      // Fallback: calculate manually
      const annualDemand = inputData.forecast.avgDailyDemand * 365;
      const eoq = Math.ceil(Math.sqrt((2 * annualDemand * inputData.orderingCostPerPO) / inputData.holdingCostPerUnit));
      data = {
        action: 'trigger_negotiation',
        negotiationParams: {
          requiredQty: Math.max(eoq, inputData.forecast.totalPredicted7Day),
          maxUnitPrice: 100,
          targetUnitPrice: 80,
          maxLeadTimeDays: Math.max(inputData.daysUntilStockout - 1, 3),
        },
        reasoning: 'Calculated using fallback EOQ formula',
      };
    }

    return {
      action: data.action || 'trigger_negotiation',
      product: inputData.product,
      warehouse: inputData.warehouse,
      negotiationParams: data.negotiationParams,
      reasoning: data.reasoning || 'Replenishment needed based on inventory analysis',
      urgency: inputData.urgency,
    };
  },
});

// ── Workflow definition ───────────────────────────────────────────────────────
export const procurementWorkflow = createWorkflow({
  id: 'procurement-workflow',
  inputSchema: z.object({
    productId: z.string(),
    warehouseId: z.string(),
    orderingCostPerPO: z.number().default(500),
    holdingCostPerUnit: z.number().default(50),
  }),
  outputSchema: z.object({
    action: z.string(),
    product: z.object({ id: z.string(), name: z.string(), sku: z.string() }),
    warehouse: z.object({ id: z.string(), name: z.string(), code: z.string() }),
    negotiationParams: z.object({
      requiredQty: z.number(),
      maxUnitPrice: z.number(),
      targetUnitPrice: z.number(),
      maxLeadTimeDays: z.number(),
    }).optional(),
    reasoning: z.string(),
    urgency: z.string(),
  }),
})
  .then(assessReplenishmentStep)
  .then(calculateOrderParamsStep);

procurementWorkflow.commit();
