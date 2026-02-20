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
import DemandForecast from '@/modules/forecast/model';
import WarehouseOptimizationRecommendation from '@/modules/warehouse-optimization/model';
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

export default router;
