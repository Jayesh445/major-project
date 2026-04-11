import { Request, Response } from 'express';
import { asyncHandler, sendSuccess, ApiError, HttpStatus } from '@/utils';
import PurchaseOrder from '@/modules/purchase-order/model';
import NegotiationSession from '@/modules/negotiation/model';
import {
  logEventOnChain,
  verifyDocumentHash,
  getLogsByReference,
  getEtherscanUrl,
} from './service';
import { EVENT_TYPE_ENUM } from './constants';

/**
 * POST /api/blockchain/log  (internal, called by Mastra via internal.routes.ts)
 * Body: { eventType, referenceModel, referenceId, payload, amount?, triggeredBy? }
 */
export const createLog = asyncHandler(async (req: Request, res: Response) => {
  const { eventType, referenceModel, referenceId, payload, amount, triggeredBy } = req.body;

  if (!eventType || !(eventType in EVENT_TYPE_ENUM)) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid eventType');
  }
  if (!['PurchaseOrder', 'NegotiationSession', 'Inventory'].includes(referenceModel)) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid referenceModel');
  }
  if (!referenceId || !payload) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'referenceId and payload required');
  }

  const result = await logEventOnChain({
    eventType,
    referenceModel,
    referenceId,
    payload,
    amount,
    triggeredBy,
  });

  return sendSuccess(res, result, 'Blockchain log created');
});

/**
 * GET /api/blockchain/verify/:referenceId
 * Public endpoint used by the QR-scan verification page at the receiving dock.
 * Automatically determines the reference type (PO or Negotiation) and recomputes the hash.
 */
export const verifyByReference = asyncHandler(async (req: Request, res: Response) => {
  const { referenceId } = req.params;
  const eventType = (req.query.eventType as string) || 'po_created';

  if (!(eventType in EVENT_TYPE_ENUM)) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid eventType query param');
  }

  // Load the source document
  let payload: Record<string, unknown> | null = null;
  let documentName = '';
  let amount: number | undefined;

  // Try PurchaseOrder first
  const po: any = await PurchaseOrder.findById(referenceId)
    .populate('supplier', 'companyName contactEmail')
    .populate('warehouse', 'name code')
    .lean();

  if (po) {
    payload = {
      poNumber: po.poNumber,
      supplier: po.supplier?._id?.toString() || po.supplier?.toString(),
      warehouse: po.warehouse?._id?.toString() || po.warehouse?.toString(),
      lineItems: po.lineItems?.map((li: any) => ({
        sku: li.sku,
        orderedQty: li.orderedQty,
        unitPrice: li.unitPrice,
        totalPrice: li.totalPrice,
      })),
      totalAmount: po.totalAmount,
      currency: po.currency,
      triggeredBy: po.triggeredBy,
    };
    documentName = `Purchase Order ${po.poNumber}`;
    amount = po.totalAmount;
  } else {
    // Try NegotiationSession
    const neg: any = await NegotiationSession.findById(referenceId)
      .populate('supplier', 'companyName')
      .populate('product', 'name sku')
      .lean();
    if (neg) {
      payload = {
        supplier: neg.supplier?._id?.toString() || neg.supplier?.toString(),
        product: neg.product?._id?.toString() || neg.product?.toString(),
        finalTerms: neg.finalTerms,
        status: neg.status,
      };
      documentName = `Negotiation with ${neg.supplier?.companyName || 'supplier'}`;
      amount = neg.finalTerms?.unitPrice
        ? neg.finalTerms.unitPrice * (neg.agentConstraints?.requiredQty || 0)
        : undefined;
    }
  }

  if (!payload) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Reference not found in PurchaseOrder or NegotiationSession');
  }

  const result = await verifyDocumentHash({
    referenceId,
    eventType: eventType as keyof typeof EVENT_TYPE_ENUM,
    payload,
  });

  return sendSuccess(res, {
    ...result,
    referenceId,
    eventType,
    documentName,
    amount,
    payload: req.query.includePayload === 'true' ? payload : undefined,
  });
});

/**
 * GET /api/blockchain/logs/:referenceId
 * Returns all blockchain logs for a given reference (PO, Negotiation, etc).
 */
export const getLogsByReferenceHandler = asyncHandler(async (req: Request, res: Response) => {
  const { referenceId } = req.params;
  const logs = await getLogsByReference(referenceId);

  const enriched = logs.map((log: any) => ({
    ...log,
    etherscanUrl: getEtherscanUrl(log.txHash),
  }));

  return sendSuccess(res, enriched);
});

/**
 * GET /api/blockchain/logs
 * Paginated list of all blockchain logs (for admin / audit trail view).
 */
export const getLatestLogs = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 50, eventType, referenceModel, status } = req.query;

  const filter: any = {};
  if (eventType) filter.eventType = eventType;
  if (referenceModel) filter.referenceModel = referenceModel;
  if (status) filter.confirmationStatus = status;

  const BlockchainLog = (await import('./model')).default;
  const logs = await BlockchainLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  const enriched = logs.map((log: any) => ({
    ...log,
    etherscanUrl: getEtherscanUrl(log.txHash),
  }));

  return sendSuccess(res, enriched);
});
