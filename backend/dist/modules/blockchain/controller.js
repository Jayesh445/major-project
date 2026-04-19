"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.getLatestLogs = exports.getLogsByReferenceHandler = exports.verifyByReference = exports.createLog = void 0;
const utils_1 = require("@/utils");
const model_1 = __importDefault(require("@/modules/purchase-order/model"));
const model_2 = __importDefault(require("@/modules/negotiation/model"));
const service_1 = require("./service");
const constants_1 = require("./constants");
const webhook_service_1 = require("./webhook.service");
/**
 * POST /api/blockchain/log  (internal, called by Mastra via internal.routes.ts)
 * Body: { eventType, referenceModel, referenceId, payload, amount?, triggeredBy? }
 */
exports.createLog = (0, utils_1.asyncHandler)(async (req, res) => {
    const { eventType, referenceModel, referenceId, payload, amount, triggeredBy } = req.body;
    if (!eventType || !(eventType in constants_1.EVENT_TYPE_ENUM)) {
        throw new utils_1.ApiError(utils_1.HttpStatus.BAD_REQUEST, 'Invalid eventType');
    }
    if (!['PurchaseOrder', 'NegotiationSession', 'Inventory'].includes(referenceModel)) {
        throw new utils_1.ApiError(utils_1.HttpStatus.BAD_REQUEST, 'Invalid referenceModel');
    }
    if (!referenceId || !payload) {
        throw new utils_1.ApiError(utils_1.HttpStatus.BAD_REQUEST, 'referenceId and payload required');
    }
    const result = await (0, service_1.logEventOnChain)({
        eventType,
        referenceModel,
        referenceId,
        payload,
        amount,
        triggeredBy,
    });
    return (0, utils_1.sendSuccess)(res, result, 'Blockchain log created');
});
/**
 * GET /api/blockchain/verify/:referenceId
 * Public endpoint used by the QR-scan verification page at the receiving dock.
 * Automatically determines the reference type (PO or Negotiation) and recomputes the hash.
 */
exports.verifyByReference = (0, utils_1.asyncHandler)(async (req, res) => {
    const { referenceId } = req.params;
    const eventType = req.query.eventType || 'po_created';
    if (!(eventType in constants_1.EVENT_TYPE_ENUM)) {
        throw new utils_1.ApiError(utils_1.HttpStatus.BAD_REQUEST, 'Invalid eventType query param');
    }
    // Load the source document
    let payload = null;
    let documentName = '';
    let amount;
    // Try PurchaseOrder first
    const po = await model_1.default.findById(referenceId)
        .populate('supplier', 'companyName contactEmail')
        .populate('warehouse', 'name code')
        .lean();
    if (po) {
        payload = {
            poNumber: po.poNumber,
            supplier: po.supplier?._id?.toString() || po.supplier?.toString(),
            warehouse: po.warehouse?._id?.toString() || po.warehouse?.toString(),
            lineItems: po.lineItems?.map((li) => ({
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
    }
    else {
        // Try NegotiationSession
        const neg = await model_2.default.findById(referenceId)
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
        throw new utils_1.ApiError(utils_1.HttpStatus.NOT_FOUND, 'Reference not found in PurchaseOrder or NegotiationSession');
    }
    const result = await (0, service_1.verifyDocumentHash)({
        referenceId,
        eventType: eventType,
        payload,
    });
    return (0, utils_1.sendSuccess)(res, {
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
exports.getLogsByReferenceHandler = (0, utils_1.asyncHandler)(async (req, res) => {
    const { referenceId } = req.params;
    const logs = await (0, service_1.getLogsByReference)(referenceId);
    const enriched = logs.map((log) => ({
        ...log,
        etherscanUrl: (0, service_1.getEtherscanUrl)(log.txHash),
    }));
    return (0, utils_1.sendSuccess)(res, enriched);
});
/**
 * GET /api/blockchain/logs
 * Paginated list of all blockchain logs (for admin / audit trail view).
 */
exports.getLatestLogs = (0, utils_1.asyncHandler)(async (req, res) => {
    const { limit = 50, eventType, referenceModel, status } = req.query;
    const filter = {};
    if (eventType)
        filter.eventType = eventType;
    if (referenceModel)
        filter.referenceModel = referenceModel;
    if (status)
        filter.confirmationStatus = status;
    const BlockchainLog = (await Promise.resolve().then(() => __importStar(require('./model')))).default;
    const logs = await BlockchainLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean();
    const enriched = logs.map((log) => ({
        ...log,
        etherscanUrl: (0, service_1.getEtherscanUrl)(log.txHash),
    }));
    return (0, utils_1.sendSuccess)(res, enriched);
});
/**
 * POST /api/blockchain/webhook
 * Alchemy webhook endpoint — receives real-time transaction confirmations.
 * This is a public endpoint that Alchemy calls directly (no auth required).
 */
exports.handleWebhook = (0, utils_1.asyncHandler)(async (req, res) => {
    // Verify webhook signature
    const signatureHeader = req.headers['x-alchemy-signature'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const body = req.rawBody || JSON.stringify(req.body); // rawBody is set by body parser middleware
    const signingKey = (0, webhook_service_1.getWebhookSigningKey)();
    if (!(0, webhook_service_1.verifyAlchemySignature)(body, signature, signingKey)) {
        throw new utils_1.ApiError(utils_1.HttpStatus.UNAUTHORIZED, 'Invalid webhook signature');
    }
    const webhookEvent = req.body;
    // Validate webhook structure
    if (!webhookEvent.block || !Array.isArray(webhookEvent.block.logs)) {
        console.warn('[Webhook] Invalid webhook event structure:', webhookEvent);
        // Still return 200 to prevent Alchemy retry
        return (0, utils_1.sendSuccess)(res, { received: true, error: 'Invalid structure' });
    }
    // Process the webhook (update BlockchainLog status)
    try {
        await (0, webhook_service_1.handleAlchemyWebhook)(webhookEvent);
    }
    catch (err) {
        console.error('[Webhook] Failed to process:', err);
        // Still return 200 to Alchemy so they don't retry
    }
    // Always return 200 OK to Alchemy (even if processing fails)
    // This prevents Alchemy from retrying the webhook
    return (0, utils_1.sendSuccess)(res, { received: true, logsProcessed: webhookEvent.block.logs.length }, 'Webhook processed');
});
