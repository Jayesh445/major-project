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
/**
 * Internal API routes — used exclusively by the Mastra AI module.
 * Protected by X-Internal-Api-Key header, NOT by user JWT.
 *
 * Base path: /api/internal
 */
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const model_1 = __importDefault(require("@/modules/product/model"));
const model_2 = __importDefault(require("@/modules/warehouse/model"));
const model_3 = __importDefault(require("@/modules/inventory/model"));
const model_4 = __importDefault(require("@/modules/supplier/model"));
const model_5 = __importDefault(require("@/modules/negotiation/model"));
const model_6 = __importDefault(require("@/modules/purchase-order/model"));
const model_7 = __importDefault(require("@/modules/blockchain/model"));
const model_8 = __importDefault(require("@/modules/forecast/model"));
const model_9 = __importDefault(require("@/modules/warehouse-optimization/model"));
const reorder_recommendation_model_1 = __importDefault(require("@/modules/agents/reorder-recommendation.model"));
const utils_1 = require("@/utils");
const router = (0, express_1.Router)();
// ── Products ──────────────────────────────────────────────────────────────────
// GET /api/internal/products/:id
router.get('/products/:id', (0, utils_1.asyncHandler)(async (req, res) => {
    const product = await model_1.default.findById(req.params.id)
        .select('name sku isActive')
        .lean();
    if (!product) {
        return res.status(404).json({ message: `Product ${req.params.id} not found` });
    }
    return res.json(product);
}));
// ── Warehouses ────────────────────────────────────────────────────────────────
// GET /api/internal/warehouses — all active warehouses
router.get('/warehouses', (0, utils_1.asyncHandler)(async (_req, res) => {
    const warehouses = await model_2.default.find({ isActive: true })
        .select('name code location totalCapacity usedCapacity isActive')
        .lean();
    return res.json(warehouses);
}));
// GET /api/internal/warehouses/:id
router.get('/warehouses/:id', (0, utils_1.asyncHandler)(async (req, res) => {
    const warehouse = await model_2.default.findById(req.params.id)
        .select('name code isActive')
        .lean();
    if (!warehouse) {
        return res.status(404).json({ message: `Warehouse ${req.params.id} not found` });
    }
    return res.json(warehouse);
}));
// ── Inventory ─────────────────────────────────────────────────────────────────
// GET /api/internal/inventory?product=X&warehouse=Y
// Returns single inventory record with full transactions array
router.get('/inventory', (0, utils_1.asyncHandler)(async (req, res) => {
    const { product, warehouse } = req.query;
    if (!product || !warehouse) {
        return res
            .status(400)
            .json({ message: 'Both product and warehouse query params are required' });
    }
    const inventory = await model_3.default.findOne({
        product: new mongoose_1.default.Types.ObjectId(product),
        warehouse: new mongoose_1.default.Types.ObjectId(warehouse),
    })
        .populate('product', 'name sku')
        .lean();
    if (!inventory) {
        return res.status(404).json({
            message: `No inventory record found for product ${product} in warehouse ${warehouse}`,
        });
    }
    return res.json(inventory);
}));
// GET /api/internal/inventory/all — all active inventory (for warehouse optimization)
router.get('/inventory/all', (0, utils_1.asyncHandler)(async (_req, res) => {
    const inventories = await model_3.default.find({})
        .populate('product', 'name sku isActive')
        .populate('warehouse', 'name code isActive')
        .lean();
    return res.json(inventories);
}));
// ── Save Forecast ─────────────────────────────────────────────────────────────
// POST /api/internal/forecasts
router.post('/forecasts', (0, utils_1.asyncHandler)(async (req, res) => {
    const doc = new model_8.default(req.body);
    await doc.save();
    return res.status(201).json({ _id: doc._id.toString() });
}));
// ── Save Warehouse Optimization Recommendation ────────────────────────────────
// POST /api/internal/warehouse-optimization
router.post('/warehouse-optimization', (0, utils_1.asyncHandler)(async (req, res) => {
    const doc = new model_9.default(req.body);
    await doc.save();
    return res.status(201).json({ _id: doc._id.toString() });
}));
// ── Suppliers ────────────────────────────────────────────────────────────────
// GET /api/internal/suppliers — all approved suppliers
router.get('/suppliers', (0, utils_1.asyncHandler)(async (_req, res) => {
    const suppliers = await model_4.default.find({ isApproved: true })
        .populate('catalogProducts.product', 'name sku')
        .lean();
    return res.json(suppliers);
}));
// GET /api/internal/suppliers/:id
router.get('/suppliers/:id', (0, utils_1.asyncHandler)(async (req, res) => {
    const supplier = await model_4.default.findById(req.params.id)
        .populate('catalogProducts.product', 'name sku')
        .lean();
    if (!supplier) {
        return res.status(404).json({ message: `Supplier ${req.params.id} not found` });
    }
    return res.json(supplier);
}));
// GET /api/internal/suppliers/by-product/:productId — suppliers that carry a product
router.get('/suppliers/by-product/:productId', (0, utils_1.asyncHandler)(async (req, res) => {
    const suppliers = await model_4.default.find({
        isApproved: true,
        'catalogProducts.product': new mongoose_1.default.Types.ObjectId(req.params.productId),
    })
        .populate('catalogProducts.product', 'name sku')
        .lean();
    return res.json(suppliers);
}));
// PATCH /api/internal/suppliers/:id/stats — update negotiation stats
router.patch('/suppliers/:id/stats', (0, utils_1.asyncHandler)(async (req, res) => {
    const supplier = await model_4.default.findByIdAndUpdate(req.params.id, { $set: { negotiationStats: req.body } }, { new: true }).lean();
    if (!supplier) {
        return res.status(404).json({ message: `Supplier ${req.params.id} not found` });
    }
    return res.json(supplier);
}));
// ── Negotiations ─────────────────────────────────────────────────────────────
// POST /api/internal/negotiations — create a new negotiation session
router.post('/negotiations', (0, utils_1.asyncHandler)(async (req, res) => {
    const doc = new model_5.default(req.body);
    await doc.save();
    return res.status(201).json({ _id: doc._id.toString() });
}));
// GET /api/internal/negotiations/:id
router.get('/negotiations/:id', (0, utils_1.asyncHandler)(async (req, res) => {
    const session = await model_5.default.findById(req.params.id)
        .populate('supplier', 'companyName contactEmail')
        .populate('product', 'name sku')
        .lean();
    if (!session) {
        return res.status(404).json({ message: `Negotiation ${req.params.id} not found` });
    }
    return res.json(session);
}));
// PATCH /api/internal/negotiations/:id — update negotiation (add rounds, change status)
router.patch('/negotiations/:id', (0, utils_1.asyncHandler)(async (req, res) => {
    const session = await model_5.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!session) {
        return res.status(404).json({ message: `Negotiation ${req.params.id} not found` });
    }
    return res.json(session);
}));
// POST /api/internal/negotiations/:id/rounds — push a new round
router.post('/negotiations/:id/rounds', (0, utils_1.asyncHandler)(async (req, res) => {
    const session = await model_5.default.findByIdAndUpdate(req.params.id, { $push: { rounds: req.body } }, { new: true, runValidators: true }).lean();
    if (!session) {
        return res.status(404).json({ message: `Negotiation ${req.params.id} not found` });
    }
    return res.json(session);
}));
// ── Purchase Orders ──────────────────────────────────────────────────────────
// POST /api/internal/purchase-orders — create a PO
router.post('/purchase-orders', (0, utils_1.asyncHandler)(async (req, res) => {
    const doc = new model_6.default(req.body);
    await doc.save();
    return res.status(201).json({ _id: doc._id.toString(), poNumber: doc.poNumber });
}));
// GET /api/internal/purchase-orders/:id
router.get('/purchase-orders/:id', (0, utils_1.asyncHandler)(async (req, res) => {
    const po = await model_6.default.findById(req.params.id)
        .populate('supplier', 'companyName contactEmail')
        .populate('warehouse', 'name code')
        .lean();
    if (!po) {
        return res.status(404).json({ message: `PO ${req.params.id} not found` });
    }
    return res.json(po);
}));
// PATCH /api/internal/purchase-orders/:id — update PO status
router.patch('/purchase-orders/:id', (0, utils_1.asyncHandler)(async (req, res) => {
    const po = await model_6.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!po) {
        return res.status(404).json({ message: `PO ${req.params.id} not found` });
    }
    return res.json(po);
}));
// GET /api/internal/purchase-orders — list POs with optional filters
router.get('/purchase-orders', (0, utils_1.asyncHandler)(async (req, res) => {
    const { supplier, warehouse, status, limit } = req.query;
    const filter = {};
    if (supplier)
        filter.supplier = new mongoose_1.default.Types.ObjectId(supplier);
    if (warehouse)
        filter.warehouse = new mongoose_1.default.Types.ObjectId(warehouse);
    if (status)
        filter.status = status;
    const orders = await model_6.default.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit) || 50)
        .populate('supplier', 'companyName')
        .populate('warehouse', 'name code')
        .lean();
    return res.json(orders);
}));
// ── Blockchain Logs ──────────────────────────────────────────────────────────
// POST /api/internal/blockchain-logs — create a blockchain log entry
// Delegates to blockchain service which submits real on-chain tx (or uses fallback)
router.post('/blockchain-logs', (0, utils_1.asyncHandler)(async (req, res) => {
    const { logEventOnChain } = await Promise.resolve().then(() => __importStar(require('@/modules/blockchain/service')));
    const { eventType, referenceModel, referenceId, payload, amount, triggeredBy } = req.body;
    try {
        const result = await logEventOnChain({
            eventType,
            referenceModel,
            referenceId,
            payload: payload || {},
            amount,
            triggeredBy,
        });
        return res.status(201).json({
            _id: result._id,
            txHash: result.txHash,
            confirmationStatus: result.confirmationStatus,
            etherscanUrl: result.etherscanUrl,
        });
    }
    catch (err) {
        // Fall back to raw insert if blockchain service fails (preserves current behavior)
        console.warn('[internal] Blockchain service failed, falling back to raw insert:', err.message);
        const doc = new model_7.default(req.body);
        await doc.save();
        return res.status(201).json({ _id: doc._id.toString() });
    }
}));
// GET /api/internal/blockchain-logs — list logs by reference
router.get('/blockchain-logs', (0, utils_1.asyncHandler)(async (req, res) => {
    const { referenceId, referenceModel, eventType } = req.query;
    const filter = {};
    if (referenceId)
        filter.referenceId = new mongoose_1.default.Types.ObjectId(referenceId);
    if (referenceModel)
        filter.referenceModel = referenceModel;
    if (eventType)
        filter.eventType = eventType;
    const logs = await model_7.default.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(logs);
}));
// ── Demand Forecasts (read) ──────────────────────────────────────────────────
// GET /api/internal/forecasts — latest forecasts
router.get('/forecasts', (0, utils_1.asyncHandler)(async (req, res) => {
    const { product, warehouse, limit } = req.query;
    const filter = {};
    if (product)
        filter.product = new mongoose_1.default.Types.ObjectId(product);
    if (warehouse)
        filter.warehouse = new mongoose_1.default.Types.ObjectId(warehouse);
    const forecasts = await model_8.default.find(filter)
        .sort({ forecastedAt: -1 })
        .limit(Number(limit) || 10)
        .lean();
    return res.json(forecasts);
}));
// ── Reorder Recommendations ──────────────────────────────────────────────────
// POST /api/internal/reorder-recommendations — bulk upsert from smart-reorder workflow
router.post('/reorder-recommendations', (0, utils_1.asyncHandler)(async (req, res) => {
    const { recommendations } = req.body;
    if (!Array.isArray(recommendations)) {
        return res.status(400).json({ message: 'recommendations must be an array' });
    }
    // Mark any previous pending recommendations for the same product-warehouse as expired
    // so the new ones become the active set
    const productWarehousePairs = recommendations.map((r) => ({
        product: r.product,
        warehouse: r.warehouse,
    }));
    if (productWarehousePairs.length > 0) {
        await reorder_recommendation_model_1.default.updateMany({
            status: 'pending',
            $or: productWarehousePairs.map((pw) => ({
                product: pw.product,
                warehouse: pw.warehouse,
            })),
        }, { $set: { status: 'expired' } });
    }
    // Insert new recommendations
    const created = await reorder_recommendation_model_1.default.insertMany(recommendations);
    return res.status(201).json({ count: created.length, ids: created.map((c) => c._id) });
}));
exports.default = router;
