"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNegotiation = exports.listNegotiations = exports.finalizeNegotiation = exports.submitNegotiationOffer = exports.updateNegotiation = exports.addNegotiationRound = exports.getNegotiation = exports.createNegotiation = void 0;
const utils_1 = require("@/utils");
const model_1 = __importDefault(require("./model"));
const model_2 = __importDefault(require("@/modules/purchase-order/model"));
const service_1 = require("@/modules/blockchain/service");
/**
 * Create a new negotiation session
 */
exports.createNegotiation = (0, utils_1.asyncHandler)(async (req, res) => {
    const { supplier, product, initiatedBy, initiatedByUser, agentConstraints, status = 'in_progress', } = req.body;
    const session = new model_1.default({
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
    return (0, utils_1.sendSuccess)(res, populated, 'Negotiation session created', 201);
});
/**
 * Get a specific negotiation session
 */
exports.getNegotiation = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const session = await model_1.default.findById(id)
        .populate('supplier', 'companyName contactEmail rating')
        .populate('product', 'name sku')
        .populate('initiatedByUser', 'name email')
        .lean();
    if (!session) {
        throw new utils_1.ApiError(utils_1.HttpStatus.NOT_FOUND, 'Negotiation session not found');
    }
    return (0, utils_1.sendSuccess)(res, session);
});
/**
 * Add a round to a negotiation session
 */
exports.addNegotiationRound = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { roundNumber, agentOffer, supplierCounterOffer, agentReasoning, status } = req.body;
    // Validate round number
    if (!roundNumber || roundNumber < 1) {
        throw new utils_1.ApiError(utils_1.HttpStatus.BAD_REQUEST, 'Valid round number is required');
    }
    const session = await model_1.default.findById(id);
    if (!session) {
        throw new utils_1.ApiError(utils_1.HttpStatus.NOT_FOUND, 'Negotiation session not found');
    }
    // Check if round already exists
    const roundExists = session.rounds.some((r) => r.roundNumber === roundNumber);
    if (roundExists) {
        throw new utils_1.ApiError(utils_1.HttpStatus.BAD_REQUEST, `Round ${roundNumber} already exists`);
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
    const updated = await model_1.default.findById(id)
        .populate('supplier', 'companyName')
        .populate('product', 'name sku');
    console.log(`[Negotiation] Round ${roundNumber} added to session ${id}`);
    return (0, utils_1.sendSuccess)(res, updated, `Round ${roundNumber} added successfully`);
});
/**
 * Update negotiation status (accept/reject/close)
 */
exports.updateNegotiation = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status, finalTerms, completedAt } = req.body;
    const session = await model_1.default.findById(id);
    if (!session) {
        throw new utils_1.ApiError(utils_1.HttpStatus.NOT_FOUND, 'Negotiation session not found');
    }
    // Update fields
    if (status)
        session.status = status;
    if (finalTerms)
        session.finalTerms = finalTerms;
    if (completedAt)
        session.completedAt = completedAt;
    await session.save();
    const updated = await model_1.default.findById(id)
        .populate('supplier', 'companyName')
        .populate('product', 'name sku');
    console.log(`[Negotiation] Session ${id} status updated to ${status}`);
    return (0, utils_1.sendSuccess)(res, updated, 'Negotiation updated successfully');
});
/**
 * Submit a negotiation offer and get supplier response
 */
exports.submitNegotiationOffer = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { roundNumber, offerData } = req.body;
    const session = await model_1.default.findById(id);
    if (!session) {
        throw new utils_1.ApiError(utils_1.HttpStatus.NOT_FOUND, 'Negotiation session not found');
    }
    // Find or create the round
    let round = session.rounds.find((r) => r.roundNumber === roundNumber);
    if (!round) {
        round = {
            roundNumber,
            agentOffer: offerData,
            status: 'pending',
            timestamp: new Date(),
        };
        session.rounds.push(round);
    }
    else {
        round.agentOffer = offerData;
    }
    await session.save();
    return (0, utils_1.sendSuccess)(res, { round }, 'Offer submitted, waiting for supplier response');
});
/**
 * Finalize negotiation with agreed terms and create PO
 */
exports.finalizeNegotiation = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { finalTerms, poData } = req.body;
    const session = await model_1.default.findById(id)
        .populate('supplier')
        .populate('product')
        .populate('warehouse')
        .lean();
    if (!session) {
        throw new utils_1.ApiError(utils_1.HttpStatus.NOT_FOUND, 'Negotiation session not found');
    }
    // Update negotiation with final terms
    await model_1.default.findByIdAndUpdate(id, {
        status: 'accepted',
        finalTerms,
        completedAt: new Date(),
    });
    // Create the Purchase Order
    let poId = null;
    if (poData) {
        try {
            const po = new model_2.default({
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
                await (0, service_1.logEventOnChain)({
                    eventType: 'po_created',
                    referenceModel: 'PurchaseOrder',
                    referenceId: po._id.toString(),
                    payload,
                    amount: poData.totalAmount,
                    triggeredBy: undefined,
                });
                console.log(`[Blockchain] po_created logged for negotiation-driven PO ${po.poNumber}`);
            }
            catch (err) {
                console.error('[Blockchain] Failed to log blockchain event:', err);
                // Don't throw - PO was created successfully
            }
            console.log(`[Negotiation] PO ${po.poNumber} created from negotiation ${id}`);
        }
        catch (err) {
            console.error('[Negotiation] Failed to create PO:', err);
            throw new utils_1.ApiError(utils_1.HttpStatus.INTERNAL_SERVER_ERROR, `Failed to create PO: ${err.message}`);
        }
    }
    const updated = await model_1.default.findById(id)
        .populate('supplier', 'companyName')
        .populate('product', 'name sku');
    return (0, utils_1.sendSuccess)(res, {
        negotiation: updated,
        purchaseOrderId: poId,
    }, 'Negotiation finalized and PO created');
});
/**
 * Get all negotiation sessions (with filters)
 */
exports.listNegotiations = (0, utils_1.asyncHandler)(async (req, res) => {
    const { status, limit = 50, skip = 0 } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    const sessions = await model_1.default.find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .populate('supplier', 'companyName contactEmail')
        .populate('product', 'name sku')
        .populate('initiatedByUser', 'name email')
        .lean();
    const total = await model_1.default.countDocuments(filter);
    return (0, utils_1.sendSuccess)(res, {
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
exports.deleteNegotiation = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const session = await model_1.default.findByIdAndDelete(id);
    if (!session) {
        throw new utils_1.ApiError(utils_1.HttpStatus.NOT_FOUND, 'Negotiation session not found');
    }
    return (0, utils_1.sendSuccess)(res, { _id: id }, 'Negotiation session deleted');
});
