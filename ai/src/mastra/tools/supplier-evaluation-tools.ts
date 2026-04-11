import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  getApprovedSuppliers,
  getSupplierById,
  getPurchaseOrders,
  updateSupplierStats,
} from '../api-client.js';

// Tool: Fetch all suppliers with their performance data
export const fetchAllSuppliersTool = createTool({
  id: 'fetch-all-suppliers',
  description: 'Fetches all approved suppliers with catalog, contract terms, and negotiation history',
  inputSchema: z.object({}),
  outputSchema: z.object({
    count: z.number(),
    suppliers: z.array(
      z.object({
        supplierId: z.string(),
        companyName: z.string(),
        contactEmail: z.string(),
        rating: z.number(),
        isApproved: z.boolean(),
        catalogProductCount: z.number(),
        paymentTermsDays: z.number().optional(),
        totalNegotiations: z.number(),
        acceptedOffers: z.number(),
        averageSavingsPercent: z.number(),
        acceptanceRate: z.number(),
      })
    ),
  }),
  execute: async () => {
    const suppliers = await getApprovedSuppliers();

    return {
      count: suppliers.length,
      suppliers: suppliers.map((s: any) => {
        const stats = s.negotiationStats || { totalNegotiations: 0, acceptedOffers: 0, averageSavingsPercent: 0 };
        return {
          supplierId: s._id.toString(),
          companyName: s.companyName,
          contactEmail: s.contactEmail,
          rating: s.rating,
          isApproved: s.isApproved,
          catalogProductCount: s.catalogProducts?.length ?? 0,
          paymentTermsDays: s.currentContractTerms?.paymentTermsDays,
          totalNegotiations: stats.totalNegotiations,
          acceptedOffers: stats.acceptedOffers,
          averageSavingsPercent: stats.averageSavingsPercent,
          acceptanceRate: stats.totalNegotiations > 0
            ? Math.round((stats.acceptedOffers / stats.totalNegotiations) * 100)
            : 0,
        };
      }),
    };
  },
});

// Tool: Fetch purchase order history for a supplier
export const fetchSupplierPOHistoryTool = createTool({
  id: 'fetch-supplier-po-history',
  description: 'Fetches purchase order history for a specific supplier to analyze delivery performance',
  inputSchema: z.object({
    supplierId: z.string(),
    limit: z.number().default(20),
  }),
  outputSchema: z.object({
    totalOrders: z.number(),
    completedOrders: z.number(),
    onTimeDeliveries: z.number(),
    lateDeliveries: z.number(),
    cancelledOrders: z.number(),
    averageOrderAmount: z.number(),
    totalSpend: z.number(),
    orders: z.array(
      z.object({
        poNumber: z.string(),
        status: z.string(),
        totalAmount: z.number(),
        createdAt: z.string(),
        expectedDeliveryDate: z.string().optional(),
        wasOnTime: z.boolean().optional(),
      })
    ),
  }),
  execute: async (inputData) => {
    const orders = await getPurchaseOrders({ supplier: inputData.supplierId, limit: inputData.limit });

    let onTime = 0;
    let late = 0;
    let completed = 0;
    let cancelled = 0;
    let totalSpend = 0;

    const enrichedOrders = orders.map((po: any) => {
      const isCompleted = ['fully_received', 'partially_received'].includes(po.status);
      const isCancelled = po.status === 'cancelled';
      if (isCompleted) completed++;
      if (isCancelled) cancelled++;
      totalSpend += po.totalAmount || 0;

      // Simple on-time check: if received before expected delivery
      let wasOnTime: boolean | undefined;
      if (isCompleted && po.expectedDeliveryDate) {
        wasOnTime = new Date(po.updatedAt) <= new Date(po.expectedDeliveryDate);
        if (wasOnTime) onTime++;
        else late++;
      }

      return {
        poNumber: po.poNumber,
        status: po.status,
        totalAmount: po.totalAmount,
        createdAt: po.createdAt,
        expectedDeliveryDate: po.expectedDeliveryDate,
        wasOnTime,
      };
    });

    return {
      totalOrders: orders.length,
      completedOrders: completed,
      onTimeDeliveries: onTime,
      lateDeliveries: late,
      cancelledOrders: cancelled,
      averageOrderAmount: orders.length > 0 ? Math.round(totalSpend / orders.length) : 0,
      totalSpend: Math.round(totalSpend),
      orders: enrichedOrders,
    };
  },
});

// Tool: Update supplier rating
export const updateSupplierRatingTool = createTool({
  id: 'update-supplier-rating',
  description: 'Updates a supplier rating and negotiation stats based on evaluation',
  inputSchema: z.object({
    supplierId: z.string(),
    newStats: z.object({
      totalNegotiations: z.number(),
      acceptedOffers: z.number(),
      averageSavingsPercent: z.number(),
    }),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async (inputData) => {
    await updateSupplierStats(inputData.supplierId, inputData.newStats);
    return { success: true };
  },
});
