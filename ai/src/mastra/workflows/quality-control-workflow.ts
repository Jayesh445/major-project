import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  getPurchaseOrderById,
  updatePurchaseOrder,
  createBlockchainLog,
} from '../api-client.js';

// ── Step 1: Fetch and validate PO ────────────────────────────────────────────
const fetchAndValidatePOStep = createStep({
  id: 'fetch-and-validate-po',
  description: 'Fetches the purchase order and validates it is in a receivable state',
  inputSchema: z.object({
    purchaseOrderId: z.string(),
    receivedItems: z.array(
      z.object({
        sku: z.string(),
        receivedQty: z.number(),
        qualityStatus: z.enum(['accepted', 'rejected', 'partial']).default('accepted'),
        rejectionReason: z.string().optional(),
      })
    ),
  }),
  outputSchema: z.object({
    po: z.any(),
    receivedItems: z.array(z.any()),
    purchaseOrderId: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log('[QualityControl] Step 1: Fetching PO...');

    const po = await getPurchaseOrderById(inputData.purchaseOrderId);

    const receivableStatuses = ['sent_to_supplier', 'acknowledged', 'partially_received'];
    if (!receivableStatuses.includes(po.status)) {
      throw new Error(`PO ${po.poNumber} is in status "${po.status}" and cannot receive goods`);
    }

    console.log(`[QualityControl] PO ${po.poNumber}: ${po.lineItems.length} line items, status=${po.status}`);

    return {
      po,
      receivedItems: inputData.receivedItems,
      purchaseOrderId: inputData.purchaseOrderId,
    };
  },
});

// ── Step 2: Verify and record receipt via AI agent ───────────────────────────
const verifyAndRecordStep = createStep({
  id: 'verify-and-record-receipt',
  description: 'Uses AI agent to verify goods, detect discrepancies, and record receipt',
  inputSchema: z.object({
    po: z.any(),
    receivedItems: z.array(z.any()),
    purchaseOrderId: z.string(),
  }),
  outputSchema: z.object({
    verificationStatus: z.string(),
    discrepancies: z.array(z.any()),
    newPOStatus: z.string(),
    overallAccuracy: z.number(),
    blockchainTxHash: z.string(),
    onTimeDelivery: z.boolean(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('qualityControlAgent');
    if (!agent) throw new Error('Quality control agent not found');

    console.log('[QualityControl] Step 2: Verifying goods receipt...');

    const po = inputData.po;
    const discrepancies: any[] = [];
    let totalOrdered = 0;
    let totalReceivedCorrect = 0;

    // Match and verify items
    const updatedLineItems = po.lineItems.map((li: any) => {
      const received = inputData.receivedItems.find((r: any) => r.sku === li.sku);
      const expectedRemaining = li.orderedQty - li.receivedQty;
      totalOrdered += expectedRemaining;

      if (!received) {
        discrepancies.push({
          sku: li.sku,
          orderedQty: expectedRemaining,
          receivedQty: 0,
          difference: -expectedRemaining,
          type: 'not_delivered',
        });
        return li;
      }

      const newReceivedQty = li.receivedQty + received.receivedQty;
      const diff = received.receivedQty - expectedRemaining;

      if (received.qualityStatus === 'rejected') {
        discrepancies.push({
          sku: li.sku,
          orderedQty: expectedRemaining,
          receivedQty: received.receivedQty,
          difference: 0,
          type: 'quality_rejected',
          reason: received.rejectionReason || 'Quality standards not met',
        });
      } else if (diff < 0) {
        totalReceivedCorrect += received.receivedQty;
        discrepancies.push({
          sku: li.sku,
          orderedQty: expectedRemaining,
          receivedQty: received.receivedQty,
          difference: diff,
          type: 'short_shipment',
        });
      } else if (diff > expectedRemaining * 0.05) {
        totalReceivedCorrect += expectedRemaining;
        discrepancies.push({
          sku: li.sku,
          orderedQty: expectedRemaining,
          receivedQty: received.receivedQty,
          difference: diff,
          type: 'over_shipment',
        });
      } else {
        totalReceivedCorrect += received.receivedQty;
      }

      return {
        ...li,
        receivedQty: received.qualityStatus === 'rejected' ? li.receivedQty : newReceivedQty,
      };
    });

    // Determine new PO status
    const allFullyReceived = updatedLineItems.every((li: any) => li.receivedQty >= li.orderedQty);
    const someReceived = updatedLineItems.some((li: any) => li.receivedQty > 0);
    const newPOStatus = allFullyReceived ? 'fully_received' : someReceived ? 'partially_received' : po.status;

    // Update PO
    await updatePurchaseOrder(inputData.purchaseOrderId, {
      lineItems: updatedLineItems,
      status: newPOStatus,
    });

    // Check on-time delivery
    const onTimeDelivery = po.expectedDeliveryDate
      ? new Date() <= new Date(po.expectedDeliveryDate)
      : true;

    const overallAccuracy = totalOrdered > 0 ? Math.round((totalReceivedCorrect / totalOrdered) * 100) : 100;
    const verificationStatus = discrepancies.length === 0 ? 'passed' : overallAccuracy >= 90 ? 'partial' : 'failed';

    // Log to blockchain — backend service handles hashing + on-chain submission + DB persistence
    const payload = {
      poNumber: po.poNumber,
      supplierId: po.supplier?._id?.toString() || po.supplier?.toString(),
      receivedAt: new Date().toISOString(),
      itemsReceived: inputData.receivedItems,
      discrepancies,
      overallAccuracy,
      onTimeDelivery,
    };

    const blockchainResult: any = await createBlockchainLog({
      eventType: 'po_received',
      referenceModel: 'PurchaseOrder',
      referenceId: inputData.purchaseOrderId,
      payload,
      amount: po.totalAmount,
    } as any);

    const txHash = blockchainResult?.txHash;

    // Update PO with blockchain hash
    if (txHash) {
      await updatePurchaseOrder(inputData.purchaseOrderId, {
        blockchainTxHash: txHash,
        blockchainLoggedAt: new Date(),
      });
    }

    console.log(`[QualityControl] Verification: ${verificationStatus}, accuracy=${overallAccuracy}%, discrepancies=${discrepancies.length}, txHash=${txHash?.slice(0, 18)}... status=${blockchainResult?.confirmationStatus}`);

    return {
      verificationStatus,
      discrepancies,
      newPOStatus,
      overallAccuracy,
      blockchainTxHash: txHash,
      onTimeDelivery,
    };
  },
});

// ── Workflow ──────────────────────────────────────────────────────────────────
export const qualityControlWorkflow = createWorkflow({
  id: 'quality-control-workflow',
  inputSchema: z.object({
    purchaseOrderId: z.string(),
    receivedItems: z.array(
      z.object({
        sku: z.string(),
        receivedQty: z.number(),
        qualityStatus: z.enum(['accepted', 'rejected', 'partial']).default('accepted'),
        rejectionReason: z.string().optional(),
      })
    ),
  }),
  outputSchema: z.object({
    verificationStatus: z.string(),
    discrepancies: z.array(z.any()),
    newPOStatus: z.string(),
    overallAccuracy: z.number(),
    blockchainTxHash: z.string(),
    onTimeDelivery: z.boolean(),
  }),
})
  .then(fetchAndValidatePOStep)
  .then(verifyAndRecordStep);

qualityControlWorkflow.commit();
