import { Router } from 'express';
import { InventoryController } from './controller';
import { authenticate, authorize } from '@/middlewares';

/**
 * Inventory routes
 * Base path: /api/v1/inventory
 */
const router = Router();
const controller = new InventoryController();

// Note: Uncomment authentication/authorization middleware after implementing user module middleware

/**
 * Special routes (must come before :id routes to avoid conflicts)
 */

// Get low stock items
router.get(
  '/low-stock',
  authenticate,
  controller.getLowStockItems
);

// Transfer stock between warehouses
router.post(
  '/transfer',
  authenticate,
  authorize('admin', 'warehouse_manager'),
  controller.transferStock
);

// Get stock report
router.get(
  '/stock-report',
  authenticate,
  controller.getStockReport
);

// Get inventory valuation
router.get(
  '/valuation',
  authenticate,
  authorize('admin', 'procurement_officer'),
  controller.getValuation
);

/**
 * Standard CRUD routes
 */

// Initialize inventory
router.post(
  '/',
  authenticate,
  authorize('admin', 'warehouse_manager'),
  controller.initialize
);

// Get all inventory
router.get(
  '/',
  authenticate,
  controller.findAll
);

// Get inventory by ID
router.get(
  '/:id',
  authenticate,
  controller.findById
);

/**
 * Stock operation routes
 */

// Adjust stock
router.put(
  '/:id/adjust',
  authenticate,
  authorize('admin', 'warehouse_manager'),
  controller.adjustStock
);

// Reserve stock
router.post(
  '/:id/reserve',
  authenticate,
  controller.reserveStock
);

// Release reservation
router.post(
  '/:id/release',
  authenticate,
  controller.releaseReservation
);

// Update reorder settings
router.put(
  '/:id/reorder-settings',
  authenticate,
  authorize('admin', 'procurement_officer'),
  controller.updateReorderSettings
);

// Trigger replenishment
router.post(
  '/:id/trigger-replenishment',
  authenticate,
  authorize('admin', 'warehouse_manager', 'procurement_officer'),
  controller.triggerReplenishment
);

/**
 * Analytics routes
 */

// Get transaction history
router.get(
  '/:id/transactions',
  authenticate,
  controller.getTransactionHistory
);

export default router;
