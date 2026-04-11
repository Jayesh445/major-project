import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  getSuppliersByProduct,
  getSupplierById,
  createNegotiation,
  getNegotiationById,
  addNegotiationRound,
  updateNegotiation,
  createPurchaseOrder,
  updateSupplierStats,
} from '../api-client.js';

// Tool: Fetch eligible suppliers for a product
export const fetchEligibleSuppliersTool = createTool({
  id: 'fetch-eligible-suppliers',
  description: 'Fetches all approved suppliers that carry a specific product in their catalog, with pricing and lead time info',
  inputSchema: z.object({
    productId: z.string().describe('MongoDB Product ObjectId'),
  }),
  outputSchema: z.object({
    count: z.number(),
    suppliers: z.array(
      z.object({
        supplierId: z.string(),
        companyName: z.string(),
        contactEmail: z.string(),
        rating: z.number(),
        unitPrice: z.number(),
        leadTimeDays: z.number(),
        moq: z.number(),
        paymentTermsDays: z.number().optional(),
        totalNegotiations: z.number(),
        acceptedOffers: z.number(),
        averageSavingsPercent: z.number(),
      })
    ),
  }),
  execute: async (inputData) => {
    const suppliers = await getSuppliersByProduct(inputData.productId);

    const result = suppliers.map((s) => {
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
        unitPrice: catalogEntry?.unitPrice ?? 0,
        leadTimeDays: catalogEntry?.leadTimeDays ?? 0,
        moq: catalogEntry?.moq ?? 1,
        paymentTermsDays: s.currentContractTerms?.paymentTermsDays,
        totalNegotiations: s.negotiationStats?.totalNegotiations ?? 0,
        acceptedOffers: s.negotiationStats?.acceptedOffers ?? 0,
        averageSavingsPercent: s.negotiationStats?.averageSavingsPercent ?? 0,
      };
    });

    return {
      count: result.length,
      suppliers: result.sort((a, b) => b.rating - a.rating),
    };
  },
});

// Tool: Create a new negotiation session
export const createNegotiationSessionTool = createTool({
  id: 'create-negotiation-session',
  description: 'Creates a new negotiation session in the database for tracking multi-round supplier negotiation',
  inputSchema: z.object({
    supplierId: z.string().describe('Supplier ObjectId'),
    productId: z.string().describe('Product ObjectId'),
    initiatedBy: z.enum(['auto_replenishment', 'procurement_officer']),
    maxUnitPrice: z.number().describe('Maximum price willing to pay (pmax) — hidden from supplier'),
    targetUnitPrice: z.number().describe('Target/ideal price to negotiate towards'),
    maxLeadTimeDays: z.number().describe('Maximum acceptable lead time'),
    requiredQty: z.number().describe('Required order quantity'),
  }),
  outputSchema: z.object({
    negotiationId: z.string(),
  }),
  execute: async (inputData) => {
    const result = await createNegotiation({
      supplier: inputData.supplierId,
      product: inputData.productId,
      initiatedBy: inputData.initiatedBy,
      status: 'in_progress',
      agentConstraints: {
        maxUnitPrice: inputData.maxUnitPrice,
        targetUnitPrice: inputData.targetUnitPrice,
        maxLeadTimeDays: inputData.maxLeadTimeDays,
        requiredQty: inputData.requiredQty,
      },
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return { negotiationId: result._id };
  },
});

// Tool: Submit an offer in the negotiation
export const submitNegotiationOfferTool = createTool({
  id: 'submit-negotiation-offer',
  description: 'Submits an agent offer (or records a supplier counter-offer) as a new round in the negotiation',
  inputSchema: z.object({
    negotiationId: z.string().describe('Negotiation session ObjectId'),
    roundNumber: z.number().describe('Current round number'),
    agentOffer: z.object({
      unitPrice: z.number().optional(),
      leadTimeDays: z.number().optional(),
      paymentTermsDays: z.number().optional(),
      quantity: z.number().optional(),
    }).optional(),
    supplierCounterOffer: z.object({
      unitPrice: z.number().optional(),
      leadTimeDays: z.number().optional(),
      paymentTermsDays: z.number().optional(),
      quantity: z.number().optional(),
    }).optional(),
    agentReasoning: z.string().describe('Explanation of the negotiation strategy for this round'),
    status: z.enum(['pending', 'accepted', 'countered', 'rejected']),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    totalRounds: z.number(),
  }),
  execute: async (inputData) => {
    const session = await addNegotiationRound(inputData.negotiationId, {
      roundNumber: inputData.roundNumber,
      agentOffer: inputData.agentOffer,
      supplierCounterOffer: inputData.supplierCounterOffer,
      agentReasoning: inputData.agentReasoning,
      status: inputData.status,
      timestamp: new Date(),
    });

    return {
      success: true,
      totalRounds: session.rounds?.length ?? inputData.roundNumber,
    };
  },
});

// Tool: Finalize negotiation (accept or reject)
export const finalizeNegotiationTool = createTool({
  id: 'finalize-negotiation',
  description: 'Closes the negotiation session with final status and terms. On acceptance, creates a Purchase Order.',
  inputSchema: z.object({
    negotiationId: z.string(),
    status: z.enum(['accepted', 'rejected', 'escalated', 'timed_out']),
    finalTerms: z.object({
      unitPrice: z.number(),
      leadTimeDays: z.number(),
      paymentTermsDays: z.number(),
      moq: z.number(),
      savingsPercent: z.number(),
    }).optional().describe('Required if status is accepted'),
    supplierId: z.string(),
    productId: z.string(),
    productSku: z.string(),
    warehouseId: z.string(),
    quantity: z.number(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    negotiationStatus: z.string(),
    purchaseOrderId: z.string().optional(),
    poNumber: z.string().optional(),
  }),
  execute: async (inputData) => {
    // Update negotiation session
    await updateNegotiation(inputData.negotiationId, {
      status: inputData.status,
      finalTerms: inputData.finalTerms,
      completedAt: new Date(),
    });

    // If accepted, create a Purchase Order
    if (inputData.status === 'accepted' && inputData.finalTerms) {
      const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
      const totalPrice = inputData.finalTerms.unitPrice * inputData.quantity;

      const po = await createPurchaseOrder({
        poNumber,
        supplier: inputData.supplierId,
        warehouse: inputData.warehouseId,
        lineItems: [
          {
            product: inputData.productId,
            sku: inputData.productSku,
            orderedQty: inputData.quantity,
            receivedQty: 0,
            unitPrice: inputData.finalTerms.unitPrice,
            totalPrice,
          },
        ],
        totalAmount: totalPrice,
        currency: 'INR',
        status: 'pending_approval',
        triggeredBy: 'negotiation_agent',
        triggeredAt: new Date(),
        negotiationSession: inputData.negotiationId,
        expectedDeliveryDate: new Date(
          Date.now() + inputData.finalTerms.leadTimeDays * 24 * 60 * 60 * 1000
        ),
      });

      // Update supplier negotiation stats
      const supplier = await getSupplierById(inputData.supplierId);
      const stats = supplier.negotiationStats || {
        totalNegotiations: 0,
        acceptedOffers: 0,
        averageSavingsPercent: 0,
      };
      const newTotal = stats.totalNegotiations + 1;
      const newAccepted = stats.acceptedOffers + 1;
      const newAvgSavings =
        (stats.averageSavingsPercent * stats.acceptedOffers +
          inputData.finalTerms.savingsPercent) /
        newAccepted;

      await updateSupplierStats(inputData.supplierId, {
        totalNegotiations: newTotal,
        acceptedOffers: newAccepted,
        averageSavingsPercent: Math.round(newAvgSavings * 100) / 100,
      });

      return {
        success: true,
        negotiationStatus: 'accepted',
        purchaseOrderId: po._id,
        poNumber: po.poNumber,
      };
    }

    // If rejected, just update supplier stats
    if (inputData.status === 'rejected') {
      const supplier = await getSupplierById(inputData.supplierId);
      const stats = supplier.negotiationStats || { totalNegotiations: 0, acceptedOffers: 0, averageSavingsPercent: 0 };
      await updateSupplierStats(inputData.supplierId, {
        ...stats,
        totalNegotiations: stats.totalNegotiations + 1,
      });
    }

    return {
      success: true,
      negotiationStatus: inputData.status,
    };
  },
});
