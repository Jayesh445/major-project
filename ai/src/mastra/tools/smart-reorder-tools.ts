import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  getAllInventory,
  getForecasts,
  getPurchaseOrders,
  getActiveWarehouses,
  getSuppliersByProduct,
} from '../api-client.js';

// Tool: Get comprehensive reorder analysis for all products
export const getReorderAnalysisTool = createTool({
  id: 'get-reorder-analysis',
  description: 'Fetches inventory, forecasts, and pending orders for all products to determine which need reordering',
  inputSchema: z.object({}),
  outputSchema: z.object({
    products: z.array(
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
        needsReorder: z.boolean(),
        pendingIncoming: z.number(),
        effectiveStock: z.number(),
        avgDailyDemand: z.number(),
        daysUntilStockout: z.number(),
        supplierCount: z.number(),
        minSupplierPrice: z.number(),
        avgSupplierLeadTime: z.number(),
      })
    ),
    totalNeedingReorder: z.number(),
  }),
  execute: async () => {
    const [inventories, allPOs] = await Promise.all([
      getAllInventory(),
      getPurchaseOrders({ status: 'sent_to_supplier', limit: 100 }),
    ]);

    const active = inventories.filter(
      (inv: any) => inv.product?.isActive && inv.warehouse?.isActive
    );

    const products = await Promise.all(
      active.map(async (inv: any) => {
        const productId = inv.product._id.toString();
        const warehouseId = inv.warehouse._id.toString();

        // Calculate pending incoming
        const pendingIncoming = allPOs
          .filter((po: any) =>
            po.lineItems?.some((li: any) =>
              (li.product?.toString() || li.product?._id?.toString()) === productId
            ) && (po.warehouse?.toString() || po.warehouse?._id?.toString()) === warehouseId
          )
          .reduce((sum: number, po: any) => {
            const item = po.lineItems.find((li: any) =>
              (li.product?.toString() || li.product?._id?.toString()) === productId
            );
            return sum + (item ? item.orderedQty - item.receivedQty : 0);
          }, 0);

        // Get suppliers for this product
        let supplierCount = 0;
        let minSupplierPrice = 0;
        let avgLeadTime = 7;
        try {
          const suppliers = await getSuppliersByProduct(productId);
          supplierCount = suppliers.length;
          const prices = suppliers
            .map((s: any) => {
              const entry = s.catalogProducts.find(
                (cp: any) => (cp.product?._id?.toString() || cp.product?.toString()) === productId
              );
              return entry?.unitPrice ?? 0;
            })
            .filter((p: number) => p > 0);
          const leadTimes = suppliers
            .map((s: any) => {
              const entry = s.catalogProducts.find(
                (cp: any) => (cp.product?._id?.toString() || cp.product?.toString()) === productId
              );
              return entry?.leadTimeDays ?? 0;
            })
            .filter((l: number) => l > 0);

          minSupplierPrice = prices.length > 0 ? Math.min(...prices) : 0;
          avgLeadTime = leadTimes.length > 0 ? leadTimes.reduce((a: number, b: number) => a + b, 0) / leadTimes.length : 7;
        } catch {
          // Supplier fetch may fail for some products
        }

        // Estimate demand from transactions
        const recentTxns = (inv.transactions as any[] || [])
          .filter((t: any) => {
            const age = Date.now() - new Date(t.timestamp).getTime();
            return age < 30 * 24 * 60 * 60 * 1000 && ['sale', 'transfer_out'].includes(t.type);
          });
        const avgDailyDemand = recentTxns.length > 0
          ? Math.round(recentTxns.reduce((s: number, t: any) => s + Math.abs(t.quantity), 0) / 30)
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
          needsReorder: inv.availableStock <= inv.reorderPoint && pendingIncoming === 0,
          pendingIncoming,
          effectiveStock,
          avgDailyDemand,
          daysUntilStockout,
          supplierCount,
          minSupplierPrice,
          avgSupplierLeadTime: Math.round(avgLeadTime),
        };
      })
    );

    return {
      products,
      totalNeedingReorder: products.filter((p: any) => p.needsReorder).length,
    };
  },
});
