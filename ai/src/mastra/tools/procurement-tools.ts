import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  getForecasts,
  getInventoryByProductWarehouse,
  getSuppliersByProduct,
  getPurchaseOrders,
} from '../api-client.js';

// Tool: Check if replenishment is needed (stock vs ROP)
export const checkReplenishmentNeedTool = createTool({
  id: 'check-replenishment-need',
  description: 'Checks current inventory against reorder point and latest forecast to determine if replenishment is needed',
  inputSchema: z.object({
    productId: z.string(),
    warehouseId: z.string(),
  }),
  outputSchema: z.object({
    needsReplenishment: z.boolean(),
    currentStock: z.number(),
    availableStock: z.number(),
    reorderPoint: z.number(),
    safetyStock: z.number(),
    daysUntilStockout: z.number(),
    latestForecast: z.any().optional(),
    pendingOrders: z.number(),
  }),
  execute: async (inputData) => {
    const [inventory, forecasts, pendingPOs] = await Promise.all([
      getInventoryByProductWarehouse(inputData.productId, inputData.warehouseId),
      getForecasts({ product: inputData.productId, warehouse: inputData.warehouseId, limit: 1 }),
      getPurchaseOrders({ warehouse: inputData.warehouseId, status: 'sent_to_supplier', limit: 50 }),
    ]);

    const pendingQty = pendingPOs
      .filter((po: any) =>
        po.lineItems?.some((li: any) =>
          li.product?.toString() === inputData.productId || li.product?._id?.toString() === inputData.productId
        )
      )
      .reduce((sum: number, po: any) => {
        const item = po.lineItems.find((li: any) =>
          li.product?.toString() === inputData.productId || li.product?._id?.toString() === inputData.productId
        );
        return sum + (item ? item.orderedQty - item.receivedQty : 0);
      }, 0);

    const latestForecast = forecasts[0];
    const avgDailyDemand = latestForecast
      ? latestForecast.dailyForecasts.reduce((s: number, f: any) => s + f.predictedDemand, 0) / latestForecast.dailyForecasts.length
      : 10; // fallback

    const effectiveStock = inventory.availableStock + pendingQty;
    const daysUntilStockout = avgDailyDemand > 0 ? Math.floor(effectiveStock / avgDailyDemand) : 999;

    return {
      needsReplenishment: inventory.availableStock <= inventory.reorderPoint,
      currentStock: inventory.currentStock,
      availableStock: inventory.availableStock,
      reorderPoint: inventory.reorderPoint,
      safetyStock: inventory.safetyStock,
      daysUntilStockout,
      latestForecast: latestForecast
        ? {
            totalPredicted7Day: latestForecast.totalPredicted7Day,
            avgDailyDemand: Math.round(avgDailyDemand),
            recommendedReorderQty: latestForecast.recommendedReorderQty,
          }
        : undefined,
      pendingOrders: pendingQty,
    };
  },
});

// Tool: Calculate Economic Order Quantity (EOQ)
export const calculateEOQTool = createTool({
  id: 'calculate-eoq',
  description: 'Calculates Economic Order Quantity, Safety Stock, and Reorder Point using operations research formulas',
  inputSchema: z.object({
    annualDemand: z.number().describe('Estimated annual demand in units'),
    orderingCostPerPO: z.number().describe('Cost to place one purchase order (INR)'),
    holdingCostPerUnit: z.number().describe('Annual holding cost per unit (INR)'),
    avgDailyDemand: z.number().describe('Average daily demand'),
    leadTimeDays: z.number().describe('Supplier lead time in days'),
    leadTimeStdDev: z.number().describe('Standard deviation of lead time in days'),
    serviceLevel: z.number().default(0.95).describe('Desired service level (0.95 = 95%)'),
  }),
  outputSchema: z.object({
    eoq: z.number(),
    safetyStock: z.number(),
    reorderPoint: z.number(),
    annualOrderingCost: z.number(),
    annualHoldingCost: z.number(),
    totalAnnualCost: z.number(),
  }),
  execute: async (inputData) => {
    // Z-score for service level (95% = 1.65, 99% = 2.33)
    const zScore = inputData.serviceLevel >= 0.99 ? 2.33 : inputData.serviceLevel >= 0.95 ? 1.65 : 1.28;

    // EOQ = sqrt(2DS / H)
    const eoq = Math.ceil(
      Math.sqrt(
        (2 * inputData.annualDemand * inputData.orderingCostPerPO) / inputData.holdingCostPerUnit
      )
    );

    // Safety Stock = Z * sigma_LT * D_avg
    const safetyStock = Math.ceil(zScore * inputData.leadTimeStdDev * inputData.avgDailyDemand);

    // ROP = (D_daily * L) + SafetyStock
    const reorderPoint = Math.ceil(inputData.avgDailyDemand * inputData.leadTimeDays + safetyStock);

    const annualOrderingCost = (inputData.annualDemand / eoq) * inputData.orderingCostPerPO;
    const annualHoldingCost = (eoq / 2) * inputData.holdingCostPerUnit;

    return {
      eoq,
      safetyStock,
      reorderPoint,
      annualOrderingCost: Math.round(annualOrderingCost),
      annualHoldingCost: Math.round(annualHoldingCost),
      totalAnnualCost: Math.round(annualOrderingCost + annualHoldingCost),
    };
  },
});

// Tool: Get supplier options for a product
export const getSupplierOptionsTool = createTool({
  id: 'get-supplier-options',
  description: 'Gets available suppliers for a product with pricing, used to determine max/target prices for negotiation',
  inputSchema: z.object({
    productId: z.string(),
  }),
  outputSchema: z.object({
    count: z.number(),
    avgPrice: z.number(),
    minPrice: z.number(),
    maxPrice: z.number(),
    suppliers: z.array(
      z.object({
        supplierId: z.string(),
        companyName: z.string(),
        unitPrice: z.number(),
        leadTimeDays: z.number(),
        rating: z.number(),
      })
    ),
  }),
  execute: async (inputData) => {
    const suppliers = await getSuppliersByProduct(inputData.productId);

    const options = suppliers.map((s: any) => {
      const entry = s.catalogProducts.find(
        (cp: any) =>
          cp.product?._id?.toString() === inputData.productId ||
          cp.product?.toString() === inputData.productId
      );
      return {
        supplierId: s._id.toString(),
        companyName: s.companyName,
        unitPrice: entry?.unitPrice ?? 0,
        leadTimeDays: entry?.leadTimeDays ?? 0,
        rating: s.rating,
      };
    });

    const prices = options.map((o: any) => o.unitPrice).filter((p: number) => p > 0);

    return {
      count: options.length,
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      suppliers: options,
    };
  },
});
