import { Request, Response } from 'express';
import { asyncHandler, sendSuccess, ApiError, HttpStatus } from '@/utils';
import NegotiationSession from './model';
import PurchaseOrder from '@/modules/purchase-order/model';
import { logEventOnChain } from '@/modules/blockchain/service';
import mongoose from 'mongoose';

/**
 * Create a new negotiation session
 */
export const createNegotiation = asyncHandler(async (req: Request, res: Response) => {
  const {
    supplier,
    product,
    initiatedBy,
    initiatedByUser,
    agentConstraints,
    status = 'in_progress',
  } = req.body;

  const session = new NegotiationSession({
    supplier,
    product,
    initiatedBy,
    initiatedByUser,
    agentConstraints,
    status,
    rounds: [],
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await session.save();

  const populated = await session.populate([
    { path: 'supplier', select: 'companyName contactEmail' },
    { path: 'product', select: 'name sku' },
  ]);

  return sendSuccess(res, populated, 'Negotiation session created', 201);
});

/**
 * Get a specific negotiation session
 */
export const getNegotiation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const session = await NegotiationSession.findById(id)
    .populate('supplier', 'companyName contactEmail rating')
    .populate('product', 'name sku')
    .populate('initiatedByUser', 'name email')
    .lean();

  if (!session) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Negotiation session not found');
  }

  return sendSuccess(res, session);
});

/**
 * Add a round to a negotiation session
 */
export const addNegotiationRound = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { roundNumber, agentOffer, supplierCounterOffer, agentReasoning, status } = req.body;

  // Validate round number
  if (!roundNumber || roundNumber < 1) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Valid round number is required');
  }

  const session = await NegotiationSession.findById(id);
  if (!session) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Negotiation session not found');
  }

  // Check if round already exists
  const roundExists = session.rounds.some((r: any) => r.roundNumber === roundNumber);
  if (roundExists) {
    throw new ApiError(HttpStatus.BAD_REQUEST, `Round ${roundNumber} already exists`);
  }

  // Add the new round
  session.rounds.push({
    roundNumber,
    agentOffer: agentOffer || undefined,
    supplierCounterOffer: supplierCounterOffer || undefined,
    agentReasoning: agentReasoning || '',
    status: status || 'pending',
    timestamp: new Date(),
  });

  await session.save();

  const updated = await NegotiationSession.findById(id)
    .populate('supplier', 'companyName')
    .populate('product', 'name sku');

  console.log(`[Negotiation] Round ${roundNumber} added to session ${id}`);

  return sendSuccess(res, updated, `Round ${roundNumber} added successfully`);
});

/**
 * Update negotiation status (accept/reject/close)
 */
export const updateNegotiation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, finalTerms, completedAt } = req.body;

  const session = await NegotiationSession.findById(id);
  if (!session) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Negotiation session not found');
  }

  // Update fields
  if (status) session.status = status;
  if (finalTerms) session.finalTerms = finalTerms;
  if (completedAt) session.completedAt = completedAt;

  await session.save();

  const updated = await NegotiationSession.findById(id)
    .populate('supplier', 'companyName')
    .populate('product', 'name sku');

  console.log(`[Negotiation] Session ${id} status updated to ${status}`);

  return sendSuccess(res, updated, 'Negotiation updated successfully');
});

/**
 * Submit a negotiation offer and get supplier response
 */
export const submitNegotiationOffer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { roundNumber, offerData } = req.body;

  const session = await NegotiationSession.findById(id);
  if (!session) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Negotiation session not found');
  }

  // Find or create the round
  let round: any = session.rounds.find((r: any) => r.roundNumber === roundNumber);
  if (!round) {
    round = {
      roundNumber,
      agentOffer: offerData,
      status: 'pending',
      timestamp: new Date(),
    };
    session.rounds.push(round);
  } else {
    round.agentOffer = offerData;
  }

  await session.save();

  return sendSuccess(res, { round }, 'Offer submitted, waiting for supplier response');
});

/**
 * Finalize negotiation with agreed terms and create PO
 */
export const finalizeNegotiation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { finalTerms, poData } = req.body;

  const session = await NegotiationSession.findById(id)
    .populate('supplier')
    .populate('product')
    .populate('warehouse')
    .lean();

  if (!session) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Negotiation session not found');
  }

  // Update negotiation with final terms
  await NegotiationSession.findByIdAndUpdate(id, {
    status: 'accepted',
    finalTerms,
    completedAt: new Date(),
  });

  // Create the Purchase Order
  let poId: string | null = null;
  if (poData) {
    try {
      const po = new PurchaseOrder({
        ...poData,
        status: 'draft',
        negotiationSession: id,
        blockchainTxHash: null,
      });
      await po.save();
      poId = po._id.toString();

      // Log blockchain event for PO creation
      try {
        const payload = {
          poNumber: po.poNumber,
          supplier: session.supplier._id.toString(),
          warehouse: poData.warehouse,
          lineItems: poData.lineItems,
          totalAmount: poData.totalAmount,
          currency: poData.currency,
          negotiatedPrice: finalTerms.unitPrice,
        };

        await logEventOnChain({
          eventType: 'po_created',
          referenceModel: 'PurchaseOrder',
          referenceId: po._id.toString(),
          payload,
          amount: poData.totalAmount,
          triggeredBy: undefined,
        });

        console.log(`[Blockchain] po_created logged for negotiation-driven PO ${po.poNumber}`);
      } catch (err) {
        console.error('[Blockchain] Failed to log blockchain event:', err);
        // Don't throw - PO was created successfully
      }

      console.log(`[Negotiation] PO ${po.poNumber} created from negotiation ${id}`);
    } catch (err: any) {
      console.error('[Negotiation] Failed to create PO:', err);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, `Failed to create PO: ${err.message}`);
    }
  }

  const updated = await NegotiationSession.findById(id)
    .populate('supplier', 'companyName')
    .populate('product', 'name sku');

  return sendSuccess(
    res,
    {
      negotiation: updated,
      purchaseOrderId: poId,
    },
    'Negotiation finalized and PO created'
  );
});

/**
 * Get all negotiation sessions (with filters)
 */
export const listNegotiations = asyncHandler(async (req: Request, res: Response) => {
  const { status, limit = 50, skip = 0 } = req.query;

  const filter: any = {};
  if (status) filter.status = status;

  const sessions = await NegotiationSession.find(filter)
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .populate('supplier', 'companyName contactEmail')
    .populate('product', 'name sku')
    .populate('initiatedByUser', 'name email')
    .lean();

  const total = await NegotiationSession.countDocuments(filter);

  return sendSuccess(res, {
    data: sessions,
    pagination: {
      total,
      limit: Number(limit),
      skip: Number(skip),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Delete a negotiation session
 */
export const deleteNegotiation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const session = await NegotiationSession.findByIdAndDelete(id);
  if (!session) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Negotiation session not found');
  }

  return sendSuccess(res, { _id: id }, 'Negotiation session deleted');
});
