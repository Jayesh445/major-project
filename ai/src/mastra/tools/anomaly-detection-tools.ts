import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  getAllInventory,
  getForecasts,
  getPurchaseOrders,
  getActiveWarehouses,
} from '../api-client.js';

// Tool: Fetch inventory snapshot with anomaly indicators
export const fetchInventorySnapshotTool = createTool({
  id: 'fetch-inventory-snapshot',
  description: 'Fetches current inventory across all warehouses with anomaly indicators (stock vs forecast mismatch, sudden changes)',
  inputSchema: z.object({}),
  outputSchema: z.object({
    totalProducts: z.number(),
    totalWarehouses: z.number(),
    inventoryItems: z.array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        sku: z.string(),
        warehouseId: z.string(),
        warehouseName: z.string(),
        currentStock: z.number(),
        availableStock: z.number(),
        reorderPoint: z.number(),
        safetyStock: z.number(),
        isBelowROP: z.boolean(),
        isBelowSafety: z.boolean(),
        stockToROPRatio: z.number(),
      })
    ),
  }),
  execute: async () => {
    const inventories = await getAllInventory();

    const active = inventories.filter(
      (inv: any) => inv.product?.isActive && inv.warehouse?.isActive
    );

    const warehouseSet = new Set<string>();
    const items = active.map((inv: any) => {
      warehouseSet.add(inv.warehouse._id.toString());
      return {
        productId: inv.product._id.toString(),
        productName: inv.product.name,
        sku: inv.product.sku,
        warehouseId: inv.warehouse._id.toString(),
        warehouseName: inv.warehouse.name,
        currentStock: inv.currentStock,
        availableStock: inv.availableStock,
        reorderPoint: inv.reorderPoint,
        safetyStock: inv.safetyStock,
        isBelowROP: inv.availableStock <= inv.reorderPoint,
        isBelowSafety: inv.availableStock <= inv.safetyStock,
        stockToROPRatio: inv.reorderPoint > 0
          ? Math.round((inv.availableStock / inv.reorderPoint) * 100) / 100
          : 999,
      };
    });

    return {
      totalProducts: new Set(items.map((i: any) => i.productId)).size,
      totalWarehouses: warehouseSet.size,
      inventoryItems: items,
    };
  },
});

// Tool: Fetch recent PO activity for fraud detection
export const fetchRecentPOActivityTool = createTool({
  id: 'fetch-recent-po-activity',
  description: 'Fetches recent purchase orders to detect unusual procurement patterns',
  inputSchema: z.object({
    limit: z.number().default(50),
  }),
  outputSchema: z.object({
    totalOrders: z.number(),
    orders: z.array(
      z.object({
        poNumber: z.string(),
        supplierName: z.string(),
        warehouseName: z.string(),
        totalAmount: z.number(),
        status: z.string(),
        triggeredBy: z.string(),
        createdAt: z.string(),
        itemCount: z.number(),
      })
    ),
    stats: z.object({
      avgOrderAmount: z.number(),
      maxOrderAmount: z.number(),
      autoTriggered: z.number(),
      manualTriggered: z.number(),
      negotiationTriggered: z.number(),
    }),
  }),
  execute: async (inputData) => {
    const orders = await getPurchaseOrders({ limit: inputData.limit });

    let totalAmount = 0;
    let maxAmount = 0;
    let autoCount = 0;
    let manualCount = 0;
    let negotiationCount = 0;

    const enriched = orders.map((po: any) => {
      totalAmount += po.totalAmount || 0;
      if (po.totalAmount > maxAmount) maxAmount = po.totalAmount;
      if (po.triggeredBy === 'auto_replenishment') autoCount++;
      else if (po.triggeredBy === 'manual') manualCount++;
      else if (po.triggeredBy === 'negotiation_agent') negotiationCount++;

      return {
        poNumber: po.poNumber,
        supplierName: po.supplier?.companyName || 'Unknown',
        warehouseName: po.warehouse?.name || 'Unknown',
        totalAmount: po.totalAmount,
        status: po.status,
        triggeredBy: po.triggeredBy,
        createdAt: po.createdAt,
        itemCount: po.lineItems?.length || 0,
      };
    });

    return {
      totalOrders: orders.length,
      orders: enriched,
      stats: {
        avgOrderAmount: orders.length > 0 ? Math.round(totalAmount / orders.length) : 0,
        maxOrderAmount: maxAmount,
        autoTriggered: autoCount,
        manualTriggered: manualCount,
        negotiationTriggered: negotiationCount,
      },
    };
  },
});

// Tool: Fetch warehouse capacity data
export const fetchWarehouseCapacityTool = createTool({
  id: 'fetch-warehouse-capacity',
  description: 'Fetches warehouse capacity utilization for anomaly detection',
  inputSchema: z.object({}),
  outputSchema: z.object({
    warehouses: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        code: z.string(),
        totalCapacity: z.number(),
        usedCapacity: z.number(),
        utilizationPercent: z.number(),
        isOverCapacity: z.boolean(),
        isUnderUtilized: z.boolean(),
      })
    ),
  }),
  execute: async () => {
    const warehouses = await getActiveWarehouses();

    return {
      warehouses: warehouses.map((wh: any) => {
        const utilization = wh.totalCapacity > 0 ? (wh.usedCapacity / wh.totalCapacity) * 100 : 0;
        return {
          id: wh._id.toString(),
          name: wh.name,
          code: wh.code,
          totalCapacity: wh.totalCapacity,
          usedCapacity: wh.usedCapacity,
          utilizationPercent: Math.round(utilization * 10) / 10,
          isOverCapacity: utilization > 95,
          isUnderUtilized: utilization < 20,
        };
      }),
    };
  },
});
