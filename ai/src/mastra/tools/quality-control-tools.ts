import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  getPurchaseOrderById,
  updatePurchaseOrder,
  getBlockchainLogs,
  createBlockchainLog,
} from '../api-client.js';
import { createHash } from 'crypto';

// Tool: Fetch PO details for verification
export const fetchPOForVerificationTool = createTool({
  id: 'fetch-po-for-verification',
  description: 'Fetches a purchase order with full details for goods receipt verification',
  inputSchema: z.object({
    purchaseOrderId: z.string().describe('Purchase Order ObjectId'),
  }),
  outputSchema: z.object({
    poNumber: z.string(),
    supplier: z.object({ id: z.string(), name: z.string() }),
    warehouse: z.object({ id: z.string(), name: z.string() }),
    status: z.string(),
    lineItems: z.array(
      z.object({
        productId: z.string(),
        sku: z.string(),
        orderedQty: z.number(),
        receivedQty: z.number(),
        unitPrice: z.number(),
        totalPrice: z.number(),
        remainingQty: z.number(),
      })
    ),
    totalAmount: z.number(),
    expectedDeliveryDate: z.string().optional(),
    blockchainTxHash: z.string().optional(),
  }),
  execute: async (inputData) => {
    const po = await getPurchaseOrderById(inputData.purchaseOrderId);

    return {
      poNumber: po.poNumber,
      supplier: {
        id: po.supplier?._id?.toString() || po.supplier?.toString(),
        name: po.supplier?.companyName || 'Unknown',
      },
      warehouse: {
        id: po.warehouse?._id?.toString() || po.warehouse?.toString(),
        name: po.warehouse?.name || 'Unknown',
      },
      status: po.status,
      lineItems: po.lineItems.map((li: any) => ({
        productId: li.product?.toString() || li.product?._id?.toString(),
        sku: li.sku,
        orderedQty: li.orderedQty,
        receivedQty: li.receivedQty,
        unitPrice: li.unitPrice,
        totalPrice: li.totalPrice,
        remainingQty: li.orderedQty - li.receivedQty,
      })),
      totalAmount: po.totalAmount,
      expectedDeliveryDate: po.expectedDeliveryDate,
      blockchainTxHash: po.blockchainTxHash,
    };
  },
});

// Tool: Record goods receipt and update PO
export const recordGoodsReceiptTool = createTool({
  id: 'record-goods-receipt',
  description: 'Records received quantities against a PO and updates its status',
  inputSchema: z.object({
    purchaseOrderId: z.string(),
    receivedItems: z.array(
      z.object({
        sku: z.string(),
        receivedQty: z.number(),
        qualityStatus: z.enum(['accepted', 'rejected', 'partial']),
        rejectionReason: z.string().optional(),
      })
    ),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    newStatus: z.string(),
    discrepancies: z.array(
      z.object({
        sku: z.string(),
        orderedQty: z.number(),
        receivedQty: z.number(),
        difference: z.number(),
        type: z.string(),
      })
    ),
  }),
  execute: async (inputData) => {
    const po = await getPurchaseOrderById(inputData.purchaseOrderId);
    const discrepancies: any[] = [];

    // Match received items to line items
    const updatedLineItems = po.lineItems.map((li: any) => {
      const received = inputData.receivedItems.find((r) => r.sku === li.sku);
      const newReceivedQty = li.receivedQty + (received?.receivedQty || 0);

      if (received) {
        const diff = received.receivedQty - (li.orderedQty - li.receivedQty);
        if (diff !== 0) {
          discrepancies.push({
            sku: li.sku,
            orderedQty: li.orderedQty - li.receivedQty,
            receivedQty: received.receivedQty,
            difference: diff,
            type: diff < 0 ? 'short_shipment' : 'over_shipment',
          });
        }
      }

      return { ...li, receivedQty: newReceivedQty };
    });

    // Determine new status
    const allFullyReceived = updatedLineItems.every((li: any) => li.receivedQty >= li.orderedQty);
    const someReceived = updatedLineItems.some((li: any) => li.receivedQty > 0);
    const newStatus = allFullyReceived ? 'fully_received' : someReceived ? 'partially_received' : po.status;

    await updatePurchaseOrder(inputData.purchaseOrderId, {
      lineItems: updatedLineItems,
      status: newStatus,
    });

    return {
      success: true,
      newStatus,
      discrepancies,
    };
  },
});

// Tool: Verify document against blockchain
export const verifyBlockchainHashTool = createTool({
  id: 'verify-blockchain-hash',
  description: 'Generates SHA-256 hash of PO data and verifies against blockchain record',
  inputSchema: z.object({
    purchaseOrderId: z.string(),
    documentData: z.string().describe('Serialized PO data to hash'),
  }),
  outputSchema: z.object({
    computedHash: z.string(),
    blockchainHash: z.string().optional(),
    isVerified: z.boolean(),
    hasBlockchainRecord: z.boolean(),
  }),
  execute: async (inputData) => {
    // Compute hash of the document
    const computedHash = '0x' + createHash('sha256').update(inputData.documentData).digest('hex');

    // Check blockchain logs
    const logs = await getBlockchainLogs({
      referenceId: inputData.purchaseOrderId,
      referenceModel: 'PurchaseOrder',
    });

    const existingLog = logs.find((log: any) => log.eventType === 'po_created');

    return {
      computedHash,
      blockchainHash: existingLog?.txHash,
      isVerified: existingLog ? existingLog.txHash === computedHash : false,
      hasBlockchainRecord: !!existingLog,
    };
  },
});

// Tool: Log event to blockchain
// Delegates to backend blockchain service which handles real on-chain submission.
export const logToBlockchainTool = createTool({
  id: 'log-to-blockchain',
  description: 'Creates an immutable blockchain log entry for a supply chain event (real Ethereum Sepolia)',
  inputSchema: z.object({
    eventType: z.enum([
      'po_created', 'po_approved', 'po_sent', 'po_received',
      'negotiation_accepted', 'negotiation_rejected',
      'inventory_adjustment', 'smart_contract_executed',
    ]),
    referenceModel: z.enum(['PurchaseOrder', 'NegotiationSession', 'Inventory']),
    referenceId: z.string(),
    payload: z.any(),
    amount: z.number().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    txHash: z.string(),
    logId: z.string(),
    confirmationStatus: z.string().optional(),
    etherscanUrl: z.string().optional(),
  }),
  execute: async (inputData) => {
    const result: any = await createBlockchainLog({
      eventType: inputData.eventType,
      referenceModel: inputData.referenceModel,
      referenceId: inputData.referenceId,
      payload: inputData.payload,
      amount: inputData.amount,
    } as any);

    return {
      success: true,
      txHash: result.txHash,
      logId: result._id,
      confirmationStatus: result.confirmationStatus,
      etherscanUrl: result.etherscanUrl,
    };
  },
});
