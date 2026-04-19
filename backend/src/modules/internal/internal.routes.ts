/**
 * Internal API routes — used exclusively by the Mastra AI module.
 * Protected by X-Internal-Api-Key header, NOT by user JWT.
 *
 * Base path: /api/internal
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '@/modules/product/model';
import Warehouse from '@/modules/warehouse/model';
import Inventory from '@/modules/inventory/model';
import Supplier from '@/modules/supplier/model';
import NegotiationSession from '@/modules/negotiation/model';
import PurchaseOrder from '@/modules/purchase-order/model';
import BlockchainLog from '@/modules/blockchain/model';
import DemandForecast from '@/modules/forecast/model';
import WarehouseOptimizationRecommendation from '@/modules/warehouse-optimization/model';
import ReorderRecommendation from '@/modules/agents/reorder-recommendation.model';
import { asyncHandler } from '@/utils';

const router = Router();

// ── Products ──────────────────────────────────────────────────────────────────

// GET /api/internal/products/:id
router.get(
  '/products/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id)
      .select('name sku isActive')
      .lean();

    if (!product) {
      return res.status(404).json({ message: `Product ${req.params.id} not found` });
    }

    return res.json(product);
  })
);

// ── Warehouses ────────────────────────────────────────────────────────────────

// GET /api/internal/warehouses — all active warehouses
router.get(
  '/warehouses',
  asyncHandler(async (_req: Request, res: Response) => {
    const warehouses = await Warehouse.find({ isActive: true })
      .select('name code location totalCapacity usedCapacity isActive')
      .lean();

    return res.json(warehouses);
  })
);

// GET /api/internal/warehouses/:id
router.get(
  '/warehouses/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const warehouse = await Warehouse.findById(req.params.id)
      .select('name code isActive')
      .lean();

    if (!warehouse) {
      return res.status(404).json({ message: `Warehouse ${req.params.id} not found` });
    }

    return res.json(warehouse);
  })
);

// ── Inventory ─────────────────────────────────────────────────────────────────

// GET /api/internal/inventory?product=X&warehouse=Y
// Returns single inventory record with full transactions array
router.get(
  '/inventory',
  asyncHandler(async (req: Request, res: Response) => {
    const { product, warehouse } = req.query as { product?: string; warehouse?: string };

    if (!product || !warehouse) {
      return res
        .status(400)
        .json({ message: 'Both product and warehouse query params are required' });
    }

    const inventory = await Inventory.findOne({
      product: new mongoose.Types.ObjectId(product),
      warehouse: new mongoose.Types.ObjectId(warehouse),
    })
      .populate('product', 'name sku')
      .lean();

    if (!inventory) {
      return res.status(404).json({
        message: `No inventory record found for product ${product} in warehouse ${warehouse}`,
      });
    }

    return res.json(inventory);
  })
);

// GET /api/internal/inventory/all — all active inventory (for warehouse optimization)
router.get(
  '/inventory/all',
  asyncHandler(async (_req: Request, res: Response) => {
    const inventories = await Inventory.find({})
      .populate('product', 'name sku isActive')
      .populate('warehouse', 'name code isActive')
      .lean();

    return res.json(inventories);
  })
);

// ── Save Forecast ─────────────────────────────────────────────────────────────

// POST /api/internal/forecasts
router.post(
  '/forecasts',
  asyncHandler(async (req: Request, res: Response) => {
    const doc = new DemandForecast(req.body);
    await doc.save();
    return res.status(201).json({ _id: doc._id.toString() });
  })
);

// ── Save Warehouse Optimization Recommendation ────────────────────────────────

// POST /api/internal/warehouse-optimization
router.post(
  '/warehouse-optimization',
  asyncHandler(async (req: Request, res: Response) => {
    const doc = new WarehouseOptimizationRecommendation(req.body);
    await doc.save();
    return res.status(201).json({ _id: doc._id.toString() });
  })
);

// ── Suppliers ────────────────────────────────────────────────────────────────

// GET /api/internal/suppliers — all approved suppliers
router.get(
  '/suppliers',
  asyncHandler(async (_req: Request, res: Response) => {
    const suppliers = await Supplier.find({ isApproved: true })
      .populate('catalogProducts.product', 'name sku')
      .lean();
    return res.json(suppliers);
  })
);

// GET /api/internal/suppliers/:id
router.get(
  '/suppliers/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const supplier = await Supplier.findById(req.params.id)
      .populate('catalogProducts.product', 'name sku')
      .lean();
    if (!supplier) {
      return res.status(404).json({ message: `Supplier ${req.params.id} not found` });
    }
    return res.json(supplier);
  })
);

// GET /api/internal/suppliers/by-product/:productId — suppliers that carry a product
router.get(
  '/suppliers/by-product/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    const suppliers = await Supplier.find({
      isApproved: true,
      'catalogProducts.product': new mongoose.Types.ObjectId(req.params.productId),
    })
      .populate('catalogProducts.product', 'name sku')
      .lean();
    return res.json(suppliers);
  })
);

// PATCH /api/internal/suppliers/:id/stats — update negotiation stats
router.patch(
  '/suppliers/:id/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: { negotiationStats: req.body } },
      { new: true }
    ).lean();
    if (!supplier) {
      return res.status(404).json({ message: `Supplier ${req.params.id} not found` });
    }
    return res.json(supplier);
  })
);

// ── Negotiations ─────────────────────────────────────────────────────────────

// POST /api/internal/negotiations — create a new negotiation session
router.post(
  '/negotiations',
  asyncHandler(async (req: Request, res: Response) => {
    const doc = new NegotiationSession(req.body);
    await doc.save();
    return res.status(201).json({ _id: doc._id.toString() });
  })
);

// GET /api/internal/negotiations/:id
router.get(
  '/negotiations/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const session = await NegotiationSession.findById(req.params.id)
      .populate('supplier', 'companyName contactEmail')
      .populate('product', 'name sku')
      .lean();
    if (!session) {
      return res.status(404).json({ message: `Negotiation ${req.params.id} not found` });
    }
    return res.json(session);
  })
);

// PATCH /api/internal/negotiations/:id — update negotiation (add rounds, change status)
router.patch(
  '/negotiations/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const session = await NegotiationSession.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!session) {
      return res.status(404).json({ message: `Negotiation ${req.params.id} not found` });
    }
    return res.json(session);
  })
);

// POST /api/internal/negotiations/:id/rounds — push a new round
router.post(
  '/negotiations/:id/rounds',
  asyncHandler(async (req: Request, res: Response) => {
    const session = await NegotiationSession.findByIdAndUpdate(
      req.params.id,
      { $push: { rounds: req.body } },
      { new: true, runValidators: true }
    ).lean();
    if (!session) {
      return res.status(404).json({ message: `Negotiation ${req.params.id} not found` });
    }
    return res.json(session);
  })
);

// ── Purchase Orders ──────────────────────────────────────────────────────────

// POST /api/internal/purchase-orders — create a PO
router.post(
  '/purchase-orders',
  asyncHandler(async (req: Request, res: Response) => {
    const doc = new PurchaseOrder(req.body);
    await doc.save();
    return res.status(201).json({ _id: doc._id.toString(), poNumber: doc.poNumber });
  })
);

// GET /api/internal/purchase-orders/:id
router.get(
  '/purchase-orders/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'companyName contactEmail')
      .populate('warehouse', 'name code')
      .lean();
    if (!po) {
      return res.status(404).json({ message: `PO ${req.params.id} not found` });
    }
    return res.json(po);
  })
);

// PATCH /api/internal/purchase-orders/:id — update PO status
router.patch(
  '/purchase-orders/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const po = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!po) {
      return res.status(404).json({ message: `PO ${req.params.id} not found` });
    }
    return res.json(po);
  })
);

// GET /api/internal/purchase-orders — list POs with optional filters
router.get(
  '/purchase-orders',
  asyncHandler(async (req: Request, res: Response) => {
    const { supplier, warehouse, status, limit } = req.query;
    const filter: any = {};
    if (supplier) filter.supplier = new mongoose.Types.ObjectId(supplier as string);
    if (warehouse) filter.warehouse = new mongoose.Types.ObjectId(warehouse as string);
    if (status) filter.status = status;

    const orders = await PurchaseOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 50)
      .populate('supplier', 'companyName')
      .populate('warehouse', 'name code')
      .lean();
    return res.json(orders);
  })
);

// ── Blockchain Logs ──────────────────────────────────────────────────────────

// POST /api/internal/blockchain-logs — create a blockchain log entry
// Delegates to blockchain service which submits real on-chain tx (or uses fallback)
router.post(
  '/blockchain-logs',
  asyncHandler(async (req: Request, res: Response) => {
    const { logEventOnChain } = await import('@/modules/blockchain/service');
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
    } catch (err: any) {
      // Fall back to raw insert if blockchain service fails (preserves current behavior)
      console.warn('[internal] Blockchain service failed, falling back to raw insert:', err.message);
      const doc = new BlockchainLog(req.body);
      await doc.save();
      return res.status(201).json({ _id: doc._id.toString() });
    }
  })
);

// GET /api/internal/blockchain-logs — list logs by reference
router.get(
  '/blockchain-logs',
  asyncHandler(async (req: Request, res: Response) => {
    const { referenceId, referenceModel, eventType } = req.query;
    const filter: any = {};
    if (referenceId) filter.referenceId = new mongoose.Types.ObjectId(referenceId as string);
    if (referenceModel) filter.referenceModel = referenceModel;
    if (eventType) filter.eventType = eventType;

    const logs = await BlockchainLog.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(logs);
  })
);

// ── Demand Forecasts (read) ──────────────────────────────────────────────────

// GET /api/internal/forecasts — latest forecasts
router.get(
  '/forecasts',
  asyncHandler(async (req: Request, res: Response) => {
    const { product, warehouse, limit } = req.query;
    const filter: any = {};
    if (product) filter.product = new mongoose.Types.ObjectId(product as string);
    if (warehouse) filter.warehouse = new mongoose.Types.ObjectId(warehouse as string);

    const forecasts = await DemandForecast.find(filter)
      .sort({ forecastedAt: -1 })
      .limit(Number(limit) || 10)
      .lean();
    return res.json(forecasts);
  })
);

// ── Reorder Recommendations ──────────────────────────────────────────────────

// POST /api/internal/reorder-recommendations — bulk upsert from smart-reorder workflow
router.post(
  '/reorder-recommendations',
  asyncHandler(async (req: Request, res: Response) => {
    const { recommendations } = req.body;
    if (!Array.isArray(recommendations)) {
      return res.status(400).json({ message: 'recommendations must be an array' });
    }

    // Mark any previous pending recommendations for the same product-warehouse as expired
    // so the new ones become the active set
    const productWarehousePairs = recommendations.map((r: any) => ({
      product: r.product,
      warehouse: r.warehouse,
    }));

    if (productWarehousePairs.length > 0) {
      await ReorderRecommendation.updateMany(
        {
          status: 'pending',
          $or: productWarehousePairs.map((pw: any) => ({
            product: pw.product,
            warehouse: pw.warehouse,
          })),
        },
        { $set: { status: 'expired' } }
      );
    }

    // Insert new recommendations
    const created = await ReorderRecommendation.insertMany(recommendations);
    return res.status(201).json({ count: created.length, ids: created.map((c) => c._id) });
  })
);

export default router;
